import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../../components/Icon';

interface EditorSidePanelProps {
  side: 'left' | 'right';
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function toggleIcon(side: EditorSidePanelProps['side'], collapsed: boolean): IconName {
  if (side === 'left') return collapsed ? 'chevron-right' : 'chevron-left';
  return collapsed ? 'chevron-left' : 'chevron-right';
}

export function EditorSidePanel({ side, label, collapsed, onToggle, children }: EditorSidePanelProps) {
  const contentId = `editor-${side}-panel`;
  const actionLabel = collapsed ? `${label} öffnen` : `${label} einklappen`;

  return (
    <aside className={`editor-side-panel editor-side-panel-${side} ${collapsed ? 'is-collapsed' : ''}`} aria-label={label}>
      <button
        className="editor-side-toggle"
        type="button"
        aria-controls={contentId}
        aria-expanded={!collapsed}
        aria-label={actionLabel}
        title={actionLabel}
        onClick={onToggle}
      >
        <Icon name={toggleIcon(side, collapsed)} />
        <span>{collapsed ? label : actionLabel}</span>
      </button>

      {!collapsed && (
        <div id={contentId} className="editor-side-content">
          {children}
        </div>
      )}
    </aside>
  );
}
