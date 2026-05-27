import { pinPosition } from './gateLibrary';
import type { Circuit, Gate, Pin, Point, SignalState, Wire, WireEndpoint } from '../types/circuit';

export type PinLookup = Map<string, { gate: Gate; pin: Pin; point: Point }>;

export interface EndpointGroups {
  find(id: string): string;
  union(a: string, b: string): void;
}

class DisjointSet implements EndpointGroups {
  private readonly parent = new Map<string, string>();

  find(id: string): string {
    if (!this.parent.has(id)) this.parent.set(id, id);
    const parent = this.parent.get(id);
    if (!parent || parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}

export function createPinLookup(circuit: Circuit): PinLookup {
  const map: PinLookup = new Map();

  for (const gate of circuit.gates) {
    for (const pin of [...gate.inputs, ...gate.outputs]) {
      map.set(pin.id, { gate, pin, point: pinPosition(gate, pin) });
    }
  }

  return map;
}

export function normalizeWireEndpoint(wire: Wire, side: 'from' | 'to'): WireEndpoint | null {
  const endpoint = side === 'from' ? wire.from : wire.to;
  if (endpoint) return endpoint;

  const legacyPinId = side === 'from' ? wire.sourcePinId : wire.targetPinId;
  return legacyPinId ? { kind: 'pin', pinId: legacyPinId } : null;
}

export function resolveWireEndpoint(endpoint: WireEndpoint | null, pinLookup: PinLookup): Point | null {
  if (!endpoint) return null;
  if (endpoint.kind === 'pin') return pinLookup.get(endpoint.pinId)?.point ?? null;
  return endpoint.point;
}

export function getWirePoints(wire: Wire, pinLookup: PinLookup): { from: Point; to: Point } | null {
  const from = resolveWireEndpoint(normalizeWireEndpoint(wire, 'from'), pinLookup);
  const to = resolveWireEndpoint(normalizeWireEndpoint(wire, 'to'), pinLookup);
  return from && to ? { from, to } : null;
}

export function endpointNodeId(endpoint: WireEndpoint): string {
  if (endpoint.kind === 'pin') return `pin:${endpoint.pinId}`;
  if (endpoint.kind === 'wire') return `wire:${endpoint.wireId}`;
  return `point:${Math.round(endpoint.point.x)}:${Math.round(endpoint.point.y)}`;
}

export function buildWireEndpointGroups(circuit: Circuit): EndpointGroups {
  const groups = new DisjointSet();

  for (const wire of circuit.wires) {
    const wireNode = `wire:${wire.id}`;
    const from = normalizeWireEndpoint(wire, 'from');
    const to = normalizeWireEndpoint(wire, 'to');

    if (from) groups.union(wireNode, endpointNodeId(from));
    if (to) groups.union(wireNode, endpointNodeId(to));
  }

  return groups;
}

export function buildLiveWireIds(circuit: Circuit, signals: SignalState): Set<string> {
  const groups = buildWireEndpointGroups(circuit);
  const liveRoots = new Set<string>();

  for (const gate of circuit.gates) {
    for (const outputPin of gate.outputs) {
      if (signals[outputPin.id]) liveRoots.add(groups.find(`pin:${outputPin.id}`));
    }
  }

  return new Set(circuit.wires.filter((wire) => liveRoots.has(groups.find(`wire:${wire.id}`))).map((wire) => wire.id));
}
