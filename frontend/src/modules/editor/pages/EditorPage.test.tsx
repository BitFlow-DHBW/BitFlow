import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStarterCircuit } from '../../../simulation/gateLibrary';
import { testProject, testUser } from '../../../test/builders';
import { AuthProvider } from '../../auth/AuthContext';
import { PreferencesProvider } from '../../settings/PreferencesContext';
import { PANEL_LAUNCHER_STORAGE_KEY, PANEL_STORAGE_KEY } from '../panelLayout';
import { EditorPage } from './EditorPage';

const projectMocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  listProjects: vi.fn(),
  updateProject: vi.fn(),
}));

vi.mock('../../../services/projectService', () => ({
  projectService: projectMocks,
}));

function renderEditor(projectId = 'project_editor') {
  return render(
    <PreferencesProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/editor/${projectId}`]}>
          <Routes>
            <Route path="/editor/:projectId" element={<EditorPage />} />
            <Route path="/projects" element={<main>Projects page</main>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </PreferencesProvider>,
  );
}

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
  window.dispatchEvent(event);
  return event;
}

describe('EditorPage', () => {
  beforeEach(() => {
    projectMocks.getProject.mockReset();
    projectMocks.listProjects.mockReset();
    projectMocks.updateProject.mockReset();
    window.localStorage.removeItem(PANEL_STORAGE_KEY);
    window.localStorage.removeItem(PANEL_LAUNCHER_STORAGE_KEY);
  });

  it('loads a project workspace with toolbar, library, canvas and signal panels', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    const circuit = createStarterCircuit('Starter Circuit');
    projectMocks.getProject.mockResolvedValue(
      testProject({
        id: 'project_editor',
        ownerId: currentUser.id,
        name: 'Starter Circuit',
        circuit,
      }),
    );
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    const { container } = renderEditor();

    expect(await screen.findByRole('heading', { name: 'Starter Circuit' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Schaltungseditor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bibliothek einklappen' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Rechts Dock' })).toBeInTheDocument();
    expect(container.querySelectorAll('.panel-dock-right')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Signals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inspector einklappen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Panels zuruecksetzen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AND/ })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Signals' }));
    expect(screen.getByRole('button', { name: 'Signals einklappen' })).toBeInTheDocument();
    expect(screen.getByText(/Pin-Zust/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Simulieren' }));
    await user.click(screen.getAllByRole('button', { name: /Eingang0/ })[0]);

    expect(screen.getByRole('button', { name: /Eingang1/ })).toBeInTheDocument();
  });

  it('collapses and reopens editor panels without removing the canvas', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    projectMocks.getProject.mockResolvedValue(
      testProject({
        id: 'project_editor',
        ownerId: currentUser.id,
        name: 'Panel Circuit',
        circuit: createStarterCircuit('Panel Circuit'),
      }),
    );
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Panel Circuit' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Bibliothek einklappen' }));
    expect(screen.queryByRole('button', { name: /AND/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('img', { name: 'Schaltungseditor' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Signals' }));
    await user.click(screen.getByRole('button', { name: 'Signals einklappen' }));
    expect(screen.queryByText(/Pin-Zust/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Signals' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('img', { name: 'Schaltungseditor' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Library' }));
    expect(screen.getByRole('button', { name: /AND/ })).toBeInTheDocument();
  });

  it('supports an edit workflow with placement, annotations, custom components, save and delete', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    const circuit = createStarterCircuit('Workflow Circuit');
    let savedProject = testProject({
      id: 'project_editor',
      ownerId: currentUser.id,
      name: 'Workflow Circuit',
      circuit,
    });
    projectMocks.getProject.mockResolvedValue(savedProject);
    projectMocks.updateProject.mockImplementation(async (_projectId, patch) => {
      savedProject = { ...savedProject, ...patch, updatedAt: '2026-05-01T10:00:00.000Z' };
      return savedProject;
    });
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Workflow Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;

    await user.click(screen.getAllByRole('button', { name: /AND/ })[0]);
    fireEvent.click(grid, { clientX: 240, clientY: 120 });
    expect(screen.getByText('Ungespeichert')).toBeInTheDocument();

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValueOnce('Kommentar A');
    fireEvent.click(svg.querySelector('path.wire') as SVGPathElement);
    await user.click(screen.getByRole('button', { name: 'Kommentar' }));
    expect(screen.getAllByText('Kommentar A').length).toBeGreaterThan(0);
    expect(promptSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Baustein erstellen' }));
    await user.click(screen.getByRole('button', { name: 'Baustein speichern' }));
    expect(screen.getByRole('button', { name: /Eigener Baustein/ })).toBeInTheDocument();

    projectMocks.listProjects.mockResolvedValueOnce([
      savedProject,
      testProject({
        id: 'project_other',
        name: 'Other Blocks',
        customComponents: [
          {
            id: 'custom_imported',
            name: 'Imported Gate',
            inputLabels: ['A'],
            outputLabels: ['Y'],
            truthTable: [
              { inputs: [false], outputs: [false] },
              { inputs: [true], outputs: [true] },
            ],
            createdAt: '2026-05-01T10:00:00.000Z',
          },
        ],
      }),
    ]);
    await user.click(screen.getByRole('button', { name: 'Baustein importieren' }));
    expect(await screen.findByRole('heading', { name: 'Other Blocks' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
    expect(screen.getByRole('button', { name: /Imported Gate/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(screen.getByText('Gespeichert')).toBeInTheDocument());
    expect(projectMocks.updateProject).toHaveBeenCalledWith(
      'project_editor',
      expect.objectContaining({
        circuit: expect.objectContaining({
          annotations: expect.arrayContaining([expect.objectContaining({ text: 'Kommentar A' })]),
        }),
      }),
    );

    fireEvent.click(svg.querySelector('path.wire') as SVGPathElement);
    await user.click(screen.getByRole('button', { name: /^Löschen$/ }));
    expect(screen.getByText('Ungespeichert')).toBeInTheDocument();
  });

  it('selects, edits and deletes annotations from the inspector', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    projectMocks.getProject.mockResolvedValue(
      testProject({
        id: 'project_editor',
        ownerId: currentUser.id,
        name: 'Annotation Circuit',
        circuit: createStarterCircuit('Annotation Circuit'),
      }),
    );
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Annotation Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const annotation = svg.querySelector('.canvas-annotation') as SVGGElement;
    Object.defineProperty(annotation, 'setPointerCapture', { value: vi.fn(), configurable: true });

    fireEvent.pointerDown(annotation, { button: 0, pointerId: 1, clientX: 144, clientY: 96 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 144, clientY: 96 });
    fireEvent.change(screen.getByLabelText('Kommentar'), { target: { value: 'Bearbeiteter Kommentar' } });

    expect(screen.getByDisplayValue('Bearbeiteter Kommentar')).toBeInTheDocument();
    expect(screen.getAllByText('Bearbeiteter Kommentar').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /^Löschen$/ }));

    expect(screen.queryByText('Bearbeiteter Kommentar')).not.toBeInTheDocument();
    expect(screen.getByText(/Kein Baustein oder Kommentar/)).toBeInTheDocument();
  });

  it('copies and pastes selected gates and annotations by button and shortcut', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    projectMocks.getProject.mockResolvedValue(
      testProject({
        id: 'project_editor',
        ownerId: currentUser.id,
        name: 'Clipboard Circuit',
        circuit: createStarterCircuit('Clipboard Circuit'),
      }),
    );
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Clipboard Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;
    const initialGateCount = svg.querySelectorAll('.gate-node').length;

    await user.click(screen.getAllByRole('button', { name: /AND/ })[0]);
    fireEvent.click(grid, { clientX: 240, clientY: 120 });
    await user.click(screen.getByRole('button', { name: 'Kopieren' }));
    await user.click(screen.getByRole('button', { name: 'Einfügen' }));

    expect(svg.querySelectorAll('.gate-node')).toHaveLength(initialGateCount + 2);

    const initialAnnotationCount = svg.querySelectorAll('.canvas-annotation').length;
    const annotation = svg.querySelector('.canvas-annotation') as SVGGElement;
    Object.defineProperty(annotation, 'setPointerCapture', { value: vi.fn(), configurable: true });
    fireEvent.pointerDown(annotation, { button: 0, pointerId: 1, clientX: 144, clientY: 96 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 144, clientY: 96 });
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'v', ctrlKey: true });

    expect(svg.querySelectorAll('.canvas-annotation')).toHaveLength(initialAnnotationCount + 1);
  });

  it('selects multiple gates with Ctrl-drag and deletes them with Backspace', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    let savedProject = testProject({
      id: 'project_editor',
      ownerId: currentUser.id,
      name: 'Multi Select Circuit',
      circuit: createStarterCircuit('Multi Select Circuit'),
    });
    projectMocks.getProject.mockResolvedValue(savedProject);
    projectMocks.updateProject.mockImplementation(async (_projectId, patch) => {
      savedProject = { ...savedProject, ...patch, updatedAt: '2026-05-01T10:00:00.000Z' };
      return savedProject;
    });
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Multi Select Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;

    expect(svg.querySelectorAll('.gate-node')).toHaveLength(4);

    fireEvent.pointerDown(grid, { button: 0, ctrlKey: true, pointerId: 1, clientX: 80, clientY: 96 });
    fireEvent.pointerMove(svg, { ctrlKey: true, pointerId: 1, clientX: 480, clientY: 320 });
    fireEvent.pointerUp(svg, { ctrlKey: true, pointerId: 1, clientX: 480, clientY: 320 });

    expect(svg.querySelectorAll('.gate-node.is-selected').length).toBeGreaterThan(1);

    const selectedGateNode = svg.querySelector('.gate-node.is-selected') as SVGGElement;
    Object.defineProperty(selectedGateNode, 'setPointerCapture', { value: vi.fn(), configurable: true });
    fireEvent.pointerDown(selectedGateNode, { button: 0, pointerId: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { pointerId: 2, clientX: 148, clientY: 124 });
    fireEvent.pointerUp(svg, { pointerId: 2, clientX: 148, clientY: 124 });

    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(projectMocks.updateProject).toHaveBeenCalled());
    const savedCircuit = projectMocks.updateProject.mock.calls.at(-1)?.[1].circuit;
    expect(savedCircuit.gates.find((gate: { id: string }) => gate.id === 'input_a')).toMatchObject({ x: 144, y: 144 });
    expect(savedCircuit.gates.find((gate: { id: string }) => gate.id === 'input_b')).toMatchObject({ x: 144, y: 264 });
    expect(savedCircuit.gates.find((gate: { id: string }) => gate.id === 'and_main')).toMatchObject({ x: 384, y: 192 });
    expect(savedCircuit.gates.find((gate: { id: string }) => gate.id === 'output_main')).toMatchObject({ x: 624, y: 192 });

    fireEvent.keyDown(window, { key: 'Backspace' });

    expect(svg.querySelectorAll('.gate-node')).toHaveLength(1);
    expect(svg.querySelectorAll('.wire')).toHaveLength(0);
    expect(screen.getByText('Ungespeichert')).toBeInTheDocument();
  });

  it('supports Ctrl+Z and Ctrl+Y for undo and redo', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    projectMocks.getProject.mockResolvedValue(
      testProject({
        id: 'project_editor',
        ownerId: currentUser.id,
        name: 'Shortcut Circuit',
        circuit: createStarterCircuit('Shortcut Circuit'),
      }),
    );
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Shortcut Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;

    await user.click(screen.getAllByRole('button', { name: /AND/ })[0]);
    fireEvent.click(grid, { clientX: 240, clientY: 120 });
    expect(svg.querySelectorAll('.gate-node')).toHaveLength(5);

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(svg.querySelectorAll('.gate-node')).toHaveLength(4);

    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(svg.querySelectorAll('.gate-node')).toHaveLength(5);
  });

  it('warns about unsaved changes before leaving and clears the warning after save', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    const circuit = createStarterCircuit('Dirty Circuit');
    let savedProject = testProject({
      id: 'project_editor',
      ownerId: currentUser.id,
      name: 'Dirty Circuit',
      circuit,
    });
    projectMocks.getProject.mockResolvedValue(savedProject);
    projectMocks.updateProject.mockImplementation(async (_projectId, patch) => {
      savedProject = { ...savedProject, ...patch, updatedAt: '2026-05-01T10:00:00.000Z' };
      return savedProject;
    });
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Dirty Circuit' })).toBeInTheDocument();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;
    await user.click(screen.getAllByRole('button', { name: /AND/ })[0]);
    fireEvent.click(grid, { clientX: 240, clientY: 120 });

    expect(screen.getByText('Ungespeichert')).toBeInTheDocument();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(screen.getByText('Gespeichert')).toBeInTheDocument());

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('shows a custom unsaved-changes dialog before using the toolbar back button', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    const circuit = createStarterCircuit('Guarded Circuit');
    projectMocks.getProject.mockResolvedValue(
      testProject({
        id: 'project_editor',
        ownerId: currentUser.id,
        name: 'Guarded Circuit',
        circuit,
      }),
    );
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Guarded Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;
    await user.click(screen.getAllByRole('button', { name: /AND/ })[0]);
    fireEvent.click(grid, { clientX: 240, clientY: 120 });

    await user.click(screen.getByRole('button', { name: /Projekt/ }));
    expect(screen.getByRole('dialog', { name: 'Projekt vor dem Verlassen speichern?' })).toBeInTheDocument();
    expect(screen.queryByText('Projects page')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('dialog', { name: 'Projekt vor dem Verlassen speichern?' })).not.toBeInTheDocument();
    expect(screen.queryByText('Projects page')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Projekt/ }));
    await user.click(screen.getByRole('button', { name: 'Ohne Speichern verlassen' }));
    expect(await screen.findByText('Projects page')).toBeInTheDocument();
  });

  it('can save from the unsaved-changes dialog before leaving', async () => {
    const user = userEvent.setup();
    const currentUser = testUser();
    const circuit = createStarterCircuit('Save Before Leave Circuit');
    let savedProject = testProject({
      id: 'project_editor',
      ownerId: currentUser.id,
      name: 'Save Before Leave Circuit',
      circuit,
    });
    projectMocks.getProject.mockResolvedValue(savedProject);
    projectMocks.updateProject.mockImplementation(async (_projectId, patch) => {
      savedProject = { ...savedProject, ...patch, updatedAt: '2026-05-01T10:00:00.000Z' };
      return savedProject;
    });
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Save Before Leave Circuit' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });
    const grid = svg.querySelector('[data-role="canvas-grid"]') as SVGRectElement;
    await user.click(screen.getAllByRole('button', { name: /AND/ })[0]);
    fireEvent.click(grid, { clientX: 240, clientY: 120 });

    await user.click(screen.getByRole('button', { name: /Projekt/ }));
    await user.click(screen.getByRole('button', { name: 'Speichern und verlassen' }));

    await waitFor(() => expect(projectMocks.updateProject).toHaveBeenCalled());
    expect(await screen.findByText('Projects page')).toBeInTheDocument();
  });

  it('shows a recovery state for missing projects', async () => {
    const currentUser = testUser();
    projectMocks.getProject.mockResolvedValue(null);
    window.localStorage.setItem(
      'bitflow.session',
      JSON.stringify({ token: 'session_editor', user: currentUser, createdAt: currentUser.createdAt }),
    );

    renderEditor('missing_project');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Projekt nicht gefunden' })).toBeInTheDocument());
  });
});
