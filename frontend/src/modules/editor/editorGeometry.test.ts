import { describe, expect, it } from 'vitest';
import { createGate } from '../../simulation/gateLibrary';
import { positionAnnotationFromDrag, positionGateAtPoint, positionGateFromDrag } from './editorGeometry';

describe('editorGeometry', () => {
  it('places gates outside the initial positive canvas area', () => {
    const gate = createGate('AND', 0, 0, 'and_negative');

    const positioned = positionGateAtPoint(gate, { x: -48, y: -24 });

    expect(positioned.x).toBeLessThan(0);
    expect(positioned.y).toBeLessThan(0);
  });

  it('keeps drag movement unrestricted in every direction', () => {
    const gate = createGate('OR', 120, 96, 'or_drag');

    const positioned = positionGateFromDrag(gate, { gateId: gate.id, offsetX: 36, offsetY: 30 }, { x: -18, y: -42 });

    expect(positioned.x).toBe(-48);
    expect(positioned.y).toBe(-72);
  });

  it('keeps annotation movement unrestricted and snapped to the grid', () => {
    const positioned = positionAnnotationFromDrag(
      { id: 'annotation_test', text: 'Kommentar', x: 48, y: 48 },
      { annotationId: 'annotation_test', offsetX: 8, offsetY: 10 },
      { x: -11, y: 61 },
    );

    expect(positioned.x).toBe(-24);
    expect(positioned.y).toBe(48);
  });
});
