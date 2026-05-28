import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyCircuit } from '../../../test/builders';
import type { CollaborationSession } from '../../../types/collaboration';
import { CollaborationPanel } from './CollaborationPanel';

function makeSession(): CollaborationSession {
  return {
    sessionId: 'session_test',
    hostUserId: 'user_host',
    hostParticipantId: 'participant_host',
    hostConnectionId: 'connection_host',
    currentCircuit: {
      circuit: emptyCircuit(),
      inputSignals: {},
      customComponents: [],
    },
    participants: [
      {
        participantId: 'participant_host',
        userId: 'user_host',
        displayName: 'Host User',
        connectionId: 'connection_host',
        cursorPosition: null,
        isHost: true,
      },
      {
        participantId: 'participant_guest',
        userId: null,
        displayName: 'Guest User',
        connectionId: 'connection_guest',
        cursorPosition: { x: 120, y: 80 },
        isHost: false,
      },
    ],
    createdAt: '2026-05-28T10:00:00.000Z',
    isActive: true,
  };
}

describe('CollaborationPanel', () => {
  it('renders nothing when there is no active session or message', () => {
    const { container } = render(
      <CollaborationPanel
        session={null}
        role={null}
        inviteLink={null}
        message={null}
        onCopyInviteLink={vi.fn()}
        onLeaveSession={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders host session details and action buttons', () => {
    const copyInviteLink = vi.fn();
    const leaveSession = vi.fn();

    render(
      <CollaborationPanel
        session={makeSession()}
        role="host"
        inviteLink="http://localhost:5173/?session=session_test"
        message={null}
        onCopyInviteLink={copyInviteLink}
        onLeaveSession={leaveSession}
      />,
    );

    expect(screen.getByRole('region', { name: /collaboration session/i })).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('2 Teilnehmer')).toBeInTheDocument();
    expect(screen.getByLabelText('Invite-Link')).toHaveValue('http://localhost:5173/?session=session_test');
    expect(screen.getByText(/Host User.*Host/)).toBeInTheDocument();
    expect(screen.getByText('Guest User')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));
    fireEvent.click(screen.getByRole('button', { name: /leave session/i }));

    expect(copyInviteLink).toHaveBeenCalledTimes(1);
    expect(leaveSession).toHaveBeenCalledTimes(1);
  });

  it('hides invite actions for participants without an invite link', () => {
    render(
      <CollaborationPanel
        session={makeSession()}
        role="participant"
        inviteLink={null}
        message={null}
        onCopyInviteLink={vi.fn()}
        onLeaveSession={vi.fn()}
      />,
    );

    expect(screen.getByText('Participant')).toBeInTheDocument();
    expect(screen.queryByLabelText('Invite-Link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy invite link/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave session/i })).toBeInTheDocument();
  });

  it('renders an ended-session message without session controls', () => {
    render(
      <CollaborationPanel
        session={null}
        role={null}
        inviteLink={null}
        message="Session ended by host"
        onCopyInviteLink={vi.fn()}
        onLeaveSession={vi.fn()}
      />,
    );

    expect(screen.getByText('Session ended by host')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /leave session/i })).not.toBeInTheDocument();
  });
});
