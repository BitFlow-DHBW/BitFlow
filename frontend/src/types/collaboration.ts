import type { Circuit, CustomComponent, Point, SignalState } from './circuit';

export interface CollaborationCircuitState {
  circuit: Circuit;
  inputSignals: SignalState;
  customComponents: CustomComponent[];
}

export interface CollaborationParticipant {
  participantId: string;
  userId?: string | null;
  displayName: string;
  connectionId?: string | null;
  cursorPosition?: Point | null;
  isHost: boolean;
}

export interface CollaborationSession {
  sessionId: string;
  hostUserId: string;
  hostParticipantId: string;
  hostConnectionId?: string | null;
  currentCircuit: CollaborationCircuitState;
  participants: CollaborationParticipant[];
  createdAt: string;
  isActive: boolean;
}

export interface CircuitUpdatedEvent {
  sessionId: string;
  sourceParticipantId: string;
  currentCircuit: CollaborationCircuitState;
  updatedAt: string;
}

export interface SessionEndedEvent {
  sessionId: string;
  reason: string;
}

export interface RemoteCursor {
  participantId: string;
  displayName: string;
  position: Point;
}

export type CollaborationRole = 'host' | 'participant';

