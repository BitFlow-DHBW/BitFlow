import { describe, expect, it } from 'vitest';
import {
  clampPanelLauncherPosition,
  clampPanelPosition,
  createDefaultPanelStates,
  getDockMetrics,
  getNextActiveDockPanel,
  getZoomControlSafeArea,
  groupPanelsByDock,
  resetPanelStates,
  updatePanelDock,
  updatePanelFloatingPosition,
  updatePanelOpen,
} from './panelLayout';

describe('panelLayout', () => {
  it('opens, closes and resets panels', () => {
    const closed = updatePanelOpen(createDefaultPanelStates(), 'library', false);

    expect(closed.find((panel) => panel.id === 'library')?.isOpen).toBe(false);
    expect(resetPanelStates().find((panel) => panel.id === 'library')?.isOpen).toBe(true);
  });

  it('pins panels to left and right docks', () => {
    let states = updatePanelDock(createDefaultPanelStates(), 'library', 'right');
    states = updatePanelDock(states, 'session', 'left');

    expect(states.find((panel) => panel.id === 'library')?.dockPosition).toBe('right');
    expect(states.find((panel) => panel.id === 'session')?.dockPosition).toBe('left');
    expect(getDockMetrics(states)).toMatchObject({
      left: 300,
      right: 340,
    });
  });

  it('groups multiple docked panels into one dock per side', () => {
    const groups = groupPanelsByDock(createDefaultPanelStates());

    expect(groups.left.map((panel) => panel.id)).toEqual(['library']);
    expect(groups.right.map((panel) => panel.id)).toEqual(['inspector', 'signals']);
  });

  it('keeps a valid active dock tab when panels are removed', () => {
    expect(getNextActiveDockPanel(['inspector', 'signals'], 'signals')).toBe('signals');
    expect(getNextActiveDockPanel(['inspector'], 'signals')).toBe('inspector');
    expect(getNextActiveDockPanel([], 'signals')).toBeNull();
  });

  it('keeps floating panels inside the editor container', () => {
    const position = clampPanelPosition({ x: 900, y: -100 }, { width: 300, height: 200 }, { width: 640, height: 480 });

    expect(position).toEqual({ x: 328, y: 12 });
  });

  it('undocks and clamps a panel while storing the floating position', () => {
    const states = updatePanelFloatingPosition(
      createDefaultPanelStates(),
      'inspector',
      { x: 999, y: 999 },
      { width: 800, height: 600 },
    );
    const inspector = states.find((panel) => panel.id === 'inspector');

    expect(inspector?.dockPosition).toBeNull();
    expect(inspector?.isOpen).toBe(true);
    expect(inspector?.floatingPosition).toEqual({ x: 448, y: 128 });
  });

  it('keeps floating panels out of the zoom control safe area', () => {
    const safeArea = getZoomControlSafeArea({ width: 1280, height: 720 }, { left: 0, right: 0 });
    const position = clampPanelPosition(
      { x: 980, y: 20 },
      { width: 300, height: 220 },
      { width: 1280, height: 720 },
      { safeArea },
    );

    expect(position.x + 300).toBeLessThanOrEqual(safeArea.x);
  });

  it('keeps the panel launcher inside the visible canvas area and away from zoom controls', () => {
    const safeArea = getZoomControlSafeArea({ width: 1280, height: 720 }, { left: 300, right: 340 });
    const position = clampPanelLauncherPosition(
      { x: 1180, y: 16 },
      { width: 1280, height: 720 },
      { left: 300, right: 340 },
      safeArea,
    );

    expect(position.x).toBeLessThanOrEqual(1280 - 340 - 12);
    expect(position.y).toBeGreaterThanOrEqual(safeArea.y + safeArea.height + 12);
    const topLeftPosition = clampPanelLauncherPosition(
      { x: -100, y: -100 },
      { width: 1280, height: 720 },
      { left: 300, right: 340 },
      safeArea,
    );

    expect(topLeftPosition.x).toBe(312);
    expect(topLeftPosition.y).toBe(12);
  });

  it('treats side docks as overlays for launcher clamping on small screens', () => {
    const safeArea = getZoomControlSafeArea({ width: 420, height: 640 }, { left: 300, right: 340 });
    const position = clampPanelLauncherPosition(
      { x: -100, y: -100 },
      { width: 420, height: 640 },
      { left: 300, right: 340 },
      safeArea,
    );

    expect(position.x).toBe(12);
    expect(position.y).toBeGreaterThanOrEqual(safeArea.y + safeArea.height + 12);
  });
});
