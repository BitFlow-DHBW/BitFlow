import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CollaborationClient,
  createCollaborationClient,
  type CollaborationEventHandlers,
} from '../services/collaborationService';
import { collaborationRole, remoteCursors } from '../modules/editor/collaborationState';
import type { Point } from '../types/circuit';
import type {
  CollaborationCircuitState,
  CollaborationParticipant,
  CollaborationRole,
  CollaborationSession,
  RemoteCursor,
  SessionEndedEvent,
} from '../types/collaboration';

const CURSOR_THROTTLE_MS = 80;
const CIRCUIT_THROTTLE_MS = 120;

interface UseCollaborationSessionOptions {
  autoJoinSessionId: string | null;
  displayName: string;
  getCurrentState: () => CollaborationCircuitState;
  onRemoteState: (state: CollaborationCircuitState) => void;
  clientFactory?: () => CollaborationClient;
}

interface ThrottleState<T> {
  lastSentAt: number;
  timeoutId: number | null;
  queuedValue: T | null;
}

export function useCollaborationSession({
  autoJoinSessionId,
  displayName,
  getCurrentState,
  onRemoteState,
  clientFactory = createCollaborationClient,
}: UseCollaborationSessionOptions) {
  const clientRef = useRef<CollaborationClient | null>(null);
  const getCurrentStateRef = useRef(getCurrentState);
  const onRemoteStateRef = useRef(onRemoteState);
  const sessionRef = useRef<CollaborationSession | null>(null);
  const localParticipantIdRef = useRef<string | null>(null);
  const autoJoinStartedRef = useRef(false);
  const stopTimeoutRef = useRef<number | null>(null);
  const cursorThrottleRef = useRef<ThrottleState<Point>>({ lastSentAt: 0, timeoutId: null, queuedValue: null });
  const circuitThrottleRef = useRef<ThrottleState<CollaborationCircuitState>>({
    lastSentAt: 0,
    timeoutId: null,
    queuedValue: null,
  });

  const [session, setSessionState] = useState<CollaborationSession | null>(null);
  const [localParticipantId, setLocalParticipantIdState] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const setSession = useCallback((nextSession: CollaborationSession | null) => {
    sessionRef.current = nextSession;
    setSessionState(nextSession);
  }, []);

  const cancelScheduledStop = useCallback(() => {
    if (stopTimeoutRef.current === null) return;
    window.clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = null;
  }, []);

  const setLocalParticipantId = useCallback((participantId: string | null) => {
    localParticipantIdRef.current = participantId;
    setLocalParticipantIdState(participantId);
  }, []);

  useEffect(() => {
    getCurrentStateRef.current = getCurrentState;
  }, [getCurrentState]);

  useEffect(() => {
    onRemoteStateRef.current = onRemoteState;
  }, [onRemoteState]);

  const updateParticipants = useCallback(
    (updater: (participants: CollaborationParticipant[]) => CollaborationParticipant[]) => {
      setSessionState((current) => {
        if (!current) return current;
        const nextSession = {
          ...current,
          participants: updater(current.participants),
        };
        sessionRef.current = nextSession;
        return nextSession;
      });
    },
    [],
  );

  const applySessionSnapshot = useCallback(
    (nextSession: CollaborationSession, localParticipantIdFromSnapshot: string | null) => {
      setSession(nextSession);
      setLocalParticipantId(localParticipantIdFromSnapshot);
      setStatus('active');
      setMessage(null);
    },
    [setLocalParticipantId, setSession],
  );

  const handleSessionCreated = useCallback(
    (nextSession: CollaborationSession) => {
      const hostParticipant = nextSession.participants.find((participant) => participant.isHost) ?? null;
      applySessionSnapshot(nextSession, hostParticipant?.participantId ?? null);
    },
    [applySessionSnapshot],
  );

  const handleSessionJoined = useCallback(
    (nextSession: CollaborationSession) => {
      const localParticipant = nextSession.participants.at(-1) ?? null;
      applySessionSnapshot(nextSession, localParticipant?.participantId ?? null);
    },
    [applySessionSnapshot],
  );

  const endLocalSession = useCallback(
    (event: SessionEndedEvent) => {
      clearThrottle(cursorThrottleRef.current);
      clearThrottle(circuitThrottleRef.current);
      setSession(null);
      setLocalParticipantId(null);
      setStatus('ended');
      setMessage(event.reason || 'Session wurde vom Host beendet.');
    },
    [setLocalParticipantId, setSession],
  );

  const ensureClient = useCallback(async () => {
    if (!clientRef.current) {
      const client = clientFactory();
      const handlers: CollaborationEventHandlers = {
        sessionCreated: handleSessionCreated,
        sessionJoined: handleSessionJoined,
        participantJoined: (participant) => {
          updateParticipants((participants) => upsertParticipant(participants, participant));
        },
        participantLeft: (participantId) => {
          updateParticipants((participants) => participants.filter((participant) => participant.participantId !== participantId));
        },
        cursorUpdated: (participant) => {
          updateParticipants((participants) => upsertParticipant(participants, participant));
        },
        circuitUpdated: (event) => {
          onRemoteStateRef.current(event.currentCircuit);
        },
        sessionEnded: (event) => {
          endLocalSession(event);
        },
      };

      client.registerHandlers(handlers);
      clientRef.current = client;
    }

    setStatus((current) => (current === 'active' ? current : 'connecting'));
    cancelScheduledStop();
    await clientRef.current.start();
  }, [cancelScheduledStop, clientFactory, endLocalSession, handleSessionCreated, handleSessionJoined, updateParticipants]);

  const createSession = useCallback(async () => {
    try {
      await ensureClient();
      const nextSession = await clientRef.current!.createSession(getCurrentStateRef.current(), displayName);
      handleSessionCreated(nextSession);
      return nextSession;
    } catch (error) {
      autoJoinStartedRef.current = false;
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Session konnte nicht erstellt werden.');
      return null;
    }
  }, [displayName, ensureClient, handleSessionCreated]);

  const joinSession = useCallback(
    async (sessionId: string) => {
      try {
        await ensureClient();
        const nextSession = await clientRef.current!.joinSession(sessionId, displayName);
        handleSessionJoined(nextSession);
        onRemoteStateRef.current(nextSession.currentCircuit);
        return nextSession;
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Session konnte nicht betreten werden.');
        return null;
      }
    },
    [displayName, ensureClient, handleSessionJoined],
  );

  const leaveSession = useCallback(async () => {
    const activeSession = sessionRef.current;
    if (!activeSession) return;

    try {
      await clientRef.current?.leaveSession(activeSession.sessionId);
    } finally {
      clearThrottle(cursorThrottleRef.current);
      clearThrottle(circuitThrottleRef.current);
      if (sessionRef.current?.sessionId === activeSession.sessionId) {
        setSession(null);
        setLocalParticipantId(null);
        setStatus('idle');
        setMessage('Session verlassen.');
      }
    }
  }, [setLocalParticipantId, setSession]);

  const broadcastCircuit = useCallback((state: CollaborationCircuitState, immediate = false) => {
    const activeSession = sessionRef.current;
    const client = clientRef.current;
    if (!activeSession || !client) return;

    sendThrottled(circuitThrottleRef.current, state, immediate ? 0 : CIRCUIT_THROTTLE_MS, (nextState) => {
      void client.updateCircuit(activeSession.sessionId, nextState);
    });
  }, []);

  const sendCursor = useCallback((position: Point) => {
    const activeSession = sessionRef.current;
    const client = clientRef.current;
    if (!activeSession || !client) return;

    sendThrottled(cursorThrottleRef.current, position, CURSOR_THROTTLE_MS, (nextPosition) => {
      void client.updateCursor(activeSession.sessionId, nextPosition);
    });
  }, []);

  useEffect(() => {
    if (!autoJoinSessionId || autoJoinStartedRef.current) return;
    autoJoinStartedRef.current = true;
    void joinSession(autoJoinSessionId);
  }, [autoJoinSessionId, joinSession]);

  useEffect(() => {
    cancelScheduledStop();
    const cursorThrottle = cursorThrottleRef.current;
    const circuitThrottle = circuitThrottleRef.current;
    return () => {
      clearThrottle(cursorThrottle);
      clearThrottle(circuitThrottle);
      stopTimeoutRef.current = window.setTimeout(() => {
        void clientRef.current?.stop();
        stopTimeoutRef.current = null;
      }, 250);
    };
  }, [cancelScheduledStop]);

  const role = useMemo<CollaborationRole | null>(
    () => collaborationRole(session?.participants ?? [], localParticipantId),
    [localParticipantId, session?.participants],
  );

  const cursors = useMemo<RemoteCursor[]>(
    () => remoteCursors(session?.participants ?? [], localParticipantId),
    [localParticipantId, session?.participants],
  );

  return {
    session,
    role,
    localParticipantId,
    remoteCursors: cursors,
    status,
    message,
    createSession,
    joinSession,
    leaveSession,
    broadcastCircuit,
    sendCursor,
  };
}

