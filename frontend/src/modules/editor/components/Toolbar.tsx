import type { EditorMode } from '../../../types/circuit';

interface ToolbarProps {
  projectName: string;
  mode: EditorMode;
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  saveState: string;
  onModeChange: (mode: EditorMode) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onDeleteSelected: () => void;
  onOpenCustomDialog: () => void;
  onOpenImportDialog: () => void;
  onAddAnnotation: () => void;
}

const modes: Array<{ value: EditorMode; label: string; description: string }> = [
  { value: 'edit', label: 'Edit', description: 'Platzieren, verschieben, verbinden, löschen' },
  { value: 'simulate', label: 'Simulate', description: 'Inputs schalten' },
];

export function Toolbar({
  projectName,
  mode,
  canUndo,
  canRedo,
  canDelete,
  saveState,
  onModeChange,
  onBack,
  onUndo,
  onRedo,
  onSave,
  onDeleteSelected,
  onOpenCustomDialog,
  onOpenImportDialog,
  onAddAnnotation,
}: ToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div className="toolbar-title">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Zur Projektübersicht">
          {'<'}
        </button>
        <div>
          <p className="eyebrow">Schematic Editor</p>
          <h1>{projectName}</h1>
        </div>
      </div>

      <div className="mode-switcher" role="group" aria-label="Editor Modus">
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
        <button className="icon-button" type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
          Undo
        </button>
        <button className="icon-button" type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
          Redo
        </button>
        <button className="ghost-button" type="button" onClick={onDeleteSelected} disabled={!canDelete}>
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
        <button className="primary-button" type="button" onClick={onSave}>
          Speichern
        </button>
        <span className="save-state">{saveState}</span>
      </div>
    </header>
  );
}
