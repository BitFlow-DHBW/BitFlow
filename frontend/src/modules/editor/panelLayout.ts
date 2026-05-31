export type EditorPanelId = 'library' | 'inspector' | 'signals' | 'session';
export type PanelDockPosition = 'left' | 'right';

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

export interface PanelContainerSize {
  width: number;
  height: number;
}

export interface EditorPanelState {
  id: EditorPanelId;
  isOpen: boolean;
  dockPosition: PanelDockPosition | null;
  floatingPosition: PanelPosition;
  size: PanelSize;
}

export interface EditorPanelDefinition {
  id: EditorPanelId;
  title: string;
  tabLabel: string;
  tabSide: 'left' | 'right';
}

export interface DockMetrics {
  left: number;
  right: number;
}

export interface PanelSafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PanelClampOptions {
  margin?: number;
  safeArea?: PanelSafeArea | null;
}

export type DockedPanelGroups = Record<PanelDockPosition, EditorPanelState[]>;

export const PANEL_STORAGE_KEY = 'bitflow.editor.panels.v2';
export const PANEL_LAUNCHER_STORAGE_KEY = 'bitflow.editor.panelLauncher.v1';

export const EDITOR_PANEL_DEFINITIONS: EditorPanelDefinition[] = [
  { id: 'library', title: 'Bibliothek', tabLabel: 'Bibliothek', tabSide: 'left' },
  { id: 'session', title: 'Session', tabLabel: 'Session', tabSide: 'left' },
  { id: 'inspector', title: 'Details', tabLabel: 'Details', tabSide: 'right' },
  { id: 'signals', title: 'Signale', tabLabel: 'Signale', tabSide: 'right' },
];

const DEFAULT_PANEL_STATES: Record<EditorPanelId, EditorPanelState> = {
  library: {
    id: 'library',
    isOpen: true,
    dockPosition: 'left',
    floatingPosition: { x: 24, y: 24 },
    size: { width: 300, height: 560 },
  },
  inspector: {
    id: 'inspector',
    isOpen: true,
    dockPosition: 'right',
    floatingPosition: { x: 860, y: 24 },
    size: { width: 340, height: 460 },
  },
  signals: {
    id: 'signals',
    isOpen: true,
    dockPosition: 'right',
    floatingPosition: { x: 820, y: 280 },
    size: { width: 340, height: 420 },
  },
  session: {
    id: 'session',
    isOpen: false,
    dockPosition: 'left',
    floatingPosition: { x: 320, y: 96 },
    size: { width: 520, height: 260 },
  },
};

const PANEL_MARGIN = 12;
const SIDE_DOCK_WIDTH = 340;
const LEFT_DOCK_WIDTH = 300;
const ZOOM_SAFE_AREA_WIDTH = 190;
const ZOOM_SAFE_AREA_HEIGHT = 70;
const PANEL_LAUNCHER_SIZE: PanelSize = { width: 344, height: 44 };
const DEFAULT_PANEL_LAUNCHER_POSITION: PanelPosition = { x: 336, y: 18 };

export function createDefaultPanelStates(): EditorPanelState[] {
  return EDITOR_PANEL_DEFINITIONS.map((definition) => clonePanelState(DEFAULT_PANEL_STATES[definition.id]));
}

export function resetPanelStates(): EditorPanelState[] {
  return createDefaultPanelStates();
}

export function clampPanelPosition(
  position: PanelPosition,
  panelSize: PanelSize,
  containerSize: PanelContainerSize,
  options: number | PanelClampOptions = PANEL_MARGIN,
): PanelPosition {
  const margin = typeof options === 'number' ? options : options.margin ?? PANEL_MARGIN;
  const safeArea = typeof options === 'number' ? null : options.safeArea ?? null;
  const maxX = Math.max(margin, containerSize.width - Math.min(panelSize.width, containerSize.width - margin * 2) - margin);
  const maxY = Math.max(margin, containerSize.height - Math.min(panelSize.height, containerSize.height - margin * 2) - margin);
  let nextPosition = {
    x: clamp(position.x, margin, maxX),
    y: clamp(position.y, margin, maxY),
  };

  if (safeArea && rectanglesOverlap(nextPosition, panelSize, safeArea)) {
    const leftOfSafeArea = safeArea.x - panelSize.width - margin;
    const belowSafeArea = safeArea.y + safeArea.height + margin;
    nextPosition =
      leftOfSafeArea >= margin
        ? { ...nextPosition, x: leftOfSafeArea }
        : { ...nextPosition, y: belowSafeArea };
  }

  return {
    x: clamp(nextPosition.x, margin, maxX),
    y: clamp(nextPosition.y, margin, maxY),
  };
}

