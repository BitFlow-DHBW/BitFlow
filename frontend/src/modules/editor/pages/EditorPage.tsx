import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '../components/Canvas';
import { CollaborationPanel } from '../components/CollaborationPanel';
import { CustomComponentDialog } from '../components/CustomComponentDialog';
import { CustomComponentImportDialog } from '../components/CustomComponentImportDialog';
import { Inspector } from '../components/Inspector';
import { Library } from '../components/Library';
import { SignalViewer } from '../components/SignalViewer';
import { SimulationPanel } from '../components/SimulationPanel';
import { Toolbar } from '../components/Toolbar';
import { buildInviteLink, readSessionIdFromSearch } from '../collaborationLinks';
import { canSaveProject, createCollaborationCircuitState } from '../collaborationState';
import { useAuth } from '../../auth/AuthContext';
import { usePreferences } from '../../settings/PreferencesContext';
import { useHistory } from '../../../hooks/useHistory';
import { useCollaborationSession } from '../../../hooks/useCollaborationSession';
import { projectService } from '../../../services/projectService';
import { createCustomGate, createGate, createStarterCircuit, gateRectPx, snapToGrid } from '../../../simulation/gateLibrary';
import { evaluateCircuit } from '../../../simulation/evaluateCircuit';
import { buildCircuitNets } from '../../../simulation/netModel';
import type {
  Circuit,
  CustomComponent,
  DragState,
  EditorMode,
  EditorTool,
  Gate,
  Point,
  SignalState,
  WireDraft,
  WireEndpoint,
} from '../../../types/circuit';
import type { Project } from '../../../types/domain';
import type { CollaborationCircuitState } from '../../../types/collaboration';
import { createId } from '../../../utils/id';
import { isEditableTarget, shortcutMatches } from '../../../utils/keyboardShortcuts';

function nextCircuitVersion(circuit: Circuit): Circuit {
  return { ...circuit, version: circuit.version + 1 };
}

