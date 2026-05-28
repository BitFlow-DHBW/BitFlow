import { GRID_SIZE, snapToGrid } from '../../simulation/gateLibrary';
import type { Annotation, Gate, Pin, Point, TruthTableRow, Wire, WireEndpoint } from '../../types/circuit';
import { createId } from '../../utils/id';

export type EditorClipboardItem =
  | {
      kind: 'gate';
      gate: Gate;
    }
  | {
      kind: 'annotation';
      annotation: Annotation;
    }
  | {
      kind: 'wire';
      wire: Wire;
    };

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function offsetPoint(point: Point): Point {
  return {
    x: snapToGrid(point.x + GRID_SIZE),
    y: snapToGrid(point.y + GRID_SIZE),
  };
}

function cloneEndpoint(endpoint: WireEndpoint | undefined): WireEndpoint | undefined {
  if (!endpoint) return undefined;
  if (endpoint.kind === 'pin') return { ...endpoint };
  if (endpoint.kind === 'wire') return { ...endpoint, point: clonePoint(endpoint.point) };
  return { ...endpoint, point: clonePoint(endpoint.point) };
}

function offsetPointEndpoint(endpoint: WireEndpoint | undefined): WireEndpoint | undefined {
  if (!endpoint) return undefined;
  const point = endpoint.kind === 'point' || endpoint.kind === 'wire' ? endpoint.point : undefined;
  return point ? { kind: 'point', point: offsetPoint(point) } : undefined;
}

function cloneTruthTable(rows: TruthTableRow[] | undefined): TruthTableRow[] | undefined {
  return rows?.map((row) => ({
    inputs: [...row.inputs],
    outputs: [...row.outputs],
  }));
}

function clonePin(pin: Pin): Pin {
  return { ...pin };
}

function cloneGate(gate: Gate): Gate {
  return {
    ...gate,
    inputs: gate.inputs.map(clonePin),
    outputs: gate.outputs.map(clonePin),
    truthTable: cloneTruthTable(gate.truthTable),
  };
}

function cloneAnnotation(annotation: Annotation): Annotation {
  return { ...annotation };
}

function cloneWire(wire: Wire): Wire {
  return {
    ...wire,
    from: cloneEndpoint(wire.from),
    to: cloneEndpoint(wire.to),
    points: wire.points.map(clonePoint),
  };
}

function assignGatePinsToGate(gate: Gate, gateId: string): Gate {
  return {
    ...gate,
    id: gateId,
    inputs: gate.inputs.map((pin) => ({
      ...pin,
      id: `${gateId}:input:${pin.index}`,
      gateId,
    })),
    outputs: gate.outputs.map((pin) => ({
      ...pin,
      id: `${gateId}:output:${pin.index}`,
      gateId,
    })),
  };
}

export function createGateClipboardItem(gate: Gate): EditorClipboardItem {
  return { kind: 'gate', gate: cloneGate(gate) };
}

export function createAnnotationClipboardItem(annotation: Annotation): EditorClipboardItem {
  return { kind: 'annotation', annotation: cloneAnnotation(annotation) };
}

export function createWireClipboardItem(wire: Wire): EditorClipboardItem {
  return { kind: 'wire', wire: cloneWire(wire) };
}

export function createPastedClipboardItem(item: EditorClipboardItem): EditorClipboardItem | null {
  if (item.kind === 'gate') {
    const pastedGate = assignGatePinsToGate(cloneGate(item.gate), createId('gate'));
    const position = offsetPoint(pastedGate);
    return {
      kind: 'gate',
      gate: {
        ...pastedGate,
        x: position.x,
        y: position.y,
      },
    };
  }

  if (item.kind === 'annotation') {
    const position = offsetPoint(item.annotation);
    return {
      kind: 'annotation',
      annotation: {
        ...item.annotation,
        id: createId('annotation'),
        x: position.x,
        y: position.y,
      },
    };
  }

  const from = offsetPointEndpoint(item.wire.from);
  const to = offsetPointEndpoint(item.wire.to);
  if (!from || !to) return null;

  return {
    kind: 'wire',
    wire: {
      ...item.wire,
      id: createId('wire'),
      from,
      to,
      sourcePinId: undefined,
      targetPinId: undefined,
      points: item.wire.points.map(offsetPoint),
    },
  };
}