function upsertParticipant(
  participants: CollaborationParticipant[],
  participant: CollaborationParticipant,
): CollaborationParticipant[] {
  const index = participants.findIndex((entry) => entry.participantId === participant.participantId);
  if (index === -1) return [...participants, participant];

  return participants.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...participant } : entry));
}

function sendThrottled<T>(
  throttle: ThrottleState<T>,
  value: T,
  throttleMs: number,
  send: (value: T) => void,
) {
  const now = Date.now();
  const elapsed = now - throttle.lastSentAt;

  if (elapsed >= throttleMs) {
    clearThrottle(throttle);
    throttle.lastSentAt = now;
    send(value);
    return;
  }

  throttle.queuedValue = value;
  if (throttle.timeoutId !== null) return;

  throttle.timeoutId = window.setTimeout(() => {
    throttle.timeoutId = null;
    throttle.lastSentAt = Date.now();
    if (throttle.queuedValue) {
      send(throttle.queuedValue);
      throttle.queuedValue = null;
    }
  }, throttleMs - elapsed);
}

function clearThrottle<T>(throttle: ThrottleState<T>) {
  if (throttle.timeoutId !== null) {
    window.clearTimeout(throttle.timeoutId);
  }

  throttle.timeoutId = null;
  throttle.queuedValue = null;
}
