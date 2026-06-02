import { Icon } from '../../../components/Icon';
import type { CollaborationRole, CollaborationSession } from '../../../types/collaboration';

export type InviteCopyStatus = 'idle' | 'copied' | 'failed';

interface CollaborationPanelProps {
  session: CollaborationSession | null;
  role: CollaborationRole | null;
  inviteLink: string | null;
  copyStatus?: InviteCopyStatus;
  message: string | null;
  onCopyInviteLink: () => void;
  onLeaveSession: () => void;
  onCloseSession: () => void;
}

export function CollaborationPanel({
  session,
  role,
  inviteLink,
  copyStatus = 'idle',
  message,
  onCopyInviteLink,
  onLeaveSession,
  onCloseSession,
}: CollaborationPanelProps) {
  if (!session && !message) return null;

  const copyLabel =
    copyStatus === 'copied'
      ? 'Einladungslink kopiert'
      : copyStatus === 'failed'
        ? 'Einladungslink konnte nicht kopiert werden'
        : 'Einladungslink kopieren';

  return (
    <section className="collaboration-panel" aria-label="Kollaborationssession">
      {session ? (
        <>
          <div className="collaboration-summary">
            <strong>{role === 'host' ? 'Host' : 'Teilnehmer'}</strong>
            <span>{session.participants.length} Teilnehmer</span>
          </div>

          {inviteLink && (
            <label className="invite-link-field">
              <span>Einladungslink</span>
              <input value={inviteLink} readOnly />
            </label>
          )}

          <div className="session-actions">
            {inviteLink && (
              <button
                className="icon-button small"
                type="button"
                onClick={onCopyInviteLink}
                aria-label={copyLabel}
                title={copyLabel}
              >
                <Icon name={copyStatus === 'copied' ? 'check' : 'copy'} />
              </button>
            )}
            <button
              className="ghost-button small"
              type="button"
              onClick={role === 'host' ? onCloseSession : onLeaveSession}
            >
              {role === 'host' ? 'Session schließen' : 'Session verlassen'}
            </button>
            {copyStatus !== 'idle' && (
              <span className={`copy-feedback ${copyStatus === 'failed' ? 'is-error' : ''}`} role="status">
                {copyStatus === 'copied' ? 'Kopiert' : 'Kopieren fehlgeschlagen'}
              </span>
            )}
          </div>

          <div className="participant-list" aria-label="Teilnehmer">
            {session.participants.map((participant) => (
              <span key={participant.participantId} className={participant.isHost ? 'is-host' : ''}>
                {participant.displayName}
                {participant.isHost ? ' · Host' : ''}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="session-message">{message}</p>
      )}
    </section>
  );
}

