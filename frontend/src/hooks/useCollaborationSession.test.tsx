import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyCircuit } from '../test/builders';
import type { CollaborationClient } from '../services/collaborationService';
import type { CollaborationCircuitState, CollaborationSession } from '../types/collaboration';
import { useCollaborationSession } from './useCollaborationSession';

function collaborationState(): CollaborationCircuitState {
  return {
    circuit: emptyCircuit(),
    inputSignals: {},
    customComponents: [],
  };
}

function sessionSnapshot(): CollaborationSession {
  return {
    sessionId: 'session_test',
    hostUserId: 'user_host',
    hostParticipantId: 'participant_host',
    hostConnectionId: 'connection_host',
    currentCircuit: collaborationState(),
    participants: [
      {
        participantId: 'participant_guest',
        userId: 'user_guest',
        displayName: 'Guest',
        connectionId: 'connection_guest',
        cursorPosition: null,
        isHost: false,
      },
    ],
    createdAt: '2026-05-28T10:00:00.000Z',
    isActive: true,
  };
}

function makeClient() {
  return {
    registerHandlers: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn(),
    joinSession: vi.fn().mockResolvedValue(sessionSnapshot()),
    leaveSession: vi.fn(),
    updateCircuit: vi.fn(),
    updateCursor: vi.fn(),
  } satisfies Partial<CollaborationClient>;
}

function Harness({ client }: { client: Partial<CollaborationClient> }) {
  useCollaborationSession({
    autoJoinSessionId: 'session_test',
    displayName: 'Guest',
    getCurrentState: collaborationState,
    onRemoteState: vi.fn(),
    clientFactory: () => client as CollaborationClient,
  });

  return <div>Session harness</div>;
}

describe('useCollaborationSession', () => {
  it('does not stop SignalR during the StrictMode negotiation cleanup pass', async () => {
    const client = makeClient();

    render(
      <StrictMode>
        <Harness client={client} />
      </StrictMode>,
    );

    await waitFor(() => expect(client.joinSession).toHaveBeenCalledWith('session_test', 'Guest'));
    await new Promise((resolve) => window.setTimeout(resolve, 300));

    expect(client.start).toHaveBeenCalledTimes(1);
    expect(client.stop).not.toHaveBeenCalled();
  });
});
