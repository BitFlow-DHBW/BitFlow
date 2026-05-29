import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EditorPanelState } from '../panelLayout';
import { FloatingPanel } from './FloatingPanel';

function panelState(overrides: Partial<EditorPanelState> = {}): EditorPanelState {
  return {
    id: 'library',
    isOpen: true,
    dockPosition: null,
    floatingPosition: { x: 40, y: 60 },
    size: { width: 300, height: 400 },
    ...overrides,
  };
}

describe('FloatingPanel', () => {
  it('renders floating controls and supports docking and closing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDock = vi.fn();

    render(
      <FloatingPanel
        panel={panelState()}
        title="Bibliothek"
        onClose={onClose}
        onDock={onDock}
        onMove={vi.fn()}
        onUndock={vi.fn()}
      >
        <button type="button">AND</button>
      </FloatingPanel>,
    );

    expect(screen.getByRole('region', { name: 'Bibliothek' })).toHaveClass('is-floating');
    expect(screen.getByRole('button', { name: 'AND' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Bibliothek links anheften' }));
    await user.click(screen.getByRole('button', { name: 'Bibliothek einklappen' }));

    expect(onDock).toHaveBeenCalledWith('library', 'left');
    expect(onClose).toHaveBeenCalledWith('library');
  });

  it('moves floating panels with the header drag handle', () => {
    const onMove = vi.fn();

    render(
      <FloatingPanel
        panel={panelState()}
        title="Bibliothek"
        onClose={vi.fn()}
        onDock={vi.fn()}
        onMove={onMove}
        onUndock={vi.fn()}
      >
        <span>Content</span>
      </FloatingPanel>,
    );

    const handle = screen.getByTitle('Bibliothek verschieben');
    Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn(), configurable: true });
    Object.defineProperty(handle, 'hasPointerCapture', { value: vi.fn().mockReturnValue(true), configurable: true });
    Object.defineProperty(handle, 'releasePointerCapture', { value: vi.fn(), configurable: true });

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 34, clientY: 28 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 34, clientY: 28 });

    expect(onMove).toHaveBeenCalledWith('library', { x: 64, y: 78 });
  });

  it('renders docked panels with an undock action', async () => {
    const user = userEvent.setup();
    const onUndock = vi.fn();

    render(
      <FloatingPanel
        panel={panelState({ dockPosition: 'right' })}
        title="Inspector"
        onClose={vi.fn()}
        onDock={vi.fn()}
        onMove={vi.fn()}
        onUndock={onUndock}
      >
        <span>Eigenschaften</span>
      </FloatingPanel>,
    );

    expect(screen.getByRole('region', { name: 'Inspector' })).toHaveClass('is-docked');

    await user.click(screen.getByRole('button', { name: 'Loesen' }));

    expect(onUndock).toHaveBeenCalledWith('library');
  });
});
