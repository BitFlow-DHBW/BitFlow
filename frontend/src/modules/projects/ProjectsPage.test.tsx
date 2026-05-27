import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsPage } from './ProjectsPage';
import { testProject } from '../../test/builders';

const projectMocks = vi.hoisted(() => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user_test', name: 'Ada', email: 'ada@bitflow.test', createdAt: '2026-05-01T00:00:00.000Z' } }),
}));

vi.mock('../../services/projectService', () => ({
  projectService: projectMocks,
}));

describe('ProjectsPage', () => {
  beforeEach(() => {
    projectMocks.listProjects.mockReset();
    projectMocks.createProject.mockReset();
    projectMocks.deleteProject.mockReset();
    projectMocks.listProjects.mockResolvedValue([testProject({ id: 'project_a', name: 'ALU' })]);
    projectMocks.createProject.mockResolvedValue(testProject({ id: 'project_created', name: 'Decoder' }));
    projectMocks.deleteProject.mockResolvedValue(undefined);
  });

  it('lists and deletes backend projects for the active user', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'ALU' })).toBeInTheDocument();

    projectMocks.listProjects.mockResolvedValueOnce([]);
    await user.click(screen.getByRole('button', { name: /Loeschen|Löschen|L/ }));

    await waitFor(() => expect(screen.getByText('Noch keine Projekte')).toBeInTheDocument());
    expect(projectMocks.deleteProject).toHaveBeenCalledWith('project_a');
  });

  it('creates a new project from the sidebar form', async () => {
    const user = userEvent.setup();
    projectMocks.listProjects.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    await screen.findByText('Noch keine Projekte');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Decoder');
    await user.type(screen.getByLabelText('Beschreibung'), '2-to-4 decoder');
    await user.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    expect(projectMocks.createProject).toHaveBeenCalledWith('Decoder', '2-to-4 decoder');
  });
});
