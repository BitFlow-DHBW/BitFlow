import { pinPosition } from './gateLibrary';
import type { Circuit, Gate, Pin, Point, Wire, WireEndpoint } from '../types/circuit';

export type PinLookup = Map<string, { gate: Gate; pin: Pin; point: Point }>;

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
