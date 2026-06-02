import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '../components/Canvas';
import { CloseSessionDialog } from '../components/CloseSessionDialog';
import { CollaborationPanel, type InviteCopyStatus } from '../components/CollaborationPanel';
import { CustomComponentDialog } from '../components/CustomComponentDialog';
import { CustomComponentImportDialog } from '../components/CustomComponentImportDialog';
import { FloatingPanel } from '../components/FloatingPanel';
import { Inspector } from '../components/Inspector';
import { Library } from '../components/Library';
import { PanelDock } from '../components/PanelDock';
import { PanelLauncher } from '../components/PanelLauncher';
import { SignalViewer } from '../components/SignalViewer';
import { SimulationPanel } from '../components/SimulationPanel';
import { Toolbar } from '../components/Toolbar';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { getAnnotationLayout, normalizeAnnotationWidth } from '../annotationLayout';
import { buildInviteLink, readSessionIdFromSearch } from '../collaborationLinks';
import { mergeRemoteCircuitWithLocalInteraction } from '../collaborationMerge';
import { canSaveProject, createCollaborationCircuitState } from '../collaborationState';
import {
  createAnnotationClipboardItem,
  createGateClipboardItem,
  createPastedClipboardItem,
  createWireClipboardItem,
  type EditorClipboardItem,
} from '../editorClipboard';
import { positionAnnotationFromDrag, positionGateAtPoint, positionGateFromDrag } from '../editorGeometry';
import {
  EDITOR_PANEL_DEFINITIONS,
  clampFloatingPanels,
  clampPanelLauncherPosition,
  createDefaultPanelLauncherPosition,
  getDockMetrics,
  getNextActiveDockPanel,
  getZoomControlSafeArea,
  groupPanelsByDock,
  readStoredPanelLauncherPosition,
  readStoredPanelStates,
  resetPanelStates,
  updatePanelDock,
  updatePanelFloatingPosition,
  updatePanelOpen,
  writeStoredPanelLauncherPosition,
  writeStoredPanelStates,
  type EditorPanelId,
  type EditorPanelState,
  type PanelContainerSize,
  type PanelDockPosition,
} from '../panelLayout';
import { useNavigationGuard, type NavigationGuardRequest } from '../../../app/NavigationGuardContext';
import { useAuth } from '../../auth/AuthContext';
import { usePreferences } from '../../settings/PreferencesContext';
import { useHistory } from '../../../hooks/useHistory';
import { useCollaborationSession } from '../../../hooks/useCollaborationSession';
import { projectService } from '../../../services/projectService';
import { createCustomGate, createGate, createStarterCircuit, gateRectPx, snapToGrid } from '../../../simulation/gateLibrary';
import { evaluateCircuit } from '../../../simulation/evaluateCircuit';
import { buildCircuitNets } from '../../../simulation/netModel';
import { createPinLookup, getWirePoints } from '../../../simulation/wireUtils';
import type {
  Annotation,
  Circuit,
  CustomComponent,
  DragState,
  EditorMode,
  EditorTool,
  Gate,
  Point,
  SelectionArea,
  SignalState,
  WireDraft,
  WireEndpoint,
} from '../../../types/circuit';
import type { Project } from '../../../types/domain';
import type { CollaborationCircuitState } from '../../../types/collaboration';
import { createId } from '../../../utils/id';
import { isEditableTarget, shortcutMatches } from '../../../utils/keyboardShortcuts';
import { copyTextToClipboard } from '../../../utils/clipboard';

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

function rectanglesOverlap(area: SelectionArea, bounds: SelectionArea): boolean {
  return (
    area.x <= bounds.x + bounds.width &&
    area.x + area.width >= bounds.x &&
    area.y <= bounds.y + bounds.height &&
    area.y + area.height >= bounds.y
  );
}

function signalStatesEqual(a: SignalState, b: SignalState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (Boolean(a[key]) !== Boolean(b[key])) return false;
  }
  return true;
}

const TOOL_PREVIEW_GATE_ID = 'tool_preview';
const DEFAULT_ACTIVE_DOCK_PANELS: Record<PanelDockPosition, EditorPanelId | null> = {
  left: 'library',
  right: 'inspector',
};
const PANEL_LAUNCHER_SIZE = { width: 344, height: 44 };
const MINIMIZED_PANEL_LAUNCHER_SIZE = { width: 116, height: 44 };

