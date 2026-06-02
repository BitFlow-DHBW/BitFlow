import type { HubConnection } from '@microsoft/signalr';
import { HubConnectionState, LogLevel } from '@microsoft/signalr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCircuit } from '../test/builders';
import type { CollaborationSession } from '../types/collaboration';
import { CollaborationClient, createCollaborationClient } from './collaborationService';

const signalRMock = vi.hoisted(() => {
  const build = vi.fn();
  const withUrl = vi.fn();
  const withAutomaticReconnect = vi.fn();
  const configureLogging = vi.fn();

  class MockHubConnectionBuilder {
    withUrl(...args: unknown[]) {
      withUrl(...args);
      return this;
    }

    withAutomaticReconnect(...args: unknown[]) {
      withAutomaticReconnect(...args);
      return this;
    }

    configureLogging(...args: unknown[]) {
      configureLogging(...args);
      return this;
    }

    build() {
      return build();
    }
  }

  return {
    MockHubConnectionBuilder,
    build,
    withUrl,
    withAutomaticReconnect,
    configureLogging,
  };
});

const sessionStoreMock = vi.hoisted(() => ({
  readSessionToken: vi.fn(() => 'token_test'),
}));

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: signalRMock.MockHubConnectionBuilder,
  HubConnectionState: {
    Connected: 'Connected',
    Connecting: 'Connecting',
    Disconnected: 'Disconnected',
  },
  LogLevel: {
    Warning: 'Warning',
  },
}));

vi.mock('./sessionStore', () => ({
  readSessionToken: sessionStoreMock.readSessionToken,
}));

type Handler = (...args: unknown[]) => void;

interface FakeConnection {
  state: HubConnectionState;
  handlers: Map<string, Handler>;
  off: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  invoke: ReturnType<typeof vi.fn>;
}

function makeConnection(initialState = HubConnectionState.Disconnected): FakeConnection {
  const handlers = new Map<string, Handler>();
  const connection = {
    state: initialState,
    handlers,
    off: vi.fn((eventName: string) => {
      handlers.delete(eventName);
    }),
    on: vi.fn((eventName: string, handler: Handler) => {
      handlers.set(eventName, handler);
    }),
    start: vi.fn(async () => {
      connection.state = HubConnectionState.Connected;
    }),
    stop: vi.fn(async () => {
      connection.state = HubConnectionState.Disconnected;
    }),
    invoke: vi.fn(),
  };

  return connection;
}

