import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EDITOR_PANEL_DEFINITIONS, createDefaultPanelStates } from '../panelLayout';
import { PanelLauncher } from './PanelLauncher';

describe('PanelLauncher', () => {
  it('renders all panel buttons and toggles panels', async () => {
    const user = userEvent.setup();
    const onTogglePanel = vi.fn();

    render(
      <PanelLauncher
        position={{ x: 320, y: 24 }}
        isMinimized={false}
        definitions={EDITOR_PANEL_DEFINITIONS}
        panelStates={createDefaultPanelStates()}
        onMove={vi.fn()}
        onToggleMinimized={vi.fn()}
        onTogglePanel={onTogglePanel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Session' }));

    expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Inspector' })).toHaveAttribute('aria-pressed', 'true');
    expect(onTogglePanel).toHaveBeenCalledWith('session');
  });

  it('moves the launcher with the drag handle', () => {
    const onMove = vi.fn();

    render(
      <PanelLauncher
        position={{ x: 320, y: 24 }}
        isMinimized={false}
        definitions={EDITOR_PANEL_DEFINITIONS}
        panelStates={createDefaultPanelStates()}
        onMove={onMove}
        onToggleMinimized={vi.fn()}
        onTogglePanel={vi.fn()}
      />,
    );

    const handle = screen.getByRole('button', { name: 'Panel-Menue minimieren oder verschieben' });
    Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn(), configurable: true });
    Object.defineProperty(handle, 'hasPointerCapture', { value: vi.fn().mockReturnValue(true), configurable: true });
    Object.defineProperty(handle, 'releasePointerCapture', { value: vi.fn(), configurable: true });

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 124, clientY: 148 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 124, clientY: 148 });

    expect(onMove).toHaveBeenCalledWith({ x: 344, y: 72 });
  });

  it('minimizes from a single handle click and keeps panel buttons hidden while minimized', async () => {
    const user = userEvent.setup();
    const onToggleMinimized = vi.fn();
    const { rerender } = render(
      <PanelLauncher
        position={{ x: 320, y: 24 }}
        isMinimized={false}
        definitions={EDITOR_PANEL_DEFINITIONS}
        panelStates={createDefaultPanelStates()}
        onMove={vi.fn()}
        onToggleMinimized={onToggleMinimized}
        onTogglePanel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Panel-Menue minimieren oder verschieben' }));

    expect(onToggleMinimized).toHaveBeenCalledTimes(1);

    rerender(
      <PanelLauncher
        position={{ x: 320, y: 24 }}
        isMinimized
        definitions={EDITOR_PANEL_DEFINITIONS}
        panelStates={createDefaultPanelStates()}
        onMove={vi.fn()}
        onToggleMinimized={onToggleMinimized}
        onTogglePanel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Panel-Menue ausklappen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Library' })).not.toBeInTheDocument();
  });
});
