import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { testProject, testUser } from '../test/builders';

const projectMocks = vi.hoisted(() => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('../services/projectService', () => ({
  projectService: projectMocks,
}));

describe('App', () => {
  beforeEach(() => {
    projectMocks.listProjects.mockReset();
  });

  it('starts on the landing page for guests', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(screen.getByRole('heading', { name: 'BitFlow' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Anmelden' })[0]).toHaveAttribute('href', '/login');
  });

  it('routes authenticated users from home to the projects page', async () => {
    const user = testUser();
    projectMocks.listProjects.mockResolvedValue([testProject({ ownerId: user.id, name: 'ALU' })]);
    window.localStorage.setItem('bitflow.session', JSON.stringify({ token: 'session_test', user, createdAt: user.createdAt }));
    window.history.pushState({}, '', '/');

    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'ALU' })).toBeInTheDocument());
  });

  it('redirects unknown routes back to the public home route', async () => {
    window.history.pushState({}, '', '/does-not-exist');

    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'BitFlow' })).toBeInTheDocument());
  });
});
