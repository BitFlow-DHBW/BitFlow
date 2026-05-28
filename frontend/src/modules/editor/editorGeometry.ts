import { gateRectPx, snapToGrid } from '../../simulation/gateLibrary';
import type { Annotation, AnnotationDragState, DragState, Gate, Point } from '../../types/circuit';

export function positionGateAtPoint(gateDraft: Gate, point: Point): Gate {
  const rect = gateRectPx(gateDraft);

  return {
    ...gateDraft,
    x: snapToGrid(point.x - rect.width / 2),
    y: snapToGrid(point.y - rect.height / 2),
  };
}

export function positionGateFromDrag(gate: Gate, dragState: DragState, point: Point): Gate {
  return {
    ...gate,
    x: snapToGrid(point.x - dragState.offsetX),
    y: snapToGrid(point.y - dragState.offsetY),
  };
}

export function positionAnnotationFromDrag(
  annotation: Annotation,
  dragState: AnnotationDragState,
  point: Point,
): Annotation {
  return {
    ...annotation,
    x: snapToGrid(point.x - dragState.offsetX),
    y: snapToGrid(point.y - dragState.offsetY),
  };
}
