import { describe, expect, it } from 'vitest';
import { evaluateCircuit } from './evaluateCircuit';
import { createCustomGate } from './gateLibrary';
import { circuitWith, customComponent, gate, wire } from '../test/builders';
import type { Circuit, Gate, Wire } from '../types/circuit';

function connect(id: string, source: Gate, target: Gate, sourcePin = 0, targetPin = 0): Wire {
  return wire(id, source, sourcePin, target, targetPin);
}

function inputToOutputCircuit(): { circuit: Circuit; input: Gate; output: Gate } {
  const input = gate('INPUT', 'input_a');
  const output = gate('OUTPUT', 'output_y');
  return {
    input,
    output,
    circuit: circuitWith([input, output], [connect('wire_input_output', input, output)]),
  };
}

describe('evaluateCircuit', () => {
  it('propagates a source input through a wire into an output indicator', () => {
    const { circuit, input, output } = inputToOutputCircuit();

    const signals = evaluateCircuit(circuit, { [input.id]: true });

    expect(signals[input.outputs[0].id]).toBe(true);
    expect(signals[output.id]).toBe(true);
  });

  it('evaluates AND, OR, XOR and NOT gates according to boolean logic', () => {
    const inputA = gate('INPUT', 'input_a');
    const inputB = gate('INPUT', 'input_b');
    const andGate = gate('AND', 'and_gate');
    const orGate = gate('OR', 'or_gate');
    const xorGate = gate('XOR', 'xor_gate');
    const notGate = gate('NOT', 'not_gate');

    const circuit = circuitWith(
      [inputA, inputB, andGate, orGate, xorGate, notGate],
      [
        connect('a_and', inputA, andGate, 0, 0),
        connect('b_and', inputB, andGate, 0, 1),
        connect('a_or', inputA, orGate, 0, 0),
        connect('b_or', inputB, orGate, 0, 1),
        connect('a_xor', inputA, xorGate, 0, 0),
        connect('b_xor', inputB, xorGate, 0, 1),
        connect('a_not', inputA, notGate),
      ],
    );

    const oneHigh = evaluateCircuit(circuit, { [inputA.id]: true, [inputB.id]: false });
    expect(oneHigh[andGate.outputs[0].id]).toBe(false);
    expect(oneHigh[orGate.outputs[0].id]).toBe(true);
    expect(oneHigh[xorGate.outputs[0].id]).toBe(true);
    expect(oneHigh[notGate.outputs[0].id]).toBe(false);

    const bothHigh = evaluateCircuit(circuit, { [inputA.id]: true, [inputB.id]: true });
    expect(bothHigh[andGate.outputs[0].id]).toBe(true);
    expect(bothHigh[orGate.outputs[0].id]).toBe(true);
    expect(bothHigh[xorGate.outputs[0].id]).toBe(false);
  });

  it('evaluates generic truth tables plus VCC and GND behavior for imported circuits', () => {
    const generic = {
      ...gate('GENERIC', 'generic'),
      truthTable: [
        { inputs: [false, false], outputs: [false] },
        { inputs: [false, true], outputs: [false] },
        { inputs: [true, false], outputs: [true] },
        { inputs: [true, true], outputs: [false] },
      ],
    };
    const vcc = { ...gate('INPUT', 'vcc'), type: 'VCC' as const };
    const gnd = { ...gate('INPUT', 'gnd'), type: 'GND' as const };
    const out1 = gate('OUTPUT', 'out1');
    const out2 = gate('OUTPUT', 'out2');
    const out3 = gate('OUTPUT', 'out3');
    const circuit = circuitWith(
      [vcc, gnd, generic, out1, out2, out3],
      [
        connect('vcc_generic', vcc, generic, 0, 0),
        connect('gnd_generic', gnd, generic, 0, 1),
        connect('generic_out', generic, out1),
        connect('vcc_out', vcc, out2),
        connect('gnd_out', gnd, out3),
      ],
    );

    const signals = evaluateCircuit(circuit, {});

    expect(signals[generic.outputs[0].id]).toBe(true);
    expect(signals[out1.id]).toBe(true);
    expect(signals[out2.id]).toBe(true);
    expect(signals[out3.id]).toBe(false);
  });

  it('drives all generic outputs from the matching truth table row', () => {
    const inputA = gate('INPUT', 'input_a');
    const inputB = gate('INPUT', 'input_b');
    const generic = {
      ...gate('GENERIC', 'generic_multi'),
      outputs: [
        ...gate('GENERIC', 'generic_multi').outputs,
        {
          id: 'generic_multi:output:1',
          gateId: 'generic_multi',
          direction: 'output' as const,
          electricalType: 'output' as const,
          index: 1,
          label: 'OUT2',
          name: 'OUT2',
        },
      ],
      truthTable: [
        { inputs: [false, false], outputs: [false, false] },
        { inputs: [false, true], outputs: [false, true] },
        { inputs: [true, false], outputs: [true, false] },
        { inputs: [true, true], outputs: [true, true] },
      ],
    };
    const circuit = circuitWith(
      [inputA, inputB, generic],
      [connect('a_generic', inputA, generic, 0, 0), connect('b_generic', inputB, generic, 0, 1)],
    );

    const signals = evaluateCircuit(circuit, { [inputA.id]: false, [inputB.id]: true });

    expect(signals[generic.outputs[0].id]).toBe(false);
    expect(signals[generic.outputs[1].id]).toBe(true);
  });

  it('uses custom component truth tables and falls back to false when no row matches', () => {
    const component = customComponent();
    const inputA = gate('INPUT', 'input_a');
    const inputB = gate('INPUT', 'input_b');
    const customGate = createCustomGate(component, 0, 0, 'custom_gate');
    const circuit = circuitWith(
      [inputA, inputB, customGate],
      [connect('a_custom', inputA, customGate, 0, 0), connect('b_custom', inputB, customGate, 0, 1)],
      { customComponents: [component] },
    );

    const xorAndCarry = evaluateCircuit(circuit, { [inputA.id]: true, [inputB.id]: true });
    expect(xorAndCarry[customGate.outputs[0].id]).toBe(false);
    expect(xorAndCarry[customGate.outputs[1].id]).toBe(true);

    const missingDefinition = evaluateCircuit({ ...circuit, customComponents: [] }, { [inputA.id]: true, [inputB.id]: true });
    expect(missingDefinition[customGate.outputs[0].id]).toBe(false);
    expect(missingDefinition[customGate.outputs[1].id]).toBe(false);
  });

  it('updates a D flip-flop only on a rising clock edge', () => {
    const data = gate('INPUT', 'data');
    const clock = gate('INPUT', 'clock');
    const dff = gate('DFF', 'dff');
    const circuit = circuitWith(
      [data, clock, dff],
      [connect('data_dff', data, dff, 0, 0), connect('clock_dff', clock, dff, 0, 1)],
    );

    const lowClock = evaluateCircuit(circuit, { [data.id]: true, [clock.id]: false });
    expect(lowClock[dff.outputs[0].id]).toBe(false);

    const rising = evaluateCircuit(circuit, { ...lowClock, [data.id]: true, [clock.id]: true });
    expect(rising[dff.outputs[0].id]).toBe(true);

    const noSecondEdge = evaluateCircuit(circuit, { ...rising, [data.id]: false, [clock.id]: true });
    expect(noSecondEdge[dff.outputs[0].id]).toBe(true);
  });

  it('supports T and JK flip-flop toggle/set/reset behavior', () => {
    const t = gate('INPUT', 't');
    const tClock = gate('INPUT', 't_clock');
    const tff = gate('TFF', 'tff');
    const j = gate('INPUT', 'j');
    const k = gate('INPUT', 'k');
    const jkClock = gate('INPUT', 'jk_clock');
    const jkff = gate('JKFF', 'jkff');
    const circuit = circuitWith(
      [t, tClock, tff, j, k, jkClock, jkff],
      [
        connect('t_to_tff', t, tff, 0, 0),
        connect('tclock_to_tff', tClock, tff, 0, 1),
        connect('j_to_jkff', j, jkff, 0, 0),
        connect('k_to_jkff', k, jkff, 0, 1),
        connect('jkclock_to_jkff', jkClock, jkff, 0, 2),
      ],
    );

    const firstEdge = evaluateCircuit(circuit, {
      [t.id]: true,
      [tClock.id]: true,
      [j.id]: true,
      [k.id]: false,
      [jkClock.id]: true,
    });
    expect(firstEdge[tff.outputs[0].id]).toBe(true);
    expect(firstEdge[jkff.outputs[0].id]).toBe(true);

    const clockLow = evaluateCircuit(circuit, { ...firstEdge, [tClock.id]: false, [jkClock.id]: false });
    const resetEdge = evaluateCircuit(circuit, {
      ...clockLow,
      [t.id]: true,
      [tClock.id]: true,
      [j.id]: false,
      [k.id]: true,
      [jkClock.id]: true,
    });
    expect(resetEdge[tff.outputs[0].id]).toBe(false);
    expect(resetEdge[jkff.outputs[0].id]).toBe(false);
  });

  it('stabilizes empty or unconnected circuits without throwing', () => {
    expect(evaluateCircuit(circuitWith([]), {})).toEqual({});

    const output = gate('OUTPUT', 'unconnected_output');
    expect(evaluateCircuit(circuitWith([output]), {})[output.id]).toBe(false);
  });
});
