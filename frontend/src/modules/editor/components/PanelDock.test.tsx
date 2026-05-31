import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EDITOR_PANEL_DEFINITIONS, type EditorPanelState } from '../panelLayout';
import { PanelDock } from './PanelDock';

function panelState(overrides: Partial<EditorPanelState>): EditorPanelState {
  return {
    id: 'inspector',
    isOpen: true,
    dockPosition: 'right',
    floatingPosition: { x: 40, y: 60 },
    size: { width: 340, height: 420 },
    ...overrides,
  };
}

describe('PanelDock', () => {
  it('renders multiple docked panels as tabs in one dock', async () => {
    const user = userEvent.setup();
    const onActivePanelChange = vi.fn();

    render(
      <PanelDock
        dockPosition="right"
        panels={[
          panelState({ id: 'inspector' }),
          panelState({ id: 'signals' }),
        ]}
        definitions={EDITOR_PANEL_DEFINITIONS}
        activePanelId="inspector"
        renderPanelContent={(panelId) => <div>{panelId} content</div>}
        onActivePanelChange={onActivePanelChange}
        onClose={vi.fn()}
        onDock={vi.fn()}
        onUndock={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: 'Rechte Leiste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Signale' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('inspector content')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Signale' }));

    expect(onActivePanelChange).toHaveBeenCalledWith('right', 'signals');
  });

  it('offers undock, close and move actions for the active panel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDock = vi.fn();
    const onUndock = vi.fn();

    render(
      <PanelDock
        dockPosition="right"
        panels={[panelState({ id: 'signals', dockPosition: 'right' })]}
        definitions={EDITOR_PANEL_DEFINITIONS}
        activePanelId="signals"
        renderPanelContent={(panelId) => <div>{panelId} content</div>}
        onActivePanelChange={vi.fn()}
        onClose={onClose}
        onDock={onDock}
        onUndock={onUndock}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Signale lösen' }));
    await user.click(screen.getByRole('button', { name: 'Signale nach links anheften' }));
    await user.click(screen.getByRole('button', { name: 'Signale einklappen' }));

    expect(onUndock).toHaveBeenCalledWith('signals');
    expect(onDock).toHaveBeenCalledWith('signals', 'left');
    expect(onClose).toHaveBeenCalledWith('signals');
  });
});
