import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { readSessionToken } from './sessionStore';
import type { Point } from '../types/circuit';
import type {
  CircuitUpdatedEvent,
  CollaborationCircuitState,
  CollaborationParticipant,
  CollaborationSession,
  SessionEndedEvent,
} from '../types/collaboration';

export interface CollaborationEventHandlers {
  sessionCreated?: (session: CollaborationSession) => void;
  sessionJoined?: (session: CollaborationSession) => void;
  participantJoined?: (participant: CollaborationParticipant) => void;
  participantLeft?: (participantId: string) => void;
  cursorUpdated?: (participant: CollaborationParticipant) => void;
  circuitUpdated?: (event: CircuitUpdatedEvent) => void;
  sessionEnded?: (event: SessionEndedEvent) => void;
}

export class CollaborationClient {
  private readonly connection: HubConnection;
  private startPromise: Promise<void> | null = null;

  constructor(connection = createConnection()) {
    this.connection = connection;
  }

  get state(): HubConnectionState {
    return this.connection.state;
  }

  registerHandlers(handlers: CollaborationEventHandlers): void {
    this.connection.off('SessionCreated');
    this.connection.off('SessionJoined');
    this.connection.off('ParticipantJoined');
    this.connection.off('ParticipantLeft');
    this.connection.off('CursorUpdated');
    this.connection.off('CircuitUpdated');
    this.connection.off('SessionEnded');

    if (handlers.sessionCreated) this.connection.on('SessionCreated', handlers.sessionCreated);
    if (handlers.sessionJoined) this.connection.on('SessionJoined', handlers.sessionJoined);
    if (handlers.participantJoined) this.connection.on('ParticipantJoined', handlers.participantJoined);
    if (handlers.participantLeft) this.connection.on('ParticipantLeft', handlers.participantLeft);
    if (handlers.cursorUpdated) this.connection.on('CursorUpdated', handlers.cursorUpdated);
    if (handlers.circuitUpdated) this.connection.on('CircuitUpdated', handlers.circuitUpdated);
    if (handlers.sessionEnded) this.connection.on('SessionEnded', handlers.sessionEnded);
  }

  async start(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) {
      return;
    }

    if (this.startPromise) {
      await this.startPromise;
      return;
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.startPromise = this.connection.start().finally(() => {
        this.startPromise = null;
      });
      await this.startPromise;
    }
  }

  async stop(): Promise<void> {
    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        return;
      }
    }

    if (this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
  }

  createSession(currentCircuit: CollaborationCircuitState, displayName: string): Promise<CollaborationSession> {
    return this.connection.invoke<CollaborationSession>('CreateSession', currentCircuit, displayName);
  }

  joinSession(sessionId: string, displayName: string): Promise<CollaborationSession> {
    return this.connection.invoke<CollaborationSession>('JoinSession', sessionId, displayName);
  }

  leaveSession(sessionId: string): Promise<void> {
    return this.connection.invoke('LeaveSession', sessionId);
  }

  updateCircuit(sessionId: string, currentCircuit: CollaborationCircuitState): Promise<void> {
    return this.connection.invoke('UpdateCircuit', sessionId, currentCircuit);
  }

  updateCursor(sessionId: string, position: Point): Promise<void> {
    return this.connection.invoke('UpdateCursor', sessionId, position);
  }
}

function createConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl('/hubs/collaboration', {
      accessTokenFactory: () => readSessionToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export function createCollaborationClient(): CollaborationClient {
  return new CollaborationClient();
}
