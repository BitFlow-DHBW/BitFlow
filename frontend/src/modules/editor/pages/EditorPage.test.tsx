import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStarterCircuit } from '../../../simulation/gateLibrary';
import { testProject, testUser } from '../../../test/builders';
import { AuthProvider } from '../../auth/AuthContext';
import { PreferencesProvider } from '../../settings/PreferencesContext';
import { EditorPage } from './EditorPage';

const projectMocks = vi.hoisted(() => ({
  getProject: vi.fn(),
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

describe('EditorPage', () => {
  beforeEach(() => {
    projectMocks.getProject.mockReset();
    projectMocks.updateProject.mockReset();
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

    renderEditor();

    expect(await screen.findByRole('heading', { name: 'Starter Circuit' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Schaltungseditor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AND/ })).toBeInTheDocument();
    expect(screen.getByText(/Pin-Zust/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    await user.click(screen.getAllByRole('button', { name: /Input Pinfalse/ })[0]);

    expect(screen.getByRole('button', { name: /Input Pintrue/ })).toBeInTheDocument();
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
    expect(screen.getByText('Kommentar A')).toBeInTheDocument();
    expect(promptSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Baustein' }));
    await user.click(screen.getByRole('button', { name: /Zeile/ }));
    await user.click(screen.getByRole('button', { name: 'Baustein speichern' }));
    expect(screen.getByRole('button', { name: /Custom Gate/ })).toBeInTheDocument();

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