function createTransientSessionProject(sessionId: string, ownerId: string | undefined): Project {
  const now = new Date().toISOString();
  const circuit = createStarterCircuit('Geteilte Session');

  return {
    id: `session_${sessionId}`,
    ownerId: ownerId ?? 'session_guest',
    name: 'Geteilte Session',
    description: 'Live-Kollaboration',
    circuit,
    inputSignals: {},
    customComponents: [],
    createdAt: now,
    updatedAt: now,
  };
}

function panelDefinition(panelId: EditorPanelId) {
  const definition = EDITOR_PANEL_DEFINITIONS.find((entry) => entry.id === panelId);
  if (!definition) throw new Error(`Unknown editor panel: ${panelId}`);
  return definition;
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
  const { setNavigationGuard } = useNavigationGuard();
  const history = useHistory<Circuit>(project.circuit, project.id);
  const currentUrlRef = useRef(`${location.pathname}${location.search}${location.hash}`);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedTool, setSelectedTool] = useState<EditorTool | null>(null);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [selectedGateIds, setSelectedGateIds] = useState<string[]>([]);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<string[]>([]);
  const [clipboardItem, setClipboardItem] = useState<EditorClipboardItem | null>(null);
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
  const [inviteCopyStatus, setInviteCopyStatus] = useState<InviteCopyStatus>('idle');
  const [closeSessionDialogOpen, setCloseSessionDialogOpen] = useState(false);
  const [closeSessionPending, setCloseSessionPending] = useState(false);
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const [panelStates, setPanelStates] = useState<EditorPanelState[]>(() => readStoredPanelStates());
  const [workbenchSize, setWorkbenchSize] = useState<PanelContainerSize>({ width: 1280, height: 720 });
  const [panelLauncherPosition, setPanelLauncherPosition] = useState(() => readStoredPanelLauncherPosition());
  const [panelLauncherMinimized, setPanelLauncherMinimized] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<NavigationGuardRequest | null>(null);
  const [navigationSavePending, setNavigationSavePending] = useState(false);
  const [navigationDialogError, setNavigationDialogError] = useState<string | null>(null);
  const [activeDockPanels, setActiveDockPanels] =
    useState<Record<PanelDockPosition, EditorPanelId | null>>(DEFAULT_ACTIVE_DOCK_PANELS);
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
    writeStoredPanelStates(panelStates);
  }, [panelStates]);

  useEffect(() => {
    writeStoredPanelLauncherPosition(panelLauncherPosition);
  }, [panelLauncherPosition]);

  useEffect(() => {
    const workbench = workbenchRef.current;
    if (!workbench) return undefined;

    const updateSize = () => {
      const rect = workbench.getBoundingClientRect();
      const nextSize = {
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      };
      setWorkbenchSize((current) =>
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize,
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(workbench);
    return () => observer.disconnect();
  }, []);

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
      event.preventDefault();
      event.stopImmediatePropagation();
      window.history.pushState(null, '', currentUrlRef.current);
      setNavigationDialogError(null);
      setPendingNavigation({
        kind: 'navigate',
        target: '/projects',
        proceed: () => navigate('/projects', { replace: true }),
      });
    }

    window.addEventListener('popstate', handlePopState, true);
    return () => window.removeEventListener('popstate', handlePopState, true);
  }, [hasUnsavedChanges, navigate]);

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
      const nextCircuit = mergeRemoteCircuitWithLocalInteraction(
        {
          ...remoteState.circuit,
          customComponents: nextComponents,
        },
        history.state,
        dragState,
      );

      history.replace(nextCircuit);
      setInputSignals(remoteState.inputSignals ?? {});
      setCustomComponents(nextComponents);
      setHasUnsavedChanges(true);
      setSaveState('Ungespeichert');
    },
    [dragState, history],
  );

  const collaboration = useCollaborationSession({
    autoJoinSessionId: initialSessionId,
    displayName: user?.name ?? 'Benutzer',
    getCurrentState: () => currentEditorStateRef.current,
    onRemoteState: applyRemoteEditorState,
  });

  const activeSessionId = collaboration.session?.sessionId ?? null;
  const inviteLink = useMemo(
    () => (activeSessionId && collaboration.role === 'host' ? buildInviteLink(activeSessionId) : null),
    [activeSessionId, collaboration.role],
  );

  useEffect(() => {
    if (!activeSessionId && !collaboration.message) return;
    setActiveDockPanels((current) => ({ ...current, left: 'session' }));
    setPanelStates((current) => updatePanelOpen(current, 'session', true));
  }, [activeSessionId, collaboration.message]);

  useEffect(() => {
    setInviteCopyStatus('idle');
  }, [inviteLink]);

  const canSave = canSaveProject(collaboration.role, isSessionOnlyProject);

  useEffect(() => {
    if (collaboration.status !== 'ended') return;
    setHasUnsavedChanges(false);
    navigate('/projects', {
      replace: true,
      state: { notification: collaboration.message ?? 'Die Session wurde vom Host geschlossen.' },
    });
  }, [collaboration.message, collaboration.status, navigate]);

  useEffect(() => {
    if (!initialSessionId || collaboration.status !== 'error') return;
    setHasUnsavedChanges(false);
    navigate('/projects', {
      replace: true,
      state: { notification: collaboration.message ?? 'Diese Session existiert nicht mehr oder wurde geschlossen.' },
    });
  }, [collaboration.message, collaboration.status, initialSessionId, navigate]);

  async function handleLeaveSession() {
    const left = await collaboration.leaveSession();
    if (!left) return;

    setHasUnsavedChanges(false);
    navigate('/projects', { replace: true, state: { notification: 'Du hast die Session verlassen.' } });
  }

  async function handleCloseSession() {
    setCloseSessionPending(true);
    const closed = await collaboration.closeSession();
    setCloseSessionPending(false);
    if (!closed) return;

    setCloseSessionDialogOpen(false);
  }

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
  const selectedAnnotation = (history.state.annotations ?? []).find((annotation) => annotation.id === selectedAnnotationId) ?? null;
  const selectedGateIdSet = useMemo(() => new Set(selectedGateIds), [selectedGateIds]);
  const selectedAnnotationIdSet = useMemo(() => new Set(selectedAnnotationIds), [selectedAnnotationIds]);
  const selectedObjectCount = selectedGateIds.length + selectedAnnotationIds.length;
  const pinMap = useMemo(() => createPinLookup(history.state), [history.state]);
  const hasSelectedCanvasItem = Boolean(selectedWire || selectedGateIds.length > 0 || selectedAnnotationIds.length > 0);
  const canPasteClipboard = mode === 'edit' && Boolean(clipboardItem);
  const dockMetrics = useMemo(() => getDockMetrics(panelStates), [panelStates]);
  const zoomControlSafeArea = useMemo(
    () => getZoomControlSafeArea(workbenchSize, dockMetrics),
    [dockMetrics, workbenchSize],
  );
  const dockedPanelGroups = useMemo(() => groupPanelsByDock(panelStates), [panelStates]);
  const floatingPanels = useMemo(
    () => panelStates.filter((panel) => panel.isOpen && !panel.dockPosition),
    [panelStates],
  );

  useEffect(() => {
    setPanelStates((current) => clampFloatingPanels(current, workbenchSize, zoomControlSafeArea));
  }, [workbenchSize, zoomControlSafeArea]);

  useEffect(() => {
    setPanelLauncherPosition((current) =>
      clampPanelLauncherPosition(
        current,
        workbenchSize,
        dockMetrics,
        zoomControlSafeArea,
        panelLauncherMinimized ? MINIMIZED_PANEL_LAUNCHER_SIZE : PANEL_LAUNCHER_SIZE,
      ),
    );
  }, [dockMetrics, panelLauncherMinimized, workbenchSize, zoomControlSafeArea]);

  useEffect(() => {
    setActiveDockPanels((current) => {
      const nextActivePanels = {
        left: getNextActiveDockPanel(dockedPanelGroups.left, current.left),
        right: getNextActiveDockPanel(dockedPanelGroups.right, current.right),
      };

      return current.left === nextActivePanels.left &&
        current.right === nextActivePanels.right
        ? current
        : nextActivePanels;
    });
  }, [dockedPanelGroups]);

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
    setSaveState('Ungespeichert');
  }, []);

  const confirmNavigation = useCallback(
    (request?: NavigationGuardRequest) => {
      if (!hasUnsavedChanges) return true;
      setNavigationDialogError(null);
      setPendingNavigation(
        request ?? {
          kind: 'navigate',
          target: '/projects',
          proceed: () => navigate('/projects'),
        },
      );
      return false;
    },
    [hasUnsavedChanges, navigate],
  );

  useEffect(() => {
    setNavigationGuard(confirmNavigation);
    return () => setNavigationGuard(null);
  }, [confirmNavigation, setNavigationGuard]);

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

  const selectGate = useCallback((gateId: string | null) => {
    setSelectedGateId(gateId);
    setSelectedGateIds(gateId ? [gateId] : []);
  }, []);

  const selectWire = useCallback((wireId: string | null) => {
    setSelectedWireId(wireId);
  }, []);

  const selectAnnotation = useCallback((annotationId: string | null) => {
    setSelectedAnnotationId(annotationId);
    setSelectedAnnotationIds(annotationId ? [annotationId] : []);
  }, []);

  const clearCanvasSelection = useCallback(() => {
    setSelectedGateId(null);
    setSelectedGateIds([]);
    setSelectedWireId(null);
    setSelectedAnnotationId(null);
    setSelectedAnnotationIds([]);
  }, []);

  function createSelectionDragState(point: Point): DragState {
    return {
      kind: 'selection',
      startPoint: point,
      gates: history.state.gates
        .filter((gate) => selectedGateIdSet.has(gate.id))
        .map((gate) => ({ id: gate.id, x: gate.x, y: gate.y })),
      annotations: (history.state.annotations ?? [])
        .filter((annotation) => selectedAnnotationIdSet.has(annotation.id))
        .map((annotation) => ({ id: annotation.id, x: annotation.x, y: annotation.y })),
    };
  }

  function handleAreaSelect(area: SelectionArea) {
    const nextGateIds = history.state.gates
      .filter((gate) => {
        const rect = gateRectPx(gate);
        return rectanglesOverlap(area, { x: gate.x, y: gate.y, width: rect.width, height: rect.height });
      })
      .map((gate) => gate.id);
    const nextAnnotationIds = (history.state.annotations ?? [])
      .filter((annotation) => {
        const layout = getAnnotationLayout(annotation.text, annotation.width);
        return rectanglesOverlap(area, {
          x: annotation.x,
          y: annotation.y - layout.lineHeight / 2,
          width: layout.width,
          height: layout.height,
        });
      })
      .map((annotation) => annotation.id);

    setSelectedTool(null);
    setSelectedWireId(null);
    setSelectedGateIds(nextGateIds);
    setSelectedAnnotationIds(nextAnnotationIds);
    setSelectedGateId(nextGateIds[0] ?? null);
    setSelectedAnnotationId(nextAnnotationIds[0] ?? null);
  }

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

  function placeTool(tool: EditorTool, point: Point) {
    const gateDraft = createGateDraft(tool);

    if (!gateDraft) {
      setSelectedTool(null);
      return;
    }

    const gate = positionGateAtPoint(gateDraft, point);

    commitCircuit({
      ...history.state,
      gates: [...history.state.gates, gate],
    });
    selectGate(gate.id);
    selectWire(null);
    selectAnnotation(null);
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
    const nextGate = positionGateAtPoint(gateDraft, point);

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
    selectWire(null);
    setDragStartCircuit(history.state);
    if (selectedObjectCount > 1 && selectedGateIdSet.has(gate.id)) {
      setDragState(createSelectionDragState(point));
      return;
    }

    selectAnnotation(null);
    setDragState({
      kind: 'gate',
      gateId: gate.id,
      offsetX: point.x - gate.x,
      offsetY: point.y - gate.y,
    });
  }

  function handleAnnotationDragStart(annotation: Annotation, point: Point) {
    selectWire(null);
    setDragStartCircuit(history.state);
    if (selectedObjectCount > 1 && selectedAnnotationIdSet.has(annotation.id)) {
      setDragState(createSelectionDragState(point));
      return;
    }

    selectGate(null);
    selectAnnotation(annotation.id);
    setDragState({
      kind: 'annotation',
      annotationId: annotation.id,
      offsetX: point.x - annotation.x,
      offsetY: point.y - annotation.y,
    });
  }

  function handleAnnotationResizeStart(annotation: Annotation, point: Point) {
    selectGate(null);
    selectWire(null);
    selectAnnotation(annotation.id);
    setDragStartCircuit(history.state);
    setDragState({
      kind: 'annotation-resize',
      annotationId: annotation.id,
      startX: point.x,
      startWidth: getAnnotationLayout(annotation.text, annotation.width).width,
    });
  }

  function handleDragMove(point: Point) {
    if (!dragState) return;

    if (dragState.kind === 'selection') {
      const deltaX = snapToGrid(point.x - dragState.startPoint.x);
      const deltaY = snapToGrid(point.y - dragState.startPoint.y);
      const gatePositions = new Map(dragState.gates.map((gate) => [gate.id, gate]));
      const annotationPositions = new Map(dragState.annotations.map((annotation) => [annotation.id, annotation]));

      replaceCircuit({
        ...history.state,
        gates: history.state.gates.map((gate) => {
          const startPosition = gatePositions.get(gate.id);
          return startPosition ? { ...gate, x: startPosition.x + deltaX, y: startPosition.y + deltaY } : gate;
        }),
        annotations: (history.state.annotations ?? []).map((annotation) => {
          const startPosition = annotationPositions.get(annotation.id);
          return startPosition
            ? { ...annotation, x: startPosition.x + deltaX, y: startPosition.y + deltaY }
            : annotation;
        }),
      });
      return;
    }

    if (dragState.kind === 'gate') {
      replaceCircuit({
        ...history.state,
        gates: history.state.gates.map((gate) =>
          gate.id === dragState.gateId ? positionGateFromDrag(gate, dragState, point) : gate,
        ),
      });
      return;
    }

    if (dragState.kind === 'annotation-resize') {
      const nextWidth = normalizeAnnotationWidth(dragState.startWidth + point.x - dragState.startX);
      replaceCircuit({
        ...history.state,
        annotations: (history.state.annotations ?? []).map((annotation) =>
          annotation.id === dragState.annotationId ? { ...annotation, width: nextWidth } : annotation,
        ),
      });
      return;
    }

    replaceCircuit({
      ...history.state,
      annotations: (history.state.annotations ?? []).map((annotation) =>
        annotation.id === dragState.annotationId ? positionAnnotationFromDrag(annotation, dragState, point) : annotation,
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
    selectGate(null);
    selectAnnotation(null);
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
    selectGate(null);
    selectAnnotation(null);
    selectWire(wireId);
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

  function handleUpdateAnnotation(nextAnnotation: Annotation) {
    commitCircuit({
      ...history.state,
      annotations: (history.state.annotations ?? []).map((annotation) =>
        annotation.id === nextAnnotation.id ? nextAnnotation : annotation,
      ),
    });
  }

  const handleCopySelection = useCallback(() => {
    if (selectedGate) {
      setClipboardItem(createGateClipboardItem(selectedGate));
      return;
    }

    if (selectedAnnotation) {
      setClipboardItem(createAnnotationClipboardItem(selectedAnnotation));
      return;
    }

    if (!selectedWire) return;
    const wirePoints = getWirePoints(selectedWire, pinMap);
    if (!wirePoints) return;

    setClipboardItem(
      createWireClipboardItem({
        id: selectedWire.id,
        from: { kind: 'point', point: wirePoints.from },
        to: { kind: 'point', point: wirePoints.to },
        points: [wirePoints.from, wirePoints.to],
      }),
    );
  }, [pinMap, selectedAnnotation, selectedGate, selectedWire]);

  const handlePasteClipboard = useCallback(() => {
    if (mode !== 'edit' || !clipboardItem) return;
    const pastedItem = createPastedClipboardItem(clipboardItem);
    if (!pastedItem) return;

    setClipboardItem(pastedItem);
    setSelectedTool(null);

    if (pastedItem.kind === 'gate') {
      commitCircuit({
        ...history.state,
        gates: [...history.state.gates, pastedItem.gate],
      });
      selectGate(pastedItem.gate.id);
      selectWire(null);
      selectAnnotation(null);
      return;
    }

    if (pastedItem.kind === 'annotation') {
      commitCircuit({
        ...history.state,
        annotations: [...(history.state.annotations ?? []), pastedItem.annotation],
      });
      selectGate(null);
      selectWire(null);
      selectAnnotation(pastedItem.annotation.id);
      return;
    }

    commitCircuit({
      ...history.state,
      wires: [...history.state.wires, pastedItem.wire],
    });
    selectGate(null);
    selectWire(pastedItem.wire.id);
    selectAnnotation(null);
  }, [clipboardItem, commitCircuit, history.state, mode, selectAnnotation, selectGate, selectWire]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedWire && selectedGateIds.length === 0 && selectedAnnotationIds.length === 0) {
      commitCircuit({
        ...history.state,
        wires: history.state.wires.filter((wire) => wire.id !== selectedWire.id),
      });
      selectWire(null);
      return;
    }

    if (selectedGateIds.length === 0 && selectedAnnotationIds.length === 0) return;

    const selectedGates = history.state.gates.filter((gate) => selectedGateIdSet.has(gate.id));
    const deletedPinIds = new Set(
      selectedGates.flatMap((gate) => [...gate.inputs, ...gate.outputs].map((pin) => pin.id)),
    );

    commitCircuit({
      ...history.state,
      gates: history.state.gates.filter((gate) => !selectedGateIdSet.has(gate.id)),
      wires: history.state.wires.filter(
        (wire) =>
          !endpointUsesPin(wire.from, deletedPinIds) &&
          !endpointUsesPin(wire.to, deletedPinIds) &&
          !deletedPinIds.has(wire.sourcePinId ?? '') &&
          !deletedPinIds.has(wire.targetPinId ?? ''),
      ),
      annotations: (history.state.annotations ?? []).filter((annotation) => !selectedAnnotationIdSet.has(annotation.id)),
    });
    clearCanvasSelection();
  }, [
    clearCanvasSelection,
    commitCircuit,
    history.state,
    selectedAnnotationIdSet,
    selectedAnnotationIds.length,
    selectedGateIdSet,
    selectedGateIds.length,
    selectedWire,
    selectWire,
  ]);

  const handleUndo = useCallback(() => {
    if (!history.canUndo) return;
    history.undo();
    markUnsaved();
    window.setTimeout(() => collaboration.broadcastCircuit(currentEditorStateRef.current, true), 0);
  }, [collaboration, history, markUnsaved]);

  const handleRedo = useCallback(() => {
    if (!history.canRedo) return;
    history.redo();
    markUnsaved();
    window.setTimeout(() => collaboration.broadcastCircuit(currentEditorStateRef.current, true), 0);
  }, [collaboration, history, markUnsaved]);

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

      const key = event.key.toLowerCase();
      const primaryModifierPressed = event.ctrlKey || event.metaKey;
      if (primaryModifierPressed && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (primaryModifierPressed && key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (primaryModifierPressed && key === 'c') {
        event.preventDefault();
        handleCopySelection();
        return;
      }

      if (primaryModifierPressed && key === 'v') {
        event.preventDefault();
        handlePasteClipboard();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace' || shortcutMatches(event, preferences.shortcuts.deleteSelection)) {
        event.preventDefault();
        handleDeleteSelected();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clearToolDragPreview,
    handleCopySelection,
    handleDeleteSelected,
    handlePasteClipboard,
    handleRedo,
    handleUndo,
    preferences.shortcuts,
  ]);

  async function saveProject(): Promise<boolean> {
    if (!user || !canSave) return false;
    const circuit = {
      ...history.state,
      customComponents,
      nets: buildCircuitNets({ ...history.state, customComponents }),
    };
    try {
      setSaveState('Speichert...');
      const savedProject = await projectService.updateProject(project.id, {
        circuit,
        inputSignals,
        customComponents,
      });
      setHasUnsavedChanges(false);
      setSaveState('Gespeichert');
      onProjectSaved(savedProject);
      return true;
    } catch {
      setSaveState('Speichern fehlgeschlagen');
      return false;
    }
  }

  async function handleSave() {
    await saveProject();
  }

  function closeUnsavedChangesDialog() {
    if (navigationSavePending) return;
    setPendingNavigation(null);
    setNavigationDialogError(null);
  }

  function continueWithoutSaving() {
    const nextNavigation = pendingNavigation;
    if (!nextNavigation) return;
    setPendingNavigation(null);
    setNavigationDialogError(null);
    setHasUnsavedChanges(false);
    nextNavigation.proceed();
  }

  async function saveAndContinueNavigation() {
    const nextNavigation = pendingNavigation;
    if (!nextNavigation || navigationSavePending) return;

    setNavigationSavePending(true);
    setNavigationDialogError(null);
    const saved = await saveProject();
    setNavigationSavePending(false);

    if (!saved) {
      setNavigationDialogError('Das Projekt konnte nicht gespeichert werden. Bitte versuche es erneut oder verlasse ohne Speichern.');
      return;
    }

    setPendingNavigation(null);
    nextNavigation.proceed();
  }

  function handleAddAnnotation() {
    const text = window.prompt('Kommentar', 'Kommentar');
    if (!text) return;
    const point = selectedGate ? { x: selectedGate.x, y: selectedGate.y - 32 } : { x: 144, y: 96 };
    const annotationId = createId('annotation');
    commitCircuit({
      ...history.state,
      annotations: [
        ...(history.state.annotations ?? []),
        {
          id: annotationId,
          text,
          x: snapToGrid(point.x),
          y: snapToGrid(point.y),
        },
      ],
    });
    selectGate(null);
    selectWire(null);
    selectAnnotation(annotationId);
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
    const copied = await copyTextToClipboard(inviteLink);
    setInviteCopyStatus(copied ? 'copied' : 'failed');
  }

  function handlePanelTabClick(panelId: EditorPanelId) {
    const panel = panelStates.find((entry) => entry.id === panelId);
    if (!panel?.isOpen && panel?.dockPosition) {
      setActiveDockPanels((current) => ({ ...current, [panel.dockPosition as PanelDockPosition]: panelId }));
    }
    setPanelStates((current) => updatePanelOpen(current, panelId, !panel?.isOpen));
  }

  function handlePanelClose(panelId: EditorPanelId) {
    setPanelStates((current) => updatePanelOpen(current, panelId, false));
  }

  function handlePanelDock(panelId: EditorPanelId, dockPosition: PanelDockPosition) {
    setActiveDockPanels((current) => ({ ...current, [dockPosition]: panelId }));
    setPanelStates((current) => updatePanelDock(current, panelId, dockPosition));
  }

  function handlePanelUndock(panelId: EditorPanelId) {
    setPanelStates((current) => updatePanelDock(current, panelId, null));
  }

  function handlePanelMove(panelId: EditorPanelId, position: Point) {
    setPanelStates((current) =>
      updatePanelFloatingPosition(current, panelId, position, workbenchSize, zoomControlSafeArea),
    );
  }

  function handleResetPanels() {
    setActiveDockPanels(DEFAULT_ACTIVE_DOCK_PANELS);
    setPanelStates(clampFloatingPanels(resetPanelStates(), workbenchSize, zoomControlSafeArea));
    setPanelLauncherMinimized(false);
    setPanelLauncherPosition(
      clampPanelLauncherPosition(
        createDefaultPanelLauncherPosition(),
        workbenchSize,
        dockMetrics,
        zoomControlSafeArea,
        PANEL_LAUNCHER_SIZE,
      ),
    );
  }

  function handleActiveDockPanelChange(dockPosition: PanelDockPosition, panelId: EditorPanelId) {
    setActiveDockPanels((current) => ({ ...current, [dockPosition]: panelId }));
  }

  function handlePanelLauncherMove(position: Point) {
    setPanelLauncherPosition(() =>
      clampPanelLauncherPosition(
        position,
        workbenchSize,
        dockMetrics,
        zoomControlSafeArea,
        panelLauncherMinimized ? MINIMIZED_PANEL_LAUNCHER_SIZE : PANEL_LAUNCHER_SIZE,
      ),
    );
  }

  function renderPanelContent(panelId: EditorPanelId) {
    if (panelId === 'library') {
      return (
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
      );
    }

    if (panelId === 'inspector') {
      const showSingleSelection = selectedObjectCount <= 1;
      return (
        <Inspector
          circuit={history.state}
          selectedGate={showSingleSelection ? selectedGate : null}
          selectedAnnotation={showSingleSelection ? selectedAnnotation : null}
          onUpdateGate={handleUpdateGate}
          onUpdateAnnotation={handleUpdateAnnotation}
        />
      );
    }

    if (panelId === 'signals') {
      return (
        <div className="right-panel-stack">
          <SimulationPanel
            circuit={history.state}
            signals={signals}
            inputSignals={inputSignals}
            enabled={mode === 'simulate'}
            onToggleInput={handleToggleInput}
          />
          <SignalViewer circuit={history.state} signals={signals} />
        </div>
      );
    }

    return (
      <div className="session-panel-stack">
        <CollaborationPanel
          session={collaboration.session}
          role={collaboration.role}
          inviteLink={inviteLink}
          copyStatus={inviteCopyStatus}
          message={collaboration.message}
          onCopyInviteLink={() => void handleCopyInviteLink()}
          onLeaveSession={() => void handleLeaveSession()}
          onCloseSession={() => setCloseSessionDialogOpen(true)}
        />
        {!collaboration.session && !collaboration.message && (
          <section className="editor-panel session-empty-panel">
            <div className="panel-heading">
              <p className="eyebrow">Session</p>
              <h2>Keine aktive Session</h2>
            </div>
            <p className="muted">Starte die Zusammenarbeit über die Toolbar.</p>
          </section>
        )}
      </div>
    );
  }

  function renderPanel(panel: EditorPanelState) {
    const definition = panelDefinition(panel.id);
    return (
      <FloatingPanel
        key={panel.id}
        panel={panel}
        title={definition.title}
        onClose={handlePanelClose}
        onDock={handlePanelDock}
        onMove={handlePanelMove}
        onUndock={handlePanelUndock}
      >
        {renderPanelContent(panel.id)}
      </FloatingPanel>
    );
  }

  function renderDock(dockPosition: PanelDockPosition) {
    const panels = dockedPanelGroups[dockPosition];
    if (panels.length === 0) return null;

    return (
      <PanelDock
        dockPosition={dockPosition}
        panels={panels}
        definitions={EDITOR_PANEL_DEFINITIONS}
        activePanelId={activeDockPanels[dockPosition]}
        renderPanelContent={renderPanelContent}
        onActivePanelChange={handleActiveDockPanelChange}
        onClose={handlePanelClose}
        onDock={handlePanelDock}
        onUndock={handlePanelUndock}
      />
    );
  }

  function renderPanelLauncher() {
    return (
      <PanelLauncher
        position={panelLauncherPosition}
        isMinimized={panelLauncherMinimized}
        definitions={EDITOR_PANEL_DEFINITIONS}
        panelStates={panelStates}
        onMove={handlePanelLauncherMove}
        onToggleMinimized={() => setPanelLauncherMinimized((current) => !current)}
        onTogglePanel={handlePanelTabClick}
      />
    );
  }

  const workbenchStyle = {
    '--dock-left-width': `${dockMetrics.left}px`,
    '--dock-right-width': `${dockMetrics.right}px`,
  } as CSSProperties;

  return (
    <main className="editor-workspace">
      <Toolbar
        projectName={project.name}
        mode={mode}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        canCopy={hasSelectedCanvasItem}
        canPaste={canPasteClipboard}
        canDelete={hasSelectedCanvasItem}
        canSave={canSave}
        canCreateSession={!collaboration.session && !isSessionOnlyProject}
        saveState={saveState}
        saveDisabledReason={canSave ? null : 'Nur der Host kann speichern'}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          if (nextMode === 'simulate') setSelectedTool(null);
          if (nextMode === 'simulate') {
            setWireDraft(null);
            setDragState(null);
          }
        }}
        onBack={() => {
          if (confirmNavigation({ kind: 'navigate', target: '/projects', proceed: () => navigate('/projects') })) {
            navigate('/projects');
          }
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopySelection={handleCopySelection}
        onPasteClipboard={handlePasteClipboard}
        onSave={() => void handleSave()}
        onCreateSession={() => void collaboration.createSession()}
        onDeleteSelected={handleDeleteSelected}
        onOpenCustomDialog={() => setCustomDialogOpen(true)}
        onOpenImportDialog={() => setImportDialogOpen(true)}
        onAddAnnotation={handleAddAnnotation}
      />

      <div ref={workbenchRef} className="editor-grid-layout" style={workbenchStyle}>
        <section className="canvas-stage">
          <Canvas
            circuit={history.state}
            signals={signals}
            mode={mode}
            selectedTool={selectedTool}
            selectedGateId={selectedGateId}
            selectedGateIds={selectedGateIds}
            selectedWireId={selectedWireId}
            selectedAnnotationId={selectedAnnotationId}
            selectedAnnotationIds={selectedAnnotationIds}
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
            onAnnotationDragStart={handleAnnotationDragStart}
            onAnnotationResizeStart={handleAnnotationResizeStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onSelectGate={selectGate}
            onSelectWire={selectWire}
            onSelectAnnotation={selectAnnotation}
            onAreaSelect={handleAreaSelect}
            onWireStart={handleWireStart}
            onWireEnd={handleWireEnd}
            onWirePreview={(point) => setWireDraft((draft) => (draft ? { ...draft, to: point } : draft))}
            onWireCancel={() => setWireDraft(null)}
            onToggleInput={handleToggleInput}
          />
        </section>

        {renderDock('left')}
        {renderDock('right')}

        <div className="floating-panel-layer">{floatingPanels.map(renderPanel)}</div>
        {renderPanelLauncher()}
        <button className="panel-reset-button" type="button" onClick={handleResetPanels}>
          Bereiche zurücksetzen
        </button>
      </div>

      {pendingNavigation && (
        <UnsavedChangesDialog
          canSave={canSave}
          saving={navigationSavePending}
          error={navigationDialogError}
          onCancel={closeUnsavedChangesDialog}
          onDiscard={continueWithoutSaving}
          onSaveAndLeave={() => void saveAndContinueNavigation()}
        />
      )}

      {closeSessionDialogOpen && (
        <CloseSessionDialog
          pending={closeSessionPending}
          onCancel={() => setCloseSessionDialogOpen(false)}
          onConfirm={() => void handleCloseSession()}
        />
      )}

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
