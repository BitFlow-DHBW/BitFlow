import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { testProject, testUser } from '../test/builders';

describe('App', () => {
  it('starts on the landing page for guests', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(screen.getByRole('heading', { name: 'BitFlow' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('routes authenticated users from home to the projects page', async () => {
    const user = testUser();
    window.localStorage.setItem('bitflow.session', JSON.stringify({ token: 'session_test', user, createdAt: user.createdAt }));
    window.localStorage.setItem('bitflow.projects', JSON.stringify([testProject({ ownerId: user.id, name: 'ALU' })]));
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
