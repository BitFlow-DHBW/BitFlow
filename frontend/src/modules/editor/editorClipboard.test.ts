import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createAnnotationClipboardItem,
  createGateClipboardItem,
  createPastedClipboardItem,
  createWireClipboardItem,
} from './editorClipboard';
import { gate } from '../../test/builders';

describe('editorClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates pasted gates with new ids, new pins and an offset position', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-4000-8000-000000000001');
    const sourceGate = gate('AND', 'gate_source', 48, 72);
    const pasted = createPastedClipboardItem(createGateClipboardItem(sourceGate));

    expect(pasted?.kind).toBe('gate');
    if (pasted?.kind !== 'gate') return;
    expect(pasted.gate.id).toBe('gate_00000000-0000-4000-8000-000000000001');
    expect(pasted.gate.x).toBe(72);
    expect(pasted.gate.y).toBe(96);
    expect(pasted.gate.inputs[0].gateId).toBe(pasted.gate.id);
    expect(pasted.gate.inputs[0].id).not.toBe(sourceGate.inputs[0].id);
  });

  it('creates pasted annotations with new ids and an offset position', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-4000-8000-000000000002');
    const pasted = createPastedClipboardItem(
      createAnnotationClipboardItem({ id: 'annotation_source', text: 'Kommentar', x: 24, y: 48 }),
    );

    expect(pasted).toEqual({
      kind: 'annotation',
      annotation: {
        id: 'annotation_00000000-0000-4000-8000-000000000002',
        text: 'Kommentar',
        x: 48,
        y: 72,
      },
    });
  });

  it('pastes wires as independent point-to-point wires', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-4000-8000-000000000003');
    const pasted = createPastedClipboardItem(
      createWireClipboardItem({
        id: 'wire_source',
        from: { kind: 'point', point: { x: 0, y: 24 } },
        to: { kind: 'point', point: { x: 48, y: 24 } },
        sourcePinId: 'pin_a',
        targetPinId: 'pin_b',
        points: [
          { x: 0, y: 24 },
          { x: 48, y: 24 },
        ],
      }),
    );

    expect(pasted?.kind).toBe('wire');
    if (pasted?.kind !== 'wire') return;
    expect(pasted.wire.id).toBe('wire_00000000-0000-4000-8000-000000000003');
    expect(pasted.wire.sourcePinId).toBeUndefined();
    expect(pasted.wire.targetPinId).toBeUndefined();
    expect(pasted.wire.from).toEqual({ kind: 'point', point: { x: 24, y: 48 } });
    expect(pasted.wire.to).toEqual({ kind: 'point', point: { x: 72, y: 48 } });
  });
});
