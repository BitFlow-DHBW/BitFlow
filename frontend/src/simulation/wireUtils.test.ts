import { describe, expect, it } from 'vitest';
import { buildCircuitNets } from './netModel';
import { createPinLookup, endpointNodeId, getWirePoints, normalizeWireEndpoint, resolveWireEndpoint } from './wireUtils';
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

  it('builds nets across connected wires and applies labels', () => {
    const input = gate('INPUT', 'input_net');
    const andGate = gate('AND', 'and_net');
    const output = gate('OUTPUT', 'output_net');
    const firstWire = wire('input_to_and', input, 0, andGate, 0);
    const secondWire = wire('and_to_output', andGate, 0, output, 0);
    const circuit = circuitWith([input, andGate, output], [firstWire, secondWire], {
      labels: [{ id: 'label_a', text: 'A_BUS', x: 0, y: 0, wireId: firstWire.id }],
    });

    const nets = buildCircuitNets(circuit);

    expect(nets).toHaveLength(2);
    expect(nets.find((net) => net.wireIds.includes(firstWire.id))).toMatchObject({
      name: 'A_BUS',
      labelIds: ['label_a'],
      pinIds: [input.outputs[0].id, andGate.inputs[0].id],
    });
    expect(nets.find((net) => net.wireIds.includes(secondWire.id))?.name).toBe('N2');
  });

  it('uses deterministic endpoint node ids for pins, wires and free points', () => {
    expect(endpointNodeId({ kind: 'pin', pinId: 'pin_a' })).toBe('pin:pin_a');
    expect(endpointNodeId({ kind: 'wire', wireId: 'wire_a', point: { x: 1, y: 2 } })).toBe('wire:wire_a');
    expect(endpointNodeId({ kind: 'point', point: { x: 1.3, y: 2.7 } })).toBe('point:1:3');
  });
});
