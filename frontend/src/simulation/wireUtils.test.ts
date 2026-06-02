import { describe, expect, it } from 'vitest';
import { buildCircuitNets } from './netModel';
import {
  buildLiveWireIds,
  createPinLookup,
  endpointNodeId,
  findNearestConnectablePin,
  getPinAbsolutePosition,
  getPinSnapRadius,
  getWirePoints,
  normalizeWireEndpoint,
  resolveWireEndpoint,
  validateConnection,
} from './wireUtils';
import { circuitWith, gate, wire } from '../test/builders';
import type { Wire } from '../types/circuit';

describe('wire utilities and net model', () => {
  it('creates a pin lookup with grid-aligned pin coordinates', () => {
    const input = gate('INPUT', 'input_lookup', 96, 120);
    const circuit = circuitWith([input]);
    const lookup = createPinLookup(circuit);

    expect(lookup.get(input.outputs[0].id)).toMatchObject({
      gate: input,
      pin: input.outputs[0],
      point: { x: 168, y: 144 },
    });
  });

  it('calculates absolute pin positions independently of React components', () => {
    const output = gate('OUTPUT', 'output_position', 240, 96);

    expect(getPinAbsolutePosition(output, output.inputs[0])).toEqual({ x: 240, y: 120 });
  });

  it('snaps to the nearest valid pin and ignores a closer invalid pin', () => {
    const source = gate('INPUT', 'source_snap', 0, 0);
    const invalid = gate('INPUT', 'invalid_snap', 144, 0);
    const nearestValid = gate('OUTPUT', 'valid_snap_near', 192, 0);
    const fartherValid = gate('OUTPUT', 'valid_snap_far', 240, 0);
    const circuit = circuitWith([source, invalid, nearestValid, fartherValid]);

    const snap = findNearestConnectablePin(
      { x: 214, y: 24 },
      { kind: 'pin', pinId: source.outputs[0].id },
      circuit,
      { radius: 64 },
    );

    expect(snap.valid).toMatchObject({
      pin: nearestValid.inputs[0],
      point: { x: 192, y: 24 },
    });
    expect(snap.invalid).toMatchObject({ pin: invalid.outputs[0] });
  });

  it('reports nearby matching directions as invalid snap candidates', () => {
    const source = gate('INPUT', 'source_invalid', 0, 0);
    const target = gate('INPUT', 'target_invalid', 144, 0);
    const circuit = circuitWith([source, target]);

    const snap = findNearestConnectablePin(
      { x: 214, y: 24 },
      { kind: 'pin', pinId: source.outputs[0].id },
      circuit,
      { radius: 12 },
    );

    expect(snap.valid).toBeNull();
    expect(snap.invalid).toMatchObject({
      pin: target.outputs[0],
      validation: { valid: false, reason: 'matching-directions' },
    });
  });

  it('rejects same-direction, self and duplicate pin connections in either direction', () => {
    const source = gate('INPUT', 'source_validation');
    const secondSource = gate('INPUT', 'second_source_validation');
    const target = gate('OUTPUT', 'target_validation');
    const existingWire = wire('wire_validation', source, 0, target);
    const circuit = circuitWith([source, secondSource, target], [existingWire]);

    expect(validateConnection(source.outputs[0], source.outputs[0], circuit)).toEqual({
      valid: false,
      reason: 'same-pin',
    });
    expect(validateConnection(source.outputs[0], secondSource.outputs[0], circuit)).toEqual({
      valid: false,
      reason: 'matching-directions',
    });
    expect(validateConnection(source.outputs[0], target.inputs[0], circuit)).toEqual({
      valid: false,
      reason: 'duplicate',
    });
    expect(validateConnection(target.inputs[0], source.outputs[0], circuit)).toEqual({
      valid: false,
      reason: 'duplicate',
    });
  });

  it('keeps the zoom-aware snap radius bounded in SVG coordinates', () => {
    expect(getPinSnapRadius(1)).toBe(20);
    expect(getPinSnapRadius(3)).toBe(8);
    expect(getPinSnapRadius(0.25)).toBe(48);
  });

  it('normalizes modern and legacy wire endpoints', () => {
    const input = gate('INPUT', 'input_legacy');
    const output = gate('OUTPUT', 'output_legacy');
    const modern = wire('modern', input, 0, output);
    const legacy: Wire = {
      id: 'legacy',
      sourcePinId: input.outputs[0].id,
      targetPinId: output.inputs[0].id,
      points: [],
    };

    expect(normalizeWireEndpoint(modern, 'from')).toEqual({ kind: 'pin', pinId: input.outputs[0].id });
    expect(normalizeWireEndpoint(legacy, 'to')).toEqual({ kind: 'pin', pinId: output.inputs[0].id });
    expect(normalizeWireEndpoint({ id: 'empty', points: [] }, 'from')).toBeNull();
  });

  it('resolves pin, point and missing endpoints into drawable wire points', () => {
    const input = gate('INPUT', 'input_points');
    const output = gate('OUTPUT', 'output_points');
    const circuit = circuitWith([input, output], [wire('input_output', input, 0, output)]);
    const lookup = createPinLookup(circuit);

    expect(resolveWireEndpoint({ kind: 'pin', pinId: input.outputs[0].id }, lookup)).toEqual({ x: 72, y: 24 });
    expect(resolveWireEndpoint({ kind: 'point', point: { x: 30, y: 40 } }, lookup)).toEqual({ x: 30, y: 40 });
    expect(resolveWireEndpoint({ kind: 'pin', pinId: 'missing' }, lookup)).toBeNull();
    expect(getWirePoints({ id: 'missing_to', from: { kind: 'pin', pinId: input.outputs[0].id }, points: [] }, lookup)).toBeNull();
  });

  it('builds nets across connected wires with generated names', () => {
    const input = gate('INPUT', 'input_net');
    const andGate = gate('AND', 'and_net');
    const output = gate('OUTPUT', 'output_net');
    const firstWire = wire('input_to_and', input, 0, andGate, 0);
    const secondWire = wire('and_to_output', andGate, 0, output, 0);
    const circuit = circuitWith([input, andGate, output], [firstWire, secondWire]);

    const nets = buildCircuitNets(circuit);

    expect(nets).toHaveLength(2);
    expect(nets.find((net) => net.wireIds.includes(firstWire.id))).toMatchObject({
      name: 'N1',
      pinIds: [input.outputs[0].id, andGate.inputs[0].id],
    });
    expect(nets.find((net) => net.wireIds.includes(secondWire.id))?.name).toBe('N2');
  });

  it('uses deterministic endpoint node ids for pins, wires and free points', () => {
    expect(endpointNodeId({ kind: 'pin', pinId: 'pin_a' })).toBe('pin:pin_a');
    expect(endpointNodeId({ kind: 'wire', wireId: 'wire_a', point: { x: 1, y: 2 } })).toBe('wire:wire_a');
    expect(endpointNodeId({ kind: 'point', point: { x: 1.3, y: 2.7 } })).toBe('point:1:3');
  });

  it('marks wires live from connected output signals regardless of draw direction', () => {
    const input = gate('INPUT', 'input_live');
    const andGate = gate('AND', 'and_live');
    const reversedWire: Wire = {
      id: 'wire_reversed',
      from: { kind: 'pin', pinId: andGate.inputs[0].id },
      to: { kind: 'pin', pinId: input.outputs[0].id },
      sourcePinId: andGate.inputs[0].id,
      targetPinId: input.outputs[0].id,
      points: [],
    };
    const circuit = circuitWith([input, andGate], [reversedWire]);

    expect(buildLiveWireIds(circuit, { [input.outputs[0].id]: true })).toEqual(new Set(['wire_reversed']));
  });
});
