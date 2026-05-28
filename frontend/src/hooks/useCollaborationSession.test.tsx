import { StrictMode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyCircuit } from '../test/builders';
import type { CollaborationClient, CollaborationEventHandlers } from '../services/collaborationService';
import type {
  CollaborationCircuitState,
  CollaborationParticipant,
  CollaborationSession,
} from '../types/collaboration';
import { useCollaborationSession } from './useCollaborationSession';

type CollaborationHookResult = ReturnType<typeof useCollaborationSession>;

interface TestClient extends Partial<CollaborationClient> {
  handlers: CollaborationEventHandlers | null;
}

function collaborationState(): CollaborationCircuitState {
  return {
    circuit: emptyCircuit(),
    inputSignals: {},
    customComponents: [],
  };
}

function hostSessionSnapshot(): CollaborationSession {
  return {
    sessionId: 'session_test',
    hostUserId: 'user_host',
    hostParticipantId: 'participant_host',
    hostConnectionId: 'connection_host',
    currentCircuit: collaborationState(),
    participants: [
      {
        participantId: 'participant_host',
        userId: 'user_host',
        displayName: 'Host',
        connectionId: 'connection_host',
        cursorPosition: null,
        isHost: true,
      },
    ],
    createdAt: '2026-05-28T10:00:00.000Z',
    isActive: true,
  };
}

function guestSessionSnapshot(): CollaborationSession {
  return {
    ...hostSessionSnapshot(),
    participants: [
      hostSessionSnapshot().participants[0],
      {
        participantId: 'participant_guest',
        userId: 'user_guest',
        displayName: 'Guest',
        connectionId: 'connection_guest',
        cursorPosition: null,
        isHost: false,
      },
    ],
  };
}

function guestParticipant(overrides: Partial<CollaborationParticipant> = {}): CollaborationParticipant {
  return {
    participantId: 'participant_guest',
    userId: 'user_guest',
    displayName: 'Guest',
    connectionId: 'connection_guest',
    cursorPosition: null,
    isHost: false,
    ...overrides,
  };
}

function makeClient(): TestClient {
  const client: TestClient = {
    handlers: null,
    registerHandlers: vi.fn((handlers: CollaborationEventHandlers) => {
      client.handlers = handlers;
    }),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(hostSessionSnapshot()),
    joinSession: vi.fn().mockResolvedValue(guestSessionSnapshot()),
    leaveSession: vi.fn().mockResolvedValue(undefined),
    updateCircuit: vi.fn().mockResolvedValue(undefined),
    updateCursor: vi.fn().mockResolvedValue(undefined),
  };

  return client;
}

function Harness({
  autoJoinSessionId = null,
  client,
  displayName = 'Guest',
  getCurrentState = collaborationState,
  onRemoteState = vi.fn(),
  onRender,
}: {
  autoJoinSessionId?: string | null;
  client: Partial<CollaborationClient>;
  displayName?: string;
  getCurrentState?: () => CollaborationCircuitState;
  onRemoteState?: (state: CollaborationCircuitState) => void;
  onRender: (result: CollaborationHookResult) => void;
}) {
  const result = useCollaborationSession({
    autoJoinSessionId,
    displayName,
    getCurrentState,
    onRemoteState,
    clientFactory: () => client as CollaborationClient,
  });

  onRender(result);

  return <div>Session harness</div>;
}

function renderHarness(options: {
  autoJoinSessionId?: string | null;
  client?: TestClient;
  displayName?: string;
  getCurrentState?: () => CollaborationCircuitState;
  onRemoteState?: (state: CollaborationCircuitState) => void;
} = {}) {
  let current: CollaborationHookResult | null = null;
  const client = options.client ?? makeClient();
  const onRemoteState = options.onRemoteState ?? vi.fn();
  const view = render(
    <Harness
      autoJoinSessionId={options.autoJoinSessionId}
      client={client}
      displayName={options.displayName}
      getCurrentState={options.getCurrentState}
      onRemoteState={onRemoteState}
      onRender={(result) => {
        current = result;
      }}
    />,
  );

  return {
    client,
    onRemoteState,
    ...view,
    get result() {
      if (!current) throw new Error('Hook result is not available yet.');
      return current;
    },
  };
}