export function getDockMetrics(states: EditorPanelState[]): DockMetrics {
  const groups = groupPanelsByDock(states);

  return {
    left: groups.left.length > 0 ? LEFT_DOCK_WIDTH : 0,
    right: groups.right.length > 0 ? SIDE_DOCK_WIDTH : 0,
  };
}

export function groupPanelsByDock(states: EditorPanelState[]): DockedPanelGroups {
  return states.reduce<DockedPanelGroups>(
    (groups, panel) => {
      if (panel.isOpen && panel.dockPosition) groups[panel.dockPosition].push(panel);
      return groups;
    },
    { left: [], right: [] },
  );
}

export function getNextActiveDockPanel(
  panels: EditorPanelState[] | EditorPanelId[],
  currentPanelId: EditorPanelId | null = null,
): EditorPanelId | null {
  const panelIds = panels.map((panel) => (typeof panel === 'string' ? panel : panel.id));
  if (panelIds.length === 0) return null;
  if (currentPanelId && panelIds.includes(currentPanelId)) return currentPanelId;
  return panelIds[0];
}

export function getZoomControlSafeArea(
  containerSize: PanelContainerSize,
  dockMetrics: DockMetrics,
  margin = PANEL_MARGIN,
): PanelSafeArea {
  const effectiveRightDock = containerSize.width <= 760 ? 0 : dockMetrics.right;

  return {
    x: Math.max(margin, containerSize.width - effectiveRightDock - ZOOM_SAFE_AREA_WIDTH - margin * 2),
    y: margin,
    width: ZOOM_SAFE_AREA_WIDTH,
    height: ZOOM_SAFE_AREA_HEIGHT,
  };
}

export function updatePanelOpen(states: EditorPanelState[], panelId: EditorPanelId, isOpen: boolean): EditorPanelState[] {
  return updatePanel(states, panelId, (panel) => ({ ...panel, isOpen }));
}

export function updatePanelDock(
  states: EditorPanelState[],
  panelId: EditorPanelId,
  dockPosition: PanelDockPosition | null,
): EditorPanelState[] {
  return updatePanel(states, panelId, (panel) => ({ ...panel, dockPosition, isOpen: true }));
}

export function updatePanelFloatingPosition(
  states: EditorPanelState[],
  panelId: EditorPanelId,
  position: PanelPosition,
  containerSize: PanelContainerSize,
  safeArea?: PanelSafeArea | null,
): EditorPanelState[] {
  return updatePanel(states, panelId, (panel) => ({
    ...panel,
    dockPosition: null,
    isOpen: true,
    floatingPosition: clampPanelPosition(position, panel.size, containerSize, { safeArea }),
  }));
}

export function createDefaultPanelLauncherPosition(): PanelPosition {
  return { ...DEFAULT_PANEL_LAUNCHER_POSITION };
}

export function clampPanelLauncherPosition(
  position: PanelPosition,
  containerSize: PanelContainerSize,
  dockMetrics: DockMetrics,
  zoomSafeArea?: PanelSafeArea | null,
  launcherSize = PANEL_LAUNCHER_SIZE,
  margin = PANEL_MARGIN,
): PanelPosition {
  const effectiveDockMetrics =
    containerSize.width <= 760 ? { left: 0, right: 0 } : dockMetrics;
  const availableWidth = Math.max(
    1,
    containerSize.width - effectiveDockMetrics.left - effectiveDockMetrics.right - margin * 2,
  );
  const effectiveSize = {
    width: Math.min(launcherSize.width, availableWidth),
    height: Math.min(launcherSize.height, Math.max(1, containerSize.height - margin * 2)),
  };
  const minX = margin + effectiveDockMetrics.left;
  const maxX = Math.max(minX, containerSize.width - effectiveDockMetrics.right - effectiveSize.width - margin);
  const minY = margin;
  const maxY = Math.max(minY, containerSize.height - effectiveSize.height - margin);
  let nextPosition = {
    x: clamp(position.x, minX, maxX),
    y: clamp(position.y, minY, maxY),
  };

  if (zoomSafeArea && rectanglesOverlap(nextPosition, effectiveSize, zoomSafeArea)) {
    const belowSafeArea = zoomSafeArea.y + zoomSafeArea.height + margin;
    const leftOfSafeArea = zoomSafeArea.x - effectiveSize.width - margin;

    if (belowSafeArea <= maxY) {
      nextPosition = { ...nextPosition, y: belowSafeArea };
    } else if (leftOfSafeArea >= minX) {
      nextPosition = { ...nextPosition, x: leftOfSafeArea };
    }
  }

  return {
    x: clamp(nextPosition.x, minX, maxX),
    y: clamp(nextPosition.y, minY, maxY),
  };
}

