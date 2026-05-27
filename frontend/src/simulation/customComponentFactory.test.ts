import { describe, expect, it } from 'vitest';
import { createCustomComponentFromCircuit } from './customComponentFactory';
import { circuitWith, gate, wire } from '../test/builders';

describe('customComponentFactory', () => {
  it('builds a custom component truth table from the current circuit', () => {
    const inputA = { ...gate('INPUT', 'input_a'), label: 'A' };
    const inputB = { ...gate('INPUT', 'input_b'), label: 'B' };
    const andGate = gate('AND', 'and_gate');
    const output = { ...gate('OUTPUT', 'output_y'), label: 'Y' };
    const circuit = circuitWith(
      [inputA, inputB, andGate, output],
      [
        wire('a_and', inputA, 0, andGate, 0),
        wire('b_and', inputB, 0, andGate, 1),
        wire('and_output', andGate, 0, output),
      ],
    );

    const component = createCustomComponentFromCircuit(circuit, { name: 'And Block', description: 'Generated AND' });

    expect(component).toMatchObject({
      name: 'And Block',
      description: 'Generated AND',
      inputLabels: ['A', 'B'],
      outputLabels: ['Y'],
      sourceCircuitId: 'circuit_test',
      truthTable: [
        { inputs: [false, false], outputs: [false] },
        { inputs: [false, true], outputs: [false] },
        { inputs: [true, false], outputs: [false] },
        { inputs: [true, true], outputs: [true] },
      ],
    });
  });

  it('falls back to stable terminal labels for default input and output gates', () => {
    const input = gate('INPUT', 'default_input');
    const output = gate('OUTPUT', 'default_output');
    const circuit = circuitWith([input, output], [wire('default_wire', input, 0, output)]);

    const component = createCustomComponentFromCircuit(circuit, { name: 'Default Labels' });

    expect(component.inputLabels).toEqual(['I1']);
    expect(component.outputLabels).toEqual(['O1']);
  });
});