function buildWireId(sourcePinId: string, targetPinId: string): string {
  return `wire_${sourcePinId}_to_${targetPinId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function normalizePointEndpoint(endpoint: WireEndpoint): WireEndpoint {
  if (endpoint.kind !== 'point') return endpoint;
  return {
    kind: 'point',
    point: {
      x: snapToGrid(endpoint.point.x),
      y: snapToGrid(endpoint.point.y),
    },
  };
}

function sameEndpoint(a: WireEndpoint, b: WireEndpoint): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'pin' && b.kind === 'pin') return a.pinId === b.pinId;
  if (a.kind === 'wire' && b.kind === 'wire') return a.wireId === b.wireId;
  if (a.kind === 'point' && b.kind === 'point') {
    return snapToGrid(a.point.x) === snapToGrid(b.point.x) && snapToGrid(a.point.y) === snapToGrid(b.point.y);
  }
  return false;
}

function endpointUsesPin(endpoint: WireEndpoint | undefined, pinIds: Set<string>): boolean {
  return endpoint?.kind === 'pin' ? pinIds.has(endpoint.pinId) : false;
}

function signalStatesEqual(a: SignalState, b: SignalState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (Boolean(a[key]) !== Boolean(b[key])) return false;
  }
  return true;
}

const TOOL_PREVIEW_GATE_ID = 'tool_preview';
const UNSAVED_CHANGES_MESSAGE = 'Es gibt ungespeicherte Aenderungen. Seite wirklich verlassen?';

function createTransientSessionProject(sessionId: string, ownerId: string | undefined): Project {
  const now = new Date().toISOString();
  const circuit = createStarterCircuit('Shared Session');

  return {
    id: `session_${sessionId}`,
    ownerId: ownerId ?? 'session_guest',
    name: 'Shared Session',
    description: 'Live collaboration session',
    circuit,
    inputSignals: {},
    customComponents: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function EditorPage() {
  const { projectId, sessionId: routeSessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const linkedSessionId = routeSessionId ?? readSessionIdFromSearch(location.search);
  const transientSessionProject = useMemo(
    () => (routeSessionId && !projectId ? createTransientSessionProject(routeSessionId, user?.id) : null),
    [projectId, routeSessionId, user?.id],
  );

  useEffect(() => {
    let active = true;

    async function loadProject() {
      if (transientSessionProject) {
        setLoading(false);
        return;
      }

      if (!user || !projectId) return;
      setLoading(true);
      const nextProject = await projectService.getProject(projectId);
      if (active) {
        setProject(nextProject);
        setLoading(false);
      }
    }

    void loadProject();
    return () => {
      active = false;
    };
  }, [projectId, transientSessionProject, user]);

  if (transientSessionProject) {
    return (
      <EditorWorkspace
        project={transientSessionProject}
        initialSessionId={routeSessionId ?? null}
        isSessionOnlyProject
        onProjectSaved={() => undefined}
      />
    );
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="empty-state">Projekt wird geladen.</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="page-shell">
        <div className="empty-state">
          <h1>Projekt nicht gefunden</h1>
          <button className="primary-button" type="button" onClick={() => navigate('/projects')}>
            Zur Projektübersicht
          </button>
        </div>
      </main>
    );
  }

  return <EditorWorkspace project={project} initialSessionId={linkedSessionId} onProjectSaved={setProject} />;
}

function EditorWorkspace({
  project,
  initialSessionId = null,
  isSessionOnlyProject = false,
  onProjectSaved,
}: {
  project: Project;
  initialSessionId?: string | null;
  isSessionOnlyProject?: boolean;
  onProjectSaved: (project: Project) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const history = useHistory<Circuit>(project.circuit, project.id);
  const currentUrlRef = useRef(`${location.pathname}${location.search}${location.hash}`);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragStartCircuit, setDragStartCircuit] = useState<Circuit | null>(null);
  const [wireDraft, setWireDraft] = useState<WireDraft | null>(null);
  const [draggedTool, setDraggedTool] = useState<EditorTool | null>(null);
  const [toolPreviewGate, setToolPreviewGate] = useState<Gate | null>(null);
  const [inputSignals, setInputSignals] = useState<SignalState>(project.inputSignals);
  const [simulationMemory, setSimulationMemory] = useState<SignalState>({});
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>(project.customComponents);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState('Gespeichert');
  const currentEditorStateRef = useRef<CollaborationCircuitState>(
    createCollaborationCircuitState(history.state, inputSignals, customComponents),
  );

  useEffect(() => {
    setInputSignals(project.inputSignals);
    setCustomComponents(project.customComponents);
    setHasUnsavedChanges(false);
    setSaveState('Gespeichert');
  }, [project.id, project.inputSignals, project.customComponents]);

  useEffect(() => {
    currentUrlRef.current = `${location.pathname}${location.search}${location.hash}`;
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    function handlePopState(event: PopStateEvent) {
      if (window.confirm(UNSAVED_CHANGES_MESSAGE)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.history.pushState(null, '', currentUrlRef.current);
    }

    window.addEventListener('popstate', handlePopState, true);
    return () => window.removeEventListener('popstate', handlePopState, true);
  }, [hasUnsavedChanges]);

  const currentEditorState = useMemo(
    () => createCollaborationCircuitState(history.state, inputSignals, customComponents),
    [customComponents, history.state, inputSignals],
  );

  useEffect(() => {
    currentEditorStateRef.current = currentEditorState;
  }, [currentEditorState]);

  const applyRemoteEditorState = useCallback(
    (remoteState: CollaborationCircuitState) => {
      const nextComponents = remoteState.customComponents ?? remoteState.circuit.customComponents ?? [];

      history.replace({
        ...remoteState.circuit,
        customComponents: nextComponents,
      });
      setInputSignals(remoteState.inputSignals ?? {});
      setCustomComponents(nextComponents);
      setSelectedGateId(null);
      setSelectedWireId(null);
      setWireDraft(null);
      setDragState(null);
      setHasUnsavedChanges(true);
      setSaveState('Ungespeichert');
    },
    [history],
  );

  const collaboration = useCollaborationSession({
    autoJoinSessionId: initialSessionId,
    displayName: user?.name ?? 'User',
    getCurrentState: () => currentEditorStateRef.current,
    onRemoteState: applyRemoteEditorState,
  });

  const inviteLink = useMemo(
    () => (collaboration.session ? buildInviteLink(collaboration.session.sessionId) : null),
    [collaboration.session],
  );

  const canSave = canSaveProject(collaboration.role, isSessionOnlyProject);

  const publishCollaborationState = useCallback(
    (
      circuit: Circuit,
      nextSignals = inputSignals,
      nextComponents = customComponents,
      immediate = true,
    ) => {
      collaboration.broadcastCircuit(
        createCollaborationCircuitState(circuit, nextSignals, nextComponents),
        immediate,
      );
    },
    [collaboration, customComponents, inputSignals],
  );

  const signals = useMemo(
    () => evaluateCircuit(history.state, { ...simulationMemory, ...inputSignals }),
    [history.state, inputSignals, simulationMemory],
  );

  useEffect(() => {
    setSimulationMemory((current) => {
      const next = { ...current, ...signals };
      return signalStatesEqual(current, next) ? current : next;
    });
  }, [signals]);

  const selectedGate = history.state.gates.find((gate) => gate.id === selectedGateId) ?? null;
  const selectedWire = history.state.wires.find((wire) => wire.id === selectedWireId) ?? null;

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
    setSaveState('Ungespeichert');
  }, []);

  const confirmNavigation = useCallback(
    () => !hasUnsavedChanges || window.confirm(UNSAVED_CHANGES_MESSAGE),
    [hasUnsavedChanges],
  );

  const commitCircuit = useCallback(
    (
      circuit: Circuit,
      previous?: Circuit,
      options: { inputSignals?: SignalState; customComponents?: CustomComponent[]; immediate?: boolean } = {},
    ) => {
      const nextCircuit = nextCircuitVersion(circuit);
      history.set(nextCircuit, previous);
      markUnsaved();
      publishCollaborationState(
        nextCircuit,
        options.inputSignals ?? inputSignals,
        options.customComponents ?? customComponents,
        options.immediate ?? true,
      );
    },
    [customComponents, history, inputSignals, markUnsaved, publishCollaborationState],
  );

  const replaceCircuit = useCallback(
    (circuit: Circuit) => {
      history.replace(circuit);
      markUnsaved();
      publishCollaborationState(circuit, inputSignals, customComponents, false);
    },
    [customComponents, history, inputSignals, markUnsaved, publishCollaborationState],
  );

  function handleCanvasClick(point: Point) {
    if (mode !== 'edit' || !selectedTool || wireDraft) return;
    placeTool(selectedTool, point);
  }

  function createGateDraft(tool: EditorTool, id?: string): Gate | null {
    if (tool.kind === 'builtin') return createGate(tool.type, 0, 0, id);

    const component =
      customComponents.find((entry) => entry.id === tool.componentId) ??
      history.state.customComponents.find((entry) => entry.id === tool.componentId);
    return component ? createCustomGate(component, 0, 0, id) : null;
  }

  function positionGateAt(gateDraft: Gate, point: Point): Gate {
    const rect = gateRectPx(gateDraft);
    return {
      ...gateDraft,
      x: Math.max(0, snapToGrid(point.x - rect.width / 2)),
      y: Math.max(0, snapToGrid(point.y - rect.height / 2)),
    };
  }

  function placeTool(tool: EditorTool, point: Point) {
    const gateDraft = createGateDraft(tool);

    if (!gateDraft) {
      setSelectedTool(null);
      return;
    }

    const gate = positionGateAt(gateDraft, point);

    commitCircuit({
      ...history.state,
      gates: [...history.state.gates, gate],
    });
    setSelectedGateId(gate.id);
    setSelectedWireId(null);
    setMode('edit');
  }

  function handleToolDragStart(tool: EditorTool) {
    setDraggedTool(tool);
    setToolPreviewGate(null);
    setSelectedTool(null);
    setMode('edit');
  }

  function handleToolDragPreview(point: Point) {
    if (!draggedTool) return;
    const gateDraft = createGateDraft(draggedTool, TOOL_PREVIEW_GATE_ID);
    if (!gateDraft) return;
    const nextGate = positionGateAt(gateDraft, point);

    setToolPreviewGate((current) =>
      current?.type === nextGate.type &&
      current.customComponentId === nextGate.customComponentId &&
      current.x === nextGate.x &&
      current.y === nextGate.y
        ? current
        : nextGate,
    );
  }

  const clearToolDragPreview = useCallback(() => {
    setDraggedTool(null);
    setToolPreviewGate(null);
  }, []);

  function handleGateDragStart(gate: Gate, point: Point) {
    setDragStartCircuit(history.state);
    setDragState({
      gateId: gate.id,
      offsetX: point.x - gate.x,
      offsetY: point.y - gate.y,
    });
  }

  function handleDragMove(point: Point) {
    if (!dragState) return;

    const nextX = Math.max(0, snapToGrid(point.x - dragState.offsetX));
    const nextY = Math.max(0, snapToGrid(point.y - dragState.offsetY));
    replaceCircuit({
      ...history.state,
      gates: history.state.gates.map((gate) =>
        gate.id === dragState.gateId ? { ...gate, x: nextX, y: nextY } : gate,
      ),
    });
  }

  function handleDragEnd() {
    if (!dragState) return;
    if (dragStartCircuit) {
      const nextCircuit = nextCircuitVersion(history.state);
      history.set(nextCircuit, dragStartCircuit);
      publishCollaborationState(nextCircuit, inputSignals, customComponents, true);
    }
    setDragState(null);
    setDragStartCircuit(null);
  }

  function handleWireStart(endpoint: WireEndpoint, point: Point) {
    setSelectedTool(null);
    setSelectedGateId(null);
    setWireDraft({ start: endpoint, from: point, to: point });
  }

  function handleWireEnd(endpoint: WireEndpoint) {
    if (!wireDraft) return;
    const nextEndpoint = normalizePointEndpoint(endpoint);

    if (sameEndpoint(wireDraft.start, nextEndpoint)) {
      setWireDraft(null);
      return;
    }

    const startPinId = wireDraft.start.kind === 'pin' ? wireDraft.start.pinId : undefined;
    const endPinId = nextEndpoint.kind === 'pin' ? nextEndpoint.pinId : undefined;
    const wireId = startPinId && endPinId ? buildWireId(startPinId, endPinId) : createId('wire');
    const endPoint = nextEndpoint.kind === 'point' || nextEndpoint.kind === 'wire' ? nextEndpoint.point : wireDraft.to;
    const nextWire = {
      id: wireId,
      from: wireDraft.start,
      to: nextEndpoint,
      sourcePinId: startPinId,
      targetPinId: endPinId,
      points: [wireDraft.from, endPoint],
    };

    commitCircuit({
      ...history.state,
      wires: [...history.state.wires.filter((wire) => wire.id !== wireId), nextWire],
    });
    setWireDraft(null);
    setSelectedWireId(wireId);
  }

  function handleToggleInput(gateId: string) {
    if (mode !== 'simulate') return;
    setInputSignals((current) => {
      const nextSignals = { ...current, [gateId]: !current[gateId] };
      publishCollaborationState(history.state, nextSignals, customComponents, true);
      return nextSignals;
    });
    markUnsaved();
  }

  function handleUpdateGate(nextGate: Gate) {
    const previousGate = history.state.gates.find((gate) => gate.id === nextGate.id);
    const nextPinIds = new Set([...nextGate.inputs, ...nextGate.outputs].map((pin) => pin.id));
    const removedPinIds = previousGate
      ? new Set([...previousGate.inputs, ...previousGate.outputs].filter((pin) => !nextPinIds.has(pin.id)).map((pin) => pin.id))
      : new Set<string>();

    commitCircuit({
      ...history.state,
      gates: history.state.gates.map((gate) => (gate.id === nextGate.id ? nextGate : gate)),
      wires: history.state.wires.filter(
        (wire) =>
          !endpointUsesPin(wire.from, removedPinIds) &&
          !endpointUsesPin(wire.to, removedPinIds) &&
          !removedPinIds.has(wire.sourcePinId ?? '') &&
          !removedPinIds.has(wire.targetPinId ?? ''),
      ),
    });
  }

  const handleDeleteSelected = useCallback(() => {
    if (selectedWire) {
      commitCircuit({
        ...history.state,
        wires: history.state.wires.filter((wire) => wire.id !== selectedWire.id),
      });
      setSelectedWireId(null);
      return;
    }

    if (!selectedGate) return;
    const pinIds = new Set([...selectedGate.inputs, ...selectedGate.outputs].map((pin) => pin.id));
    commitCircuit({
      ...history.state,
      gates: history.state.gates.filter((gate) => gate.id !== selectedGate.id),
      wires: history.state.wires.filter(
        (wire) =>
          !endpointUsesPin(wire.from, pinIds) &&
          !endpointUsesPin(wire.to, pinIds) &&
          !pinIds.has(wire.sourcePinId ?? '') &&
          !pinIds.has(wire.targetPinId ?? ''),
      ),
    });
    setSelectedGateId(null);
  }, [commitCircuit, history.state, selectedGate, selectedWire]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      if (shortcutMatches(event, preferences.shortcuts.editMode)) {
        event.preventDefault();
        setMode('edit');
        return;
      }

      if (shortcutMatches(event, preferences.shortcuts.simulateMode)) {
        event.preventDefault();
        setMode('simulate');
        setSelectedTool(null);
        setWireDraft(null);
        setDragState(null);
        clearToolDragPreview();
        return;
      }

      if (event.key === 'Delete' || shortcutMatches(event, preferences.shortcuts.deleteSelection)) {
        event.preventDefault();
        handleDeleteSelected();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearToolDragPreview, handleDeleteSelected, preferences.shortcuts]);

  async function handleSave() {
    if (!user || !canSave) return;
    const circuit = {
      ...history.state,
      customComponents,
      nets: buildCircuitNets({ ...history.state, customComponents }),
    };
    const savedProject = await projectService.updateProject(project.id, {
      circuit,
      inputSignals,
      customComponents,
    });
    setHasUnsavedChanges(false);
    setSaveState('Gespeichert');
    onProjectSaved(savedProject);
  }

  function handleAddAnnotation() {
    const text = window.prompt('Kommentar', 'Kommentar');
    if (!text) return;
    const point = selectedGate ? { x: selectedGate.x, y: selectedGate.y - 32 } : { x: 144, y: 96 };
    commitCircuit({
      ...history.state,
      annotations: [
        ...(history.state.annotations ?? []),
        {
          id: createId('annotation'),
          text,
          x: snapToGrid(point.x),
          y: snapToGrid(point.y),
        },
      ],
    });
  }

  function handleAddCustomComponent(component: CustomComponent) {
    if (customComponents.some((entry) => entry.id === component.id)) return;

    const nextComponents = [...customComponents, component];
    const nextCircuit = {
      ...history.state,
      customComponents: nextComponents,
    };
    setCustomComponents(nextComponents);
    commitCircuit(nextCircuit, undefined, { customComponents: nextComponents });
    setSelectedTool({ kind: 'custom', componentId: component.id });
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard?.writeText(inviteLink);
  }

  return (
    <main className="editor-workspace">
      <Toolbar
        projectName={project.name}
        mode={mode}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        canDelete={Boolean(selectedGate || selectedWire)}
        canSave={canSave}
        canCreateSession={!collaboration.session && !isSessionOnlyProject}
        saveState={saveState}
        saveDisabledReason={canSave ? null : 'Only host can save'}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          if (nextMode === 'simulate') setSelectedTool(null);
          if (nextMode === 'simulate') {
            setWireDraft(null);
            setDragState(null);
          }
        }}
        onBack={() => {
          if (confirmNavigation()) navigate('/projects');
        }}
        onUndo={() => {
          history.undo();
          markUnsaved();
          window.setTimeout(() => collaboration.broadcastCircuit(currentEditorStateRef.current, true), 0);
        }}
        onRedo={() => {
          history.redo();
          markUnsaved();
          window.setTimeout(() => collaboration.broadcastCircuit(currentEditorStateRef.current, true), 0);
        }}
        onSave={() => void handleSave()}
        onCreateSession={() => void collaboration.createSession()}
        onDeleteSelected={handleDeleteSelected}
        onOpenCustomDialog={() => setCustomDialogOpen(true)}
        onOpenImportDialog={() => setImportDialogOpen(true)}
        onAddAnnotation={handleAddAnnotation}
      />

      <CollaborationPanel
        session={collaboration.session}
        role={collaboration.role}
        inviteLink={inviteLink}
        message={collaboration.message}
        onCopyInviteLink={() => void handleCopyInviteLink()}
        onLeaveSession={() => void collaboration.leaveSession()}
      />

      <div className="editor-grid-layout">
        <Library
          customComponents={customComponents}
          selectedTool={selectedTool}
          onToolDragStart={handleToolDragStart}
          onToolDragEnd={clearToolDragPreview}
          onSelectTool={(tool) => {
            setSelectedTool(tool);
            setMode('edit');
          }}
        />

        <section className="canvas-stage">
          <Canvas
            circuit={history.state}
            signals={signals}
            mode={mode}
            selectedTool={selectedTool}
            selectedGateId={selectedGateId}
            selectedWireId={selectedWireId}
            dragState={dragState}
            wireDraft={wireDraft}
            draggedTool={draggedTool}
            toolPreviewGate={toolPreviewGate}
            remoteCursors={collaboration.remoteCursors}
            onCanvasClick={handleCanvasClick}
            onCanvasPointerMove={collaboration.sendCursor}
            onToolDrop={(tool, point) => placeTool(tool, point)}
            onToolDragPreview={handleToolDragPreview}
            onToolDragCancel={() => setToolPreviewGate(null)}
            onGateDragStart={handleGateDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onSelectGate={setSelectedGateId}
            onSelectWire={setSelectedWireId}
            onWireStart={handleWireStart}
            onWireEnd={handleWireEnd}
            onWirePreview={(point) => setWireDraft((draft) => (draft ? { ...draft, to: point } : draft))}
            onWireCancel={() => setWireDraft(null)}
            onToggleInput={handleToggleInput}
          />
        </section>

        <aside className="right-panel-stack">
          <Inspector circuit={history.state} selectedGate={selectedGate} onUpdateGate={handleUpdateGate} />
          <SimulationPanel
            circuit={history.state}
            signals={signals}
            inputSignals={inputSignals}
            enabled={mode === 'simulate'}
            onToggleInput={handleToggleInput}
          />
          <SignalViewer circuit={history.state} signals={signals} />
        </aside>
      </div>

      <CustomComponentDialog
        circuit={history.state}
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        onCreate={handleAddCustomComponent}
      />
      <CustomComponentImportDialog
        currentProjectId={project.id}
        existingComponentIds={new Set(customComponents.map((component) => component.id))}
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleAddCustomComponent}
      />
    </main>
  );
}
