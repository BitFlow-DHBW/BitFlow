import { describe, expect, it } from 'vitest';
import { circuitWith, gate } from '../../test/builders';
import { mergeRemoteCircuitWithLocalInteraction } from './collaborationMerge';

describe('mergeRemoteCircuitWithLocalInteraction', () => {
  it('keeps the locally dragged gate position when a remote state arrives', () => {
    const localGate = gate('AND', 'and_shared', -72, 48);
    const remoteGate = gate('AND', 'and_shared', 240, 96);

    const merged = mergeRemoteCircuitWithLocalInteraction(
      circuitWith([remoteGate]),
      circuitWith([localGate]),
      { kind: 'gate', gateId: localGate.id, offsetX: 12, offsetY: 12 },
    );

    expect(merged.gates).toContainEqual(localGate);
  });

  it('keeps the locally dragged annotation when a remote state arrives', () => {
    const localAnnotation = { id: 'annotation_shared', text: 'Lokal', x: -48, y: 24 };
    const remoteAnnotation = { id: 'annotation_shared', text: 'Remote', x: 120, y: 96 };

    const merged = mergeRemoteCircuitWithLocalInteraction(
      circuitWith([], [], { annotations: [remoteAnnotation] }),
      circuitWith([], [], { annotations: [localAnnotation] }),
      { kind: 'annotation', annotationId: localAnnotation.id, offsetX: 4, offsetY: 6 },
    );

    expect(merged.annotations).toContainEqual(localAnnotation);
  });

  it('uses the remote circuit unchanged without a local drag interaction', () => {
    const remoteCircuit = circuitWith([gate('OR', 'or_remote')]);

    expect(mergeRemoteCircuitWithLocalInteraction(remoteCircuit, circuitWith([]), null)).toBe(remoteCircuit);
  });
});
