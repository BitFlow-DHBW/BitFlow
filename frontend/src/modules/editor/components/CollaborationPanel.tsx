import type { CollaborationRole, CollaborationSession } from '../../../types/collaboration';

interface CollaborationPanelProps {
  session: CollaborationSession | null;
  role: CollaborationRole | null;
  inviteLink: string | null;
  message: string | null;
  onCopyInviteLink: () => void;
  onLeaveSession: () => void;
}

export function CollaborationPanel({
  session,
  role,
  inviteLink,
  message,
  onCopyInviteLink,
  onLeaveSession,
}: CollaborationPanelProps) {
  if (!session && !message) return null;

  return (
    <section className="collaboration-panel" aria-label="Collaboration session">
      {session ? (
        <>
          <div className="collaboration-summary">
            <strong>{role === 'host' ? 'Host' : 'Participant'}</strong>
            <span>{session.participants.length} Teilnehmer</span>
          </div>

          {inviteLink && (
            <label className="invite-link-field">
              <span>Invite-Link</span>
              <input value={inviteLink} readOnly />
            </label>
          )}

          <div className="session-actions">
            {inviteLink && (
              <button className="secondary-button small" type="button" onClick={onCopyInviteLink}>
                Copy Invite Link
              </button>
            )}
            <button className="ghost-button small" type="button" onClick={onLeaveSession}>
              Leave Session
            </button>
          </div>

          <div className="participant-list" aria-label="Participants">
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

