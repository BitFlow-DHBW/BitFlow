import { useRef, type ReactNode } from 'react';
import { Icon } from '../../../components/Icon';
import type { EditorPanelState, PanelDockPosition, PanelPosition } from '../panelLayout';

interface FloatingPanelProps {
  panel: EditorPanelState;
  title: string;
  children: ReactNode;
  onClose: (panelId: EditorPanelState['id']) => void;
  onDock: (panelId: EditorPanelState['id'], dockPosition: PanelDockPosition) => void;
  onMove: (panelId: EditorPanelState['id'], position: PanelPosition) => void;
  onUndock: (panelId: EditorPanelState['id']) => void;
}

interface DragRef {
  pointerId: number;
  startClient: PanelPosition;
  startPosition: PanelPosition;
}

const dockLabels: Record<PanelDockPosition, string> = {
  left: 'Links',
  right: 'Rechts',
};

const dockPositions: PanelDockPosition[] = ['left', 'right'];

export function FloatingPanel({ panel, title, children, onClose, onDock, onMove, onUndock }: FloatingPanelProps) {
  const dragRef = useRef<DragRef | null>(null);
  const isDocked = Boolean(panel.dockPosition);

  function handleDragStart(event: React.PointerEvent<HTMLDivElement>) {
    if (isDocked) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startPosition: panel.floatingPosition,
    };
  }

  function handleDragMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    onMove(panel.id, {
      x: drag.startPosition.x + event.clientX - drag.startClient.x,
      y: drag.startPosition.y + event.clientY - drag.startClient.y,
    });
  }

  function handleDragEnd(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    if (event.currentTarget.hasPointerCapture?.(drag.pointerId)) {
      event.currentTarget.releasePointerCapture?.(drag.pointerId);
    }
    dragRef.current = null;
  }

  return (
    <section
      className={`floating-panel ${isDocked ? 'is-docked' : 'is-floating'}`}
      style={
        isDocked
          ? undefined
          : {
              left: panel.floatingPosition.x,
              top: panel.floatingPosition.y,
              width: panel.size.width,
              maxHeight: panel.size.height,
            }
      }
      aria-label={title}
    >
      <div className="floating-panel-header">
        <div
          className={`floating-panel-drag-handle ${isDocked ? '' : 'is-draggable'}`}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          title={isDocked ? `${title} ist angeheftet` : `${title} verschieben`}
        >
          <span className="drag-grip" aria-hidden="true">
            ::
          </span>
          <strong>{title}</strong>
        </div>

        <button
          className="icon-button small"
          type="button"
          aria-label={`${title} einklappen`}
          title="Einklappen"
          onClick={() => onClose(panel.id)}
        >
          <Icon name="x" />
        </button>
      </div>

      <div className="floating-panel-dockbar">
        {panel.dockPosition ? (
          <>
            <span>{dockLabels[panel.dockPosition]}</span>
            <button className="ghost-button small" type="button" onClick={() => onUndock(panel.id)}>
              Loesen
            </button>
          </>
        ) : (
          <>
            <span>Anheften</span>
            {dockPositions.map((dockPosition) => (
              <button
                key={dockPosition}
                className="ghost-button small"
                type="button"
                aria-label={`${title} ${dockLabels[dockPosition].toLowerCase()} anheften`}
                onClick={() => onDock(panel.id, dockPosition)}
              >
                {dockLabels[dockPosition]}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="floating-panel-content">{children}</div>
    </section>
  );
}
