import { buildWireEndpointGroups, type EndpointGroups } from './wireUtils';
import type { Circuit, Gate, SignalState } from '../types/circuit';

function evaluateCombinationalGate(type: Gate['type'], inputValues: boolean[]): boolean[] {
  switch (type) {
    case 'INPUT':
    case 'SWITCH':
    case 'CLOCK':
      return [inputValues[0] ?? false];
    case 'VCC':
      return [true];
    case 'GND':
      return [false];
    case 'OUTPUT':
    case 'LED':
      return [inputValues[0] ?? false];
    case 'AND':
      return [inputValues.every(Boolean)];
    case 'OR':
      return [inputValues.some(Boolean)];
    case 'XOR':
      return [inputValues.filter(Boolean).length % 2 === 1];
    case 'NOT':
      return [!inputValues[0]];
    case 'GENERIC':
      return [inputValues.some(Boolean)];
    default:
      return [false];
  }
}

function evaluateCustomGate(circuit: Circuit, gate: Gate, inputValues: boolean[]): boolean[] {
  const component = circuit.customComponents.find((entry) => entry.id === gate.customComponentId);
  if (!component) return gate.outputs.map(() => false);

  const matchingRow = component.truthTable.find(
    (row) => row.inputs.length === inputValues.length && row.inputs.every((value, index) => value === inputValues[index]),
  );

  return gate.outputs.map((_, index) => matchingRow?.outputs[index] ?? false);
}

function evaluateFlipFlop(gate: Gate, inputValues: boolean[], state: SignalState): boolean[] {
  const previousQ = Boolean(state[gate.id]);
  const clockIndex = gate.type === 'JKFF' ? 2 : 1;
  const clock = Boolean(inputValues[clockIndex]);
  const previousClock = Boolean(state[`${gate.id}:prevClock`]);
  let nextQ = previousQ;

  if (clock && !previousClock) {
    if (gate.type === 'DFF') {
      nextQ = Boolean(inputValues[0]);
    } else if (gate.type === 'TFF') {
      nextQ = inputValues[0] ? !previousQ : previousQ;
    } else if (gate.type === 'JKFF') {
      const j = Boolean(inputValues[0]);
      const k = Boolean(inputValues[1]);
      if (j && k) nextQ = !previousQ;
      else if (j) nextQ = true;
      else if (k) nextQ = false;
    }
  }

  state[gate.id] = nextQ;
  state[`${gate.id}:prevClock`] = clock;
  return [nextQ];
}

function buildNetValues(circuit: Circuit, groups: EndpointGroups, signals: SignalState): Map<string, boolean> {
  const values = new Map<string, boolean>();

  for (const gate of circuit.gates) {
    for (const outputPin of gate.outputs) {
      const root = groups.find(`pin:${outputPin.id}`);
      values.set(root, Boolean(values.get(root)) || Boolean(signals[outputPin.id]));
    }
  }

  return values;
}

export function evaluateCircuit(circuit: Circuit, inputStates: SignalState): SignalState {
  const nextSignals: SignalState = { ...inputStates };
  const groups = buildWireEndpointGroups(circuit);
  const maxIterations = Math.max(4, circuit.gates.length * 5);

  for (let i = 0; i < maxIterations; i += 1) {
    let changed = false;
    const netValues = buildNetValues(circuit, groups, nextSignals);

    for (const gate of circuit.gates) {
      if (gate.type === 'INPUT' || gate.type === 'SWITCH' || gate.type === 'CLOCK') {
        const outputPin = gate.outputs[0];
        const state = Boolean(nextSignals[gate.id]);
        if (outputPin && nextSignals[outputPin.id] !== state) {
          nextSignals[outputPin.id] = state;
          changed = true;
        }
        continue;
      }

      const inputValues = gate.inputs.map((pin) => Boolean(netValues.get(groups.find(`pin:${pin.id}`))));

      const outputValues =
        gate.type === 'CUSTOM'
          ? evaluateCustomGate(circuit, gate, inputValues)
          : gate.type === 'DFF' || gate.type === 'TFF' || gate.type === 'JKFF'
            ? evaluateFlipFlop(gate, inputValues, nextSignals)
            : evaluateCombinationalGate(gate.type, inputValues);

      if (gate.type === 'OUTPUT' || gate.type === 'LED') {
        if (nextSignals[gate.id] !== outputValues[0]) {
          nextSignals[gate.id] = outputValues[0];
          changed = true;
        }
        continue;
      }

      for (const [index, outputPin] of gate.outputs.entries()) {
        const outputValue = outputValues[index] ?? false;
        if (nextSignals[outputPin.id] !== outputValue) {
          nextSignals[outputPin.id] = outputValue;
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  return nextSignals;
}
