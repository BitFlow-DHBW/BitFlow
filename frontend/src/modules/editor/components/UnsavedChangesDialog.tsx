interface UnsavedChangesDialogProps {
  canSave: boolean;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveAndLeave: () => void;
}

export function UnsavedChangesDialog({
  canSave,
  saving,
  error,
  onCancel,
  onDiscard,
  onSaveAndLeave,
}: UnsavedChangesDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal unsaved-changes-modal" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Ungespeicherte Änderungen</p>
            <h2 id="unsaved-dialog-title">Projekt vor dem Verlassen speichern?</h2>
          </div>
        </div>

        <p className="muted">
          Deine letzten Änderungen sind noch nicht gespeichert. Du kannst zurückgehen, speichern oder die Seite ohne Speichern verlassen.
        </p>
        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel} disabled={saving}>
            Abbrechen
          </button>
          <button className="ghost-button" type="button" onClick={onDiscard} disabled={saving}>
            Ohne Speichern verlassen
          </button>
          <button className="primary-button" type="button" onClick={onSaveAndLeave} disabled={!canSave || saving}>
            {saving ? 'Speichert...' : 'Speichern und verlassen'}
          </button>
        </div>
      </section>
    </div>
  );
}
