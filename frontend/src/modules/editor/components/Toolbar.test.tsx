import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from './Toolbar';

function renderToolbar(overrides = {}) {
  const props = {
    projectName: 'ALU',
    mode: 'edit' as const,
    canUndo: false,
    canRedo: true,
    canDelete: true,
    canSave: true,
    canCreateSession: true,
    saveState: 'Ungespeichert',
    saveDisabledReason: null,
    onModeChange: vi.fn(),
    onBack: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onSave: vi.fn(),
    onCreateSession: vi.fn(),
    onDeleteSelected: vi.fn(),
    onOpenCustomDialog: vi.fn(),
    onOpenImportDialog: vi.fn(),
    onAddAnnotation: vi.fn(),
    ...overrides,
  };
  render(<Toolbar {...props} />);
  return props;
}

describe('Toolbar', () => {
  it('renders project state and invokes command callbacks', async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    expect(document.querySelector('.editor-toolbar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ALU' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled();
    expect(screen.getByText('Ungespeichert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    await user.click(screen.getByRole('button', { name: 'Redo' }));
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await user.click(screen.getByRole('button', { name: 'Baustein erstellen' }));
    await user.click(screen.getByRole('button', { name: 'Baustein importieren' }));
    await user.click(screen.getByRole('button', { name: 'Create Session' }));
    await user.click(screen.getByRole('button', { name: 'Kommentar' }));
    await user.click(screen.getByRole('button', { name: /Projekt/ }));

    expect(props.onModeChange).toHaveBeenCalledWith('simulate');
    expect(props.onRedo).toHaveBeenCalled();
    expect(props.onSave).toHaveBeenCalled();
    expect(props.onOpenCustomDialog).toHaveBeenCalled();
    expect(props.onOpenImportDialog).toHaveBeenCalled();
    expect(props.onCreateSession).toHaveBeenCalled();
    expect(props.onAddAnnotation).toHaveBeenCalled();
    expect(props.onBack).toHaveBeenCalled();
  });

  it('marks the active editor mode', () => {
    renderToolbar({ mode: 'simulate' });

    expect(screen.getByRole('button', { name: 'Simulate' })).toHaveClass('is-active');
  });

  it('disables saving for participants', () => {
    renderToolbar({ canSave: false, saveDisabledReason: 'Only host can save' });

    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Speichern' })).toHaveAttribute('title', 'Only host can save');
  });
});