export function readStoredPanelLauncherPosition(
  storage: Storage | undefined = safeLocalStorage(),
): PanelPosition {
  if (!storage) return createDefaultPanelLauncherPosition();

  try {
    const raw = storage.getItem(PANEL_LAUNCHER_STORAGE_KEY);
    if (!raw) return createDefaultPanelLauncherPosition();
    const parsed = JSON.parse(raw) as Partial<PanelPosition>;

    return {
      x: typeof parsed.x === 'number' ? parsed.x : DEFAULT_PANEL_LAUNCHER_POSITION.x,
      y: typeof parsed.y === 'number' ? parsed.y : DEFAULT_PANEL_LAUNCHER_POSITION.y,
    };
  } catch {
    return createDefaultPanelLauncherPosition();
  }
}

export function writeStoredPanelLauncherPosition(
  position: PanelPosition,
  storage: Storage | undefined = safeLocalStorage(),
): void {
  storage?.setItem(PANEL_LAUNCHER_STORAGE_KEY, JSON.stringify(position));
}

export function clampFloatingPanels(
  states: EditorPanelState[],
  containerSize: PanelContainerSize,
  safeArea?: PanelSafeArea | null,
): EditorPanelState[] {
  let changed = false;
  const nextStates = states.map((panel) => {
    if (panel.dockPosition) return panel;

    const floatingPosition = clampPanelPosition(panel.floatingPosition, panel.size, containerSize, { safeArea });
    if (floatingPosition.x === panel.floatingPosition.x && floatingPosition.y === panel.floatingPosition.y) {
      return panel;
    }

    changed = true;
    return {
      ...panel,
      floatingPosition,
    };
  });

  return changed ? nextStates : states;
}

export function readStoredPanelStates(storage: Storage | undefined = safeLocalStorage()): EditorPanelState[] {
  if (!storage) return createDefaultPanelStates();

  try {
    const raw = storage.getItem(PANEL_STORAGE_KEY);
    if (!raw) return createDefaultPanelStates();
    const parsed = JSON.parse(raw) as Partial<EditorPanelState>[];
    return mergeStoredPanelStates(parsed);
  } catch {
    return createDefaultPanelStates();
  }
}

export function writeStoredPanelStates(states: EditorPanelState[], storage: Storage | undefined = safeLocalStorage()): void {
  storage?.setItem(PANEL_STORAGE_KEY, JSON.stringify(states));
}

function mergeStoredPanelStates(storedStates: Partial<EditorPanelState>[]): EditorPanelState[] {
  return createDefaultPanelStates().map((defaultState) => {
    const storedState = storedStates.find((entry) => entry.id === defaultState.id);
    if (!storedState) return defaultState;

    return {
      ...defaultState,
      ...storedState,
      dockPosition: normalizeDockPosition(storedState.dockPosition, defaultState.dockPosition),
      floatingPosition: {
        ...defaultState.floatingPosition,
        ...storedState.floatingPosition,
      },
      size: {
        ...defaultState.size,
        ...storedState.size,
      },
    };
  });
}

function clonePanelState(panel: EditorPanelState): EditorPanelState {
  return {
    ...panel,
    floatingPosition: { ...panel.floatingPosition },
    size: { ...panel.size },
  };
}

function updatePanel(
  states: EditorPanelState[],
  panelId: EditorPanelId,
  updater: (panel: EditorPanelState) => EditorPanelState,
): EditorPanelState[] {
  return states.map((panel) => (panel.id === panelId ? updater(panel) : panel));
}

function normalizeDockPosition(
  dockPosition: EditorPanelState['dockPosition'] | undefined,
  fallback: PanelDockPosition | null,
): PanelDockPosition | null {
  if (dockPosition === null) return null;
  return dockPosition === 'left' || dockPosition === 'right' ? dockPosition : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function rectanglesOverlap(position: PanelPosition, size: PanelSize, safeArea: PanelSafeArea): boolean {
  return (
    position.x < safeArea.x + safeArea.width &&
    position.x + size.width > safeArea.x &&
    position.y < safeArea.y + safeArea.height &&
    position.y + size.height > safeArea.y
  );
}

function safeLocalStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}
