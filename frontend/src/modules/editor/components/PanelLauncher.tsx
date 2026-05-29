import { useRef, type CSSProperties, type PointerEvent } from 'react';
import type {
  EditorPanelDefinition,
  EditorPanelId,
  EditorPanelState,
  PanelPosition,
} from '../panelLayout';

interface PanelLauncherProps {
  position: PanelPosition;
  isMinimized: boolean;
  definitions: EditorPanelDefinition[];
  panelStates: EditorPanelState[];
  onMove: (position: PanelPosition) => void;
  onToggleMinimized: () => void;
  onTogglePanel: (panelId: EditorPanelId) => void;
}

interface LauncherDragRef {
  pointerId: number;
  startClient: PanelPosition;
  startPosition: PanelPosition;
  moved: boolean;
}

export function PanelLauncher({
  position,
  isMinimized,
  definitions,
  panelStates,
  onMove,
  onToggleMinimized,
  onTogglePanel,
}: PanelLauncherProps) {
  const dragRef = useRef<LauncherDragRef | null>(null);

  function handleDragStart(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startPosition: position,
      moved: false,
    };
  }

  function handleDragMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaX = event.clientX - drag.startClient.x;
    const deltaY = event.clientY - drag.startClient.y;
    drag.moved = drag.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;
    if (!drag.moved) return;

    onMove({
      x: drag.startPosition.x + deltaX,
      y: drag.startPosition.y + deltaY,
    });
  }

  function handleDragEnd(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    if (event.currentTarget.hasPointerCapture?.(drag.pointerId)) {
      event.currentTarget.releasePointerCapture?.(drag.pointerId);
    }
    if (!drag.moved) onToggleMinimized();
    dragRef.current = null;
  }

  const launcherStyle = {
    left: position.x,
    top: position.y,
  } as CSSProperties;

  return (
    <div
      className={`panel-launcher ${isMinimized ? 'is-minimized' : ''}`}
      style={launcherStyle}
      aria-label="Editor Panels"
    >
      <button
        className="panel-launcher-handle"
        type="button"
        aria-label={isMinimized ? 'Panel-Menue ausklappen' : 'Panel-Menue minimieren oder verschieben'}
        title={isMinimized ? 'Panel-Menue ausklappen' : 'Panel-Menue minimieren oder verschieben'}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <span aria-hidden="true">::</span>
        {isMinimized && <span>Panels</span>}
      </button>

      {!isMinimized && definitions.map((definition) => {
        const panel = panelStates.find((entry) => entry.id === definition.id);
        const isOpen = Boolean(panel?.isOpen);

        return (
          <button
            key={definition.id}
            className={isOpen ? 'is-active' : ''}
            type="button"
            aria-pressed={isOpen}
            onClick={() => onTogglePanel(definition.id)}
          >
            {definition.tabLabel}
          </button>
        );
      })}
    </div>
  );
}
