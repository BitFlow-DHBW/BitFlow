import { Icon } from '../../../components/Icon';
import type { EditorMode } from '../../../types/circuit';

interface ToolbarProps {
  projectName: string;
  mode: EditorMode;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canPaste: boolean;
  canDelete: boolean;
  canSave: boolean;
  canCreateSession: boolean;
  saveState: string;
  saveDisabledReason?: string | null;
  onModeChange: (mode: EditorMode) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopySelection: () => void;
  onPasteClipboard: () => void;
  onSave: () => void;
  onCreateSession: () => void;
  onDeleteSelected: () => void;
  onOpenCustomDialog: () => void;
  onOpenImportDialog: () => void;
  onAddAnnotation: () => void;
}

const modes: Array<{ value: EditorMode; label: string; description: string }> = [
  { value: 'edit', label: 'Bearbeiten', description: 'Platzieren, verschieben, verbinden, löschen' },
  { value: 'simulate', label: 'Simulieren', description: 'Eingänge schalten' },
];

export function Toolbar({
  projectName,
  mode,
  canUndo,
  canRedo,
  canCopy,
  canPaste,
  canDelete,
  canSave,
  canCreateSession,
  saveState,
  saveDisabledReason,
  onModeChange,
  onBack,
  onUndo,
  onRedo,
  onCopySelection,
  onPasteClipboard,
  onSave,
  onCreateSession,
  onDeleteSelected,
  onOpenCustomDialog,
  onOpenImportDialog,
  onAddAnnotation,
}: ToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div className="toolbar-title">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Zur Projektübersicht" title="Zur Projektübersicht">
          <Icon name="arrow-left" />
        </button>
        <div>
          <p className="eyebrow">Schaltplaneditor</p>
          <h1>{projectName}</h1>
        </div>
      </div>

      <div className="mode-switcher" role="group" aria-label="Editor-Modus">
        {modes.map((entry) => (
          <button
            key={entry.value}
            className={mode === entry.value ? 'is-active' : ''}
            type="button"
            title={entry.description}
            onClick={() => onModeChange(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="toolbar-actions">
        <button className="icon-button" type="button" onClick={onUndo} disabled={!canUndo} aria-label="Rückgängig" title="Rückgängig">
          <Icon name="undo" />
        </button>
        <button className="icon-button" type="button" onClick={onRedo} disabled={!canRedo} aria-label="Wiederholen" title="Wiederholen">
          <Icon name="redo" />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onCopySelection}
          disabled={!canCopy}
          aria-label="Kopieren"
          title="Kopieren (Strg+C)"
        >
          <Icon name="copy" />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onPasteClipboard}
          disabled={!canPaste}
          aria-label="Einfügen"
          title="Einfügen (Strg+V)"
        >
          <Icon name="paste" />
        </button>
        <button className="ghost-button" type="button" onClick={onDeleteSelected} disabled={!canDelete}>
          <Icon name="trash" />
          Löschen
        </button>
        <button className="secondary-button" type="button" onClick={onAddAnnotation}>
          Kommentar
        </button>
        <button className="secondary-button" type="button" onClick={onOpenCustomDialog}>
          Baustein erstellen
        </button>
        <button className="secondary-button" type="button" onClick={onOpenImportDialog}>
          Baustein importieren
        </button>
        <button className="secondary-button" type="button" onClick={onCreateSession} disabled={!canCreateSession}>
          <Icon name="users" />
          Zusammenarbeiten
        </button>
        <button className="primary-button" type="button" onClick={onSave} disabled={!canSave} title={saveDisabledReason ?? undefined}>
          <Icon name="save" />
          Speichern
        </button>
        <span className="save-state">{saveState}</span>
      </div>
    </header>
  );
}
