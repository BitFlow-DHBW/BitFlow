interface CloseSessionDialogProps {
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CloseSessionDialog({ pending, onCancel, onConfirm }: CloseSessionDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="close-session-dialog-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Live-Kollaboration</p>
            <h2 id="close-session-dialog-title">Session wirklich schließen?</h2>
          </div>
        </div>

        <p className="muted">Alle Teilnehmer werden getrennt und der Einladungslink wird ungültig.</p>

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel} disabled={pending}>
            Abbrechen
          </button>
          <button className="primary-button" type="button" onClick={onConfirm} disabled={pending}>
            {pending ? 'Session wird geschlossen...' : 'Session schließen'}
          </button>
        </div>
      </section>
    </div>
  );
}
