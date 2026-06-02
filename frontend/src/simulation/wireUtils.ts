import { pinPosition } from './gateLibrary';
import type { Circuit, Gate, Pin, Point, SignalState, Wire, WireEndpoint } from '../types/circuit';

export interface PinLookupEntry {
  gate: Gate;
  pin: Pin;
  point: Point;
}

export type PinLookup = Map<string, PinLookupEntry>;

export type ConnectionValidationReason = 'same-pin' | 'matching-directions' | 'duplicate' | 'missing-start-pin';

export interface ConnectionValidation {
  valid: boolean;
  reason?: ConnectionValidationReason;
}

export interface PinSnapCandidate extends PinLookupEntry {
  distance: number;
  validation: ConnectionValidation;
}

export interface PinSnapResult {
  valid: PinSnapCandidate | null;
  invalid: PinSnapCandidate | null;
}

interface FindNearestPinOptions {
  radius: number;
  pinLookup?: PinLookup;
}

export const PIN_SNAP_RADIUS_SCREEN_PX = 20;
const MIN_PIN_SNAP_RADIUS_SVG = 8;
const MAX_PIN_SNAP_RADIUS_SVG = 48;

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

export function getPinAbsolutePosition(gate: Gate, pin: Pin): Point {
  return pinPosition(gate, pin);
}

export function getAllPins(circuit: Circuit): PinLookupEntry[] {
  const pins: PinLookupEntry[] = [];
  for (const gate of circuit.gates) {
    for (const pin of [...gate.inputs, ...gate.outputs]) {
      pins.push({ gate, pin, point: getPinAbsolutePosition(gate, pin) });
    }
  }

  return pins;
}

export function createPinLookup(circuit: Circuit): PinLookup {
  const map: PinLookup = new Map();

  for (const entry of getAllPins(circuit)) {
    map.set(entry.pin.id, entry);
  }

  return map;
}

export function normalizeWireEndpoint(wire: Wire, side: 'from' | 'to'): WireEndpoint | null {
  const endpoint = side === 'from' ? wire.from : wire.to;
  if (endpoint) return endpoint;

  const legacyPinId = side === 'from' ? wire.sourcePinId : wire.targetPinId;
  return legacyPinId ? { kind: 'pin', pinId: legacyPinId } : null;
}

function wireConnectsPins(wire: Wire, firstPinId: string, secondPinId: string): boolean {
  const from = normalizeWireEndpoint(wire, 'from');
  const to = normalizeWireEndpoint(wire, 'to');
  if (from?.kind !== 'pin' || to?.kind !== 'pin') return false;

  return (
    (from.pinId === firstPinId && to.pinId === secondPinId) ||
    (from.pinId === secondPinId && to.pinId === firstPinId)
  );
}

export function validateConnection(startPin: Pin, targetPin: Pin, circuit: Circuit): ConnectionValidation {
  if (startPin.id === targetPin.id) return { valid: false, reason: 'same-pin' };
  if (startPin.direction === targetPin.direction) return { valid: false, reason: 'matching-directions' };
  if (circuit.wires.some((wire) => wireConnectsPins(wire, startPin.id, targetPin.id))) {
    return { valid: false, reason: 'duplicate' };
  }

  return { valid: true };
}

export function validateWireTarget(
  start: WireEndpoint,
  targetPin: Pin,
  circuit: Circuit,
  pinLookup = createPinLookup(circuit),
): ConnectionValidation {
  if (start.kind !== 'pin') return { valid: true };

  const startPin = pinLookup.get(start.pinId)?.pin;
  if (!startPin) return { valid: false, reason: 'missing-start-pin' };
  return validateConnection(startPin, targetPin, circuit);
}

export function getPinSnapRadius(zoomLevel: number): number {
  const safeZoom = Number.isFinite(zoomLevel) && zoomLevel > 0 ? zoomLevel : 1;
  return Math.min(MAX_PIN_SNAP_RADIUS_SVG, Math.max(MIN_PIN_SNAP_RADIUS_SVG, PIN_SNAP_RADIUS_SCREEN_PX / safeZoom));
}

export function findNearestConnectablePin(
  point: Point,
  start: WireEndpoint,
  circuit: Circuit,
  options: FindNearestPinOptions,
): PinSnapResult {
  const pinLookup = options.pinLookup ?? createPinLookup(circuit);
  let nearestValid: PinSnapCandidate | null = null;
  let nearestInvalid: PinSnapCandidate | null = null;

  for (const entry of pinLookup.values()) {
    const distance = Math.hypot(entry.point.x - point.x, entry.point.y - point.y);
    if (distance > options.radius) continue;

    const candidate = {
      ...entry,
      distance,
      validation: validateWireTarget(start, entry.pin, circuit, pinLookup),
    };

    if (candidate.validation.valid) {
      if (!nearestValid || candidate.distance < nearestValid.distance) nearestValid = candidate;
    } else if (!nearestInvalid || candidate.distance < nearestInvalid.distance) {
      nearestInvalid = candidate;
    }
  }

  return { valid: nearestValid, invalid: nearestInvalid };
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
