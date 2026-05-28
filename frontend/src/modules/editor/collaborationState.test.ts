import { describe, expect, it } from 'vitest';
import { createStarterCircuit } from '../../simulation/gateLibrary';
import type { CollaborationParticipant } from '../../types/collaboration';
import { canSaveProject, collaborationRole, createCollaborationCircuitState, remoteCursors } from './collaborationState';

const participants: CollaborationParticipant[] = [
  {
    participantId: 'host',
    userId: 'user_host',
    displayName: 'Host',
    connectionId: 'connection_host',
    cursorPosition: { x: 24, y: 48 },
    isHost: true,
  },
  {
    participantId: 'guest',
    userId: 'user_guest',
    displayName: 'Guest',
    connectionId: 'connection_guest',
    cursorPosition: { x: 144, y: 96 },
    isHost: false,
  },
];

describe('collaborationState', () => {
  it('wraps circuit, signals and custom components into a collaboration payload', () => {
    const circuit = createStarterCircuit('Shared');
    const state = createCollaborationCircuitState(circuit, { input_a: true }, []);

    expect(state.circuit.id).toBe(circuit.id);
    expect(state.inputSignals.input_a).toBe(true);
    expect(state.customComponents).toEqual([]);
  });

  it('derives roles and save permissions', () => {
    expect(collaborationRole(participants, 'host')).toBe('host');
    expect(collaborationRole(participants, 'guest')).toBe('participant');
    expect(canSaveProject('host', false)).toBe(true);
    expect(canSaveProject('participant', false)).toBe(false);
    expect(canSaveProject(null, false)).toBe(true);
    expect(canSaveProject('host', true)).toBe(false);
  });

  it('maps remote cursor state without the local participant', () => {
    expect(remoteCursors(participants, 'host')).toEqual([
      {
        participantId: 'guest',
        displayName: 'Guest',
        position: { x: 144, y: 96 },
      },
    ]);
  });
});

