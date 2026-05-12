import { describe, expect, it } from 'vitest';
import {
  GATE_TEMPLATES,
  canConfigureInputs,
  canConfigureOutputs,
  configureGateInputs,
  configureGatePins,
  createCustomGate,
  createGate,
  createPins,
  createStarterCircuit,
  gateRectPx,
  normalizeBuiltInGateType,
  pinPosition,
  snapToGrid,
} from './gateLibrary';
import { customComponent } from '../test/builders';

describe('gateLibrary', () => {
  it('snaps arbitrary coordinates to the 24px editor grid', () => {
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(11)).toBe(0);
    expect(snapToGrid(13)).toBe(24);
    expect(snapToGrid(47)).toBe(48);
    expect(snapToGrid(-13)).toBe(-24);
  });

  it('normalizes deprecated gate aliases used by older saved projects', () => {
    expect(normalizeBuiltInGateType('SWITCH')).toBe('INPUT');
    expect(normalizeBuiltInGateType('CLOCK')).toBe('INPUT');
    expect(normalizeBuiltInGateType('VCC')).toBe('INPUT');
    expect(normalizeBuiltInGateType('LED')).toBe('OUTPUT');
    expect(normalizeBuiltInGateType('AND')).toBe('AND');
  });

  it('creates built-in gates with stable pin ids and labels', () => {
    const andGate = createGate('AND', 24, 48, 'and_1');

    expect(andGate).toMatchObject({
      id: 'and_1',
      type: 'AND',
      label: 'AND',
      reference: 'ANDND_1',
      value: 'AND',
      x: 24,
      y: 48,
      width: 4,
    });
    expect(andGate.inputs).toHaveLength(2);
    expect(andGate.outputs).toHaveLength(1);
    expect(andGate.inputs[0]).toMatchObject({ id: 'and_1:input:0', direction: 'input', label: 'A' });
    expect(andGate.outputs[0]).toMatchObject({ id: 'and_1:output:0', direction: 'output', label: 'Y' });
  });

  it('creates pins with default labels for higher arity gates', () => {
    expect(createPins('gate_x', 3, 'input').map((pin) => pin.label)).toEqual(['A', 'B', 'C']);
    expect(createPins('gate_x', 3, 'output').map((pin) => pin.label)).toEqual(['OUT', 'OUT2', 'OUT3']);
  });

  it('creates custom gates from custom component metadata', () => {
    const gate = createCustomGate(customComponent({ name: 'Adder' }), 96, 120, 'custom_1');

    expect(gate.type).toBe('CUSTOM');
    expect(gate.customComponentId).toBe('custom_half_adder');
    expect(gate.label).toBe('Adder');
    expect(gate.inputs.map((pin) => pin.label)).toEqual(['A', 'B']);
    expect(gate.outputs.map((pin) => pin.label)).toEqual(['SUM', 'CARRY']);
  });

  it('bounds configurable gate inputs and outputs to template limits', () => {
    const andGate = createGate('AND', 0, 0, 'and_cfg');
    const genericGate = createGate('GENERIC', 0, 0, 'gen_cfg');

    expect(canConfigureInputs(andGate)).toBe(true);
    expect(canConfigureOutputs(andGate)).toBe(false);
    expect(configureGateInputs(andGate, 99).inputs).toHaveLength(8);
    expect(configureGateInputs(andGate, 1).inputs).toHaveLength(2);

    expect(canConfigureInputs(genericGate)).toBe(true);
    expect(canConfigureOutputs(genericGate)).toBe(true);
    const configuredGeneric = configureGatePins(genericGate, -1, 99);
    expect(configuredGeneric.inputs).toHaveLength(0);
    expect(configuredGeneric.outputs).toHaveLength(16);
  });

  it('leaves non-configurable and custom gate pin counts unchanged', () => {
    const notGate = createGate('NOT', 0, 0, 'not_static');
    const customGate = createCustomGate(customComponent(), 0, 0, 'custom_static');

    expect(canConfigureInputs(notGate)).toBe(false);
    expect(canConfigureOutputs(customGate)).toBe(false);
    expect(configureGatePins(notGate, 8).inputs).toHaveLength(1);
    expect(configureGatePins(customGate, 8, 8)).toBe(customGate);
  });

  it('aligns gate dimensions and pin positions to grid lines', () => {
    const gate = configureGateInputs(createGate('AND', 96, 120, 'and_pos'), 3);
    const rect = gateRectPx(gate);
    const firstInput = pinPosition(gate, gate.inputs[0]);
    const output = pinPosition(gate, gate.outputs[0]);

    expect(rect.width).toBe(96);
    expect(rect.height % 24).toBe(0);
    expect(firstInput.x).toBe(96);
    expect(firstInput.y % 24).toBe(0);
    expect(output.x).toBe(192);
    expect(output.y % 24).toBe(0);
  });

  it('creates a starter circuit that is immediately simulatable', () => {
    const starter = createStarterCircuit('Starter');

    expect(starter.name).toBe('Starter');
    expect(starter.gates.map((gate) => gate.id)).toEqual(['input_a', 'input_b', 'and_main', 'output_main']);
    expect(starter.wires).toHaveLength(3);
    expect(starter.labels?.map((label) => label.text)).toEqual(['A', 'B']);
    expect(starter.annotations?.[0].text).toContain('starter');
  });

  it('throws for unknown built-in gate types instead of creating corrupt gates', () => {
    expect(() => createGate('MISSING' as never, 0, 0)).toThrow('Unknown gate type');
    expect(GATE_TEMPLATES.length).toBeGreaterThan(0);
  });
});
