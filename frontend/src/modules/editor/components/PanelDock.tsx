import type { ReactNode } from 'react';
import { Icon } from '../../../components/Icon';
import type {
  EditorPanelDefinition,
  EditorPanelId,
  EditorPanelState,
  PanelDockPosition,
} from '../panelLayout';

interface PanelDockProps {
  dockPosition: PanelDockPosition;
  panels: EditorPanelState[];
  definitions: EditorPanelDefinition[];
  activePanelId: EditorPanelId | null;
  renderPanelContent: (panelId: EditorPanelId) => ReactNode;
  onActivePanelChange: (dockPosition: PanelDockPosition, panelId: EditorPanelId) => void;
  onClose: (panelId: EditorPanelId) => void;
  onDock: (panelId: EditorPanelId, dockPosition: PanelDockPosition) => void;
  onUndock: (panelId: EditorPanelId) => void;
}

const dockLabels: Record<PanelDockPosition, string> = {
  left: 'Links',
  right: 'Rechts',
};

const dockPositions: PanelDockPosition[] = ['left', 'right'];

export function PanelDock({
  dockPosition,
  panels,
  definitions,
  activePanelId,
  renderPanelContent,
  onActivePanelChange,
  onClose,
  onDock,
  onUndock,
}: PanelDockProps) {
  const activePanel = panels.find((panel) => panel.id === activePanelId) ?? panels[0] ?? null;
  if (!activePanel) return null;

  const activeDefinition = findDefinition(definitions, activePanel.id);
  const tabListLabel = `${dockLabels[dockPosition]} Dock Panels`;

  return (
    <section
      className={`panel-dock panel-dock-${dockPosition}`}
      aria-label={`${dockLabels[dockPosition]} Dock`}
      data-dock-position={dockPosition}
    >
      <div className="panel-dock-header">
        <div className="panel-dock-title">
          <span>{dockLabels[dockPosition]} Dock</span>
          <small>{panels.length === 1 ? '1 Panel' : `${panels.length} Panels`}</small>
        </div>

        <div className="panel-dock-actions">
          <button
            className="icon-button small"
            type="button"
            aria-label={`${activeDefinition.title} loesen`}
            title="Loesen"
            onClick={() => onUndock(activePanel.id)}
          >
            <Icon name="chevron-right" />
          </button>
          <button
            className="icon-button small"
            type="button"
            aria-label={`${activeDefinition.title} einklappen`}
            title="Einklappen"
            onClick={() => onClose(activePanel.id)}
          >
            <Icon name="x" />
          </button>
        </div>
      </div>

      <div className="panel-dock-tabs" role="tablist" aria-label={tabListLabel}>
        {panels.map((panel) => {
          const definition = findDefinition(definitions, panel.id);
          const isActive = panel.id === activePanel.id;

          return (
            <button
              key={panel.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? 'is-active' : ''}
              onClick={() => onActivePanelChange(dockPosition, panel.id)}
            >
              {definition.title}
            </button>
          );
        })}
      </div>

      <div className="panel-dock-toolbar" aria-label={`${activeDefinition.title} Dockposition`}>
        <span>Andocken</span>
        {dockPositions
          .filter((position) => position !== dockPosition)
          .map((position) => (
            <button
              key={position}
              className="ghost-button small"
              type="button"
              aria-label={`${activeDefinition.title} nach ${dockLabels[position].toLowerCase()} anheften`}
              onClick={() => onDock(activePanel.id, position)}
            >
              {dockLabels[position]}
            </button>
          ))}
      </div>

      <div
        className={`panel-dock-content panel-dock-content-${dockPosition}`}
        role="tabpanel"
        aria-label={activeDefinition.title}
      >
        {renderPanelContent(activePanel.id)}
      </div>
    </section>
  );
}

function findDefinition(definitions: EditorPanelDefinition[], panelId: EditorPanelId): EditorPanelDefinition {
  const definition = definitions.find((entry) => entry.id === panelId);
  if (!definition) throw new Error(`Unknown editor panel: ${panelId}`);
  return definition;
}