describe('useCollaborationSession', () => {
  it('does not stop SignalR during the StrictMode negotiation cleanup pass', async () => {
    const client = makeClient();

    render(
      <StrictMode>
        <Harness
          autoJoinSessionId="session_test"
          client={client}
          onRender={() => undefined}
        />
      </StrictMode>,
    );

    await waitFor(() => expect(client.joinSession).toHaveBeenCalledWith('session_test', 'Guest'));
    await new Promise((resolve) => window.setTimeout(resolve, 300));

    expect(client.start).toHaveBeenCalledTimes(1);
    expect(client.stop).not.toHaveBeenCalled();
  });

  it('creates a host session from the current circuit state', async () => {
    const getCurrentState = vi.fn(collaborationState);
    const harness = renderHarness({ displayName: 'Host', getCurrentState });

    await act(async () => {
      await harness.result.createSession();
    });

    await waitFor(() => expect(harness.result.status).toBe('active'));
    expect(harness.client.start).toHaveBeenCalled();
    expect(harness.client.createSession).toHaveBeenCalledWith(collaborationState(), 'Host');
    expect(getCurrentState).toHaveBeenCalled();
    expect(harness.result.session?.sessionId).toBe('session_test');
    expect(harness.result.localParticipantId).toBe('participant_host');
    expect(harness.result.role).toBe('host');
    expect(harness.result.message).toBeNull();
  });

  it('joins a session from an invite link and applies the remote circuit', async () => {
    const onRemoteState = vi.fn();
    const harness = renderHarness({ autoJoinSessionId: 'session_test', onRemoteState });

    await waitFor(() => expect(harness.client.joinSession).toHaveBeenCalledWith('session_test', 'Guest'));

    expect(harness.result.status).toBe('active');
    expect(harness.result.role).toBe('participant');
    expect(harness.result.localParticipantId).toBe('participant_guest');
    expect(onRemoteState).toHaveBeenCalledWith(guestSessionSnapshot().currentCircuit);
  });

  it('shows an error when creating a session fails', async () => {
    const client = makeClient();
    vi.mocked(client.createSession!).mockRejectedValue(new Error('Backend nicht erreichbar'));
    const harness = renderHarness({ client });

    await act(async () => {
      await harness.result.createSession();
    });

    expect(harness.result.status).toBe('error');
    expect(harness.result.message).toBe('Backend nicht erreichbar');
    expect(harness.result.session).toBeNull();
  });

  it('updates participants, remote state and session end messages from hub events', async () => {
    const onRemoteState = vi.fn();
    const harness = renderHarness({ onRemoteState });

    await act(async () => {
      await harness.result.createSession();
    });

    act(() => {
      harness.client.handlers?.participantJoined?.(guestParticipant());
    });
    await waitFor(() => expect(harness.result.session?.participants).toHaveLength(2));

    act(() => {
      harness.client.handlers?.cursorUpdated?.(guestParticipant({ cursorPosition: { x: 40, y: 50 } }));
    });
    await waitFor(() => expect(harness.result.remoteCursors).toEqual([
      {
        participantId: 'participant_guest',
        displayName: 'Guest',
        position: { x: 40, y: 50 },
      },
    ]));

    const nextCircuit = {
      ...collaborationState(),
      inputSignals: { switch_1: true },
    };
    act(() => {
      harness.client.handlers?.circuitUpdated?.({
        sessionId: 'session_test',
        sourceParticipantId: 'participant_guest',
        currentCircuit: nextCircuit,
        updatedAt: '2026-05-28T10:00:01.000Z',
      });
    });

    expect(onRemoteState).toHaveBeenCalledWith(nextCircuit);

    act(() => {
      harness.client.handlers?.participantLeft?.('participant_guest');
    });
    await waitFor(() => expect(harness.result.session?.participants).toHaveLength(1));

    act(() => {
      harness.client.handlers?.sessionEnded?.({
        sessionId: 'session_test',
        reason: 'Session wurde vom Host beendet.',
      });
    });

    await waitFor(() => expect(harness.result.status).toBe('ended'));
    expect(harness.result.session).toBeNull();
    expect(harness.result.localParticipantId).toBeNull();
    expect(harness.result.message).toBe('Session wurde vom Host beendet.');
  });

  it('leaves an active session locally and on the hub', async () => {
    const harness = renderHarness();

    await act(async () => {
      await harness.result.createSession();
    });
    await act(async () => {
      await harness.result.leaveSession();
    });

    expect(harness.client.leaveSession).toHaveBeenCalledWith('session_test');
    expect(harness.result.status).toBe('idle');
    expect(harness.result.session).toBeNull();
    expect(harness.result.localParticipantId).toBeNull();
    expect(harness.result.message).toBe('Session verlassen.');
  });

  it('does not overwrite a host-ended state while leave is resolving', async () => {
    let resolveLeave: (() => void) | null = null;
    const client = makeClient();
    vi.mocked(client.leaveSession!).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLeave = resolve;
        }),
    );
    const harness = renderHarness({ client });

    await act(async () => {
      await harness.result.createSession();
    });

    const leavePromise = harness.result.leaveSession();
    act(() => {
      harness.client.handlers?.sessionEnded?.({
        sessionId: 'session_test',
        reason: 'Session wurde vom Host beendet.',
      });
    });
    await waitFor(() => expect(harness.result.status).toBe('ended'));

    await act(async () => {
      resolveLeave?.();
      await leavePromise;
    });

    expect(harness.result.status).toBe('ended');
    expect(harness.result.message).toBe('Session wurde vom Host beendet.');
  });

  it('throttles circuit and cursor updates while keeping immediate sends available', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-28T10:00:00.000Z'));

    try {
      const harness = renderHarness();
      const firstState = {
        ...collaborationState(),
        inputSignals: { switch_1: true },
      };
      const secondState = {
        ...collaborationState(),
        inputSignals: { switch_1: false },
      };

      harness.result.broadcastCircuit(firstState, true);
      harness.result.sendCursor({ x: 1, y: 2 });
      expect(harness.client.updateCircuit).not.toHaveBeenCalled();
      expect(harness.client.updateCursor).not.toHaveBeenCalled();

      await act(async () => {
        await harness.result.createSession();
      });

      act(() => {
        harness.result.broadcastCircuit(firstState, true);
        harness.result.sendCursor({ x: 10, y: 20 });
      });

      expect(harness.client.updateCircuit).toHaveBeenCalledTimes(1);
      expect(harness.client.updateCircuit).toHaveBeenLastCalledWith('session_test', firstState);
      expect(harness.client.updateCursor).toHaveBeenCalledTimes(1);
      expect(harness.client.updateCursor).toHaveBeenLastCalledWith('session_test', { x: 10, y: 20 });

      act(() => {
        harness.result.broadcastCircuit(secondState);
        harness.result.sendCursor({ x: 30, y: 40 });
      });

      expect(harness.client.updateCircuit).toHaveBeenCalledTimes(1);
      expect(harness.client.updateCursor).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(120);
      });

      expect(harness.client.updateCircuit).toHaveBeenCalledTimes(2);
      expect(harness.client.updateCircuit).toHaveBeenLastCalledWith('session_test', secondState);
      expect(harness.client.updateCursor).toHaveBeenCalledTimes(2);
      expect(harness.client.updateCursor).toHaveBeenLastCalledWith('session_test', { x: 30, y: 40 });

      harness.unmount();
      act(() => {
        vi.runOnlyPendingTimers();
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
