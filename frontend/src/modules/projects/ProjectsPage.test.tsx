import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProjectsPage } from './ProjectsPage';
import { testProject } from '../../test/builders';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user_test', name: 'Ada', email: 'ada@bitflow.test', createdAt: '2026-05-01T00:00:00.000Z' } }),
}));

describe('ProjectsPage', () => {
  it('lists and deletes local projects for the active user', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('bitflow.projects', JSON.stringify([testProject({ id: 'project_a', name: 'ALU' })]));

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'ALU' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /L/ }));

    await waitFor(() => expect(screen.getByText('Noch keine Projekte')).toBeInTheDocument());
  });

  it('creates a new project from the sidebar form', async () => {
    const user = userEvent.setup();

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

    const stored = JSON.parse(window.localStorage.getItem('bitflow.projects') ?? '[]');
    expect(stored[0]).toMatchObject({ ownerId: 'user_test', name: 'Decoder', description: '2-to-4 decoder' });
  });
});
