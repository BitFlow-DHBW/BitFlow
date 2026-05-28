import type { Circuit, CustomComponent, SignalState } from '../../types/circuit';
import type {
  CollaborationCircuitState,
  CollaborationParticipant,
  CollaborationRole,
  RemoteCursor,
} from '../../types/collaboration';

export function createCollaborationCircuitState(
  circuit: Circuit,
  inputSignals: SignalState,
  customComponents: CustomComponent[],
): CollaborationCircuitState {
  return {
    circuit: {
      ...circuit,
      customComponents,
    },
    inputSignals,
    customComponents,
  };
}

export function collaborationRole(
  participants: CollaborationParticipant[],
  localParticipantId: string | null,
): CollaborationRole | null {
  const localParticipant = participants.find((participant) => participant.participantId === localParticipantId);
  if (!localParticipant) return null;
  return localParticipant.isHost ? 'host' : 'participant';
}

export function canSaveProject(role: CollaborationRole | null, isSessionOnlyProject: boolean): boolean {
  if (isSessionOnlyProject) return false;
  return role === null || role === 'host';
}

export function remoteCursors(
  participants: CollaborationParticipant[],
  localParticipantId: string | null,
): RemoteCursor[] {
  return participants
    .filter((participant) => participant.participantId !== localParticipantId && participant.cursorPosition)
    .map((participant) => ({
      participantId: participant.participantId,
      displayName: participant.displayName,
      position: participant.cursorPosition!,
    }));
}