function makeClient(connection = makeConnection()) {
  return new CollaborationClient(connection as unknown as HubConnection);
}

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
    participants: [],
    createdAt: '2026-05-28T10:00:00.000Z',
    isActive: true,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('CollaborationClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers SignalR handlers after clearing stale handlers', () => {
    const connection = makeConnection();
    const client = makeClient(connection);
    const sessionCreated = vi.fn();
    const participantLeft = vi.fn();

    client.registerHandlers({ sessionCreated, participantLeft });

    expect(connection.off).toHaveBeenCalledWith('SessionCreated');
    expect(connection.off).toHaveBeenCalledWith('SessionJoined');
    expect(connection.off).toHaveBeenCalledWith('ParticipantJoined');
    expect(connection.off).toHaveBeenCalledWith('ParticipantLeft');
    expect(connection.off).toHaveBeenCalledWith('CursorUpdated');
    expect(connection.off).toHaveBeenCalledWith('CircuitUpdated');
    expect(connection.off).toHaveBeenCalledWith('SessionEnded');
    expect(connection.on).toHaveBeenCalledWith('SessionCreated', sessionCreated);
    expect(connection.on).toHaveBeenCalledWith('ParticipantLeft', participantLeft);

    connection.handlers.get('SessionCreated')?.(makeSession());
    connection.handlers.get('ParticipantLeft')?.('participant_guest');

    expect(sessionCreated).toHaveBeenCalledWith(makeSession());
    expect(participantLeft).toHaveBeenCalledWith('participant_guest');

    client.registerHandlers({});

    expect(connection.handlers.size).toBe(0);
  });

  it('starts once while a negotiation is already in progress', async () => {
    const connection = makeConnection();
    const start = deferred<void>();
    connection.start.mockReturnValue(start.promise);
    const client = makeClient(connection);

    const firstStart = client.start();
    const secondStart = client.start();

    expect(connection.start).toHaveBeenCalledTimes(1);

    connection.state = HubConnectionState.Connected;
    start.resolve();
    await Promise.all([firstStart, secondStart]);

    await client.start();

    expect(connection.start).toHaveBeenCalledTimes(1);
  });

  it('does not stop an already disconnected connection', async () => {
    const connection = makeConnection(HubConnectionState.Disconnected);
    const client = makeClient(connection);

    await client.stop();

    expect(connection.stop).not.toHaveBeenCalled();
  });

  it('waits for a pending start before stopping', async () => {
    const connection = makeConnection();
    const start = deferred<void>();
    connection.start.mockReturnValue(start.promise);
    const client = makeClient(connection);

    const startCall = client.start();
    const stopCall = client.stop();

    connection.state = HubConnectionState.Connected;
    start.resolve();
    await Promise.all([startCall, stopCall]);

    expect(connection.stop).toHaveBeenCalledTimes(1);
    expect(connection.state).toBe(HubConnectionState.Disconnected);
  });

  it('skips stop when negotiation failed', async () => {
    const connection = makeConnection();
    const start = deferred<void>();
    connection.start.mockReturnValue(start.promise);
    const client = makeClient(connection);

    const startCall = client.start().catch(() => undefined);
    const stopCall = client.stop();

    start.reject(new Error('negotiation failed'));
    await Promise.all([startCall, stopCall]);

    expect(connection.stop).not.toHaveBeenCalled();
  });

  it('invokes collaboration hub methods with the expected payloads', async () => {
    const connection = makeConnection(HubConnectionState.Connected);
    const client = makeClient(connection);
    const session = makeSession();
    connection.invoke.mockResolvedValue(session);

    await expect(client.createSession(session.currentCircuit, 'Host')).resolves.toBe(session);
    await expect(client.joinSession('session_test', 'Guest')).resolves.toBe(session);
    await client.leaveSession('session_test');
    await client.endSession('session_test');
    await client.updateCircuit('session_test', session.currentCircuit);
    await client.updateCursor('session_test', { x: 10, y: 20 });

    expect(connection.invoke).toHaveBeenNthCalledWith(1, 'CreateSession', session.currentCircuit, 'Host');
    expect(connection.invoke).toHaveBeenNthCalledWith(2, 'JoinSession', 'session_test', 'Guest');
    expect(connection.invoke).toHaveBeenNthCalledWith(3, 'LeaveSession', 'session_test');
    expect(connection.invoke).toHaveBeenNthCalledWith(4, 'EndSession', 'session_test');
    expect(connection.invoke).toHaveBeenNthCalledWith(5, 'UpdateCircuit', 'session_test', session.currentCircuit);
    expect(connection.invoke).toHaveBeenNthCalledWith(6, 'UpdateCursor', 'session_test', { x: 10, y: 20 });
  });

  it('builds a SignalR client with the collaboration hub URL and auth token', () => {
    const connection = makeConnection();
    signalRMock.build.mockReturnValue(connection);

    const client = createCollaborationClient();

    expect(client.state).toBe(HubConnectionState.Disconnected);
    expect(signalRMock.withUrl).toHaveBeenCalledWith('/hubs/collaboration', {
      accessTokenFactory: expect.any(Function),
    });
    const options = signalRMock.withUrl.mock.calls[0][1] as { accessTokenFactory: () => string };
    expect(options.accessTokenFactory()).toBe('token_test');
    expect(sessionStoreMock.readSessionToken).toHaveBeenCalled();
    expect(signalRMock.withAutomaticReconnect).toHaveBeenCalled();
    expect(signalRMock.configureLogging).toHaveBeenCalledWith(LogLevel.Warning);
    expect(signalRMock.build).toHaveBeenCalled();
  });
});
