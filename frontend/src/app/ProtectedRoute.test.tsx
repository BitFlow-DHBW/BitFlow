import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

const authState = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock('../modules/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: authState.isAuthenticated }),
}));

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <main>Secret settings</main>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<main>Login screen</main>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
  });

  it('redirects unauthenticated users to login', () => {
    renderProtectedRoute();

    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('renders protected children for authenticated users', () => {
    authState.isAuthenticated = true;
    renderProtectedRoute();

    expect(screen.getByText('Secret settings')).toBeInTheDocument();
  });
});
