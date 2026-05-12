import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders the public product entry points and core value sections', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'BitFlow' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Registrieren' })).toHaveAttribute('href', '/register');
    expect(screen.getByText('Visueller Editor')).toBeInTheDocument();
    expect(screen.getByText('Projektverwaltung')).toBeInTheDocument();
  });
});
