import { evaluateCircuit } from './evaluateCircuit';
import type { Circuit, CustomComponent, Gate, SignalState, TruthTableRow } from '../types/circuit';
import { createId, nowIso } from '../utils/id';

const DEFAULT_INPUT_LABELS = new Set(['Eingang', 'Input Pin', 'Switch', 'Clock']);
const DEFAULT_OUTPUT_LABELS = new Set(['Ausgang', 'Output Pin', 'LED']);

function isComponentInput(gate: Gate): boolean {
  return gate.type === 'INPUT' || gate.type === 'SWITCH' || gate.type === 'CLOCK';
}

function isComponentOutput(gate: Gate): boolean {
  return gate.type === 'OUTPUT' || gate.type === 'LED';
}

function terminalLabel(gate: Gate, fallbackPrefix: string, index: number, defaultLabels: Set<string>): string {
  const label = gate.label?.trim();
  return label && !defaultLabels.has(label) ? label : `${fallbackPrefix}${index + 1}`;
}

export function componentInputGates(circuit: Circuit): Gate[] {
  return circuit.gates.filter(isComponentInput);
}

export function componentOutputGates(circuit: Circuit): Gate[] {
  return circuit.gates.filter(isComponentOutput);
}

export function componentInputLabels(circuit: Circuit): string[] {
  return componentInputGates(circuit).map((gate, index) => terminalLabel(gate, 'I', index, DEFAULT_INPUT_LABELS));
}

export function componentOutputLabels(circuit: Circuit): string[] {
  return componentOutputGates(circuit).map((gate, index) => terminalLabel(gate, 'O', index, DEFAULT_OUTPUT_LABELS));
}

export function customComponentTruthTable(circuit: Circuit): TruthTableRow[] {
  const inputs = componentInputGates(circuit);
  const outputs = componentOutputGates(circuit);
  const rowCount = 2 ** inputs.length;

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const inputValues = inputs.map((_, inputIndex) => {
      const blockSize = 2 ** (inputs.length - inputIndex - 1);
      return Math.floor(rowIndex / blockSize) % 2 === 1;
    });
    const inputStates: SignalState = Object.fromEntries(inputs.map((gate, index) => [gate.id, inputValues[index]]));
    const signals = evaluateCircuit(circuit, inputStates);

    return {
      inputs: inputValues,
      outputs: outputs.map((gate) => Boolean(signals[gate.id])),
    };
  });
}

export function createCustomComponentFromCircuit(
  circuit: Circuit,
  details: { name: string; description?: string },
): CustomComponent {
  return {
    id: createId('custom'),
    name: details.name,
    description: details.description ?? '',
    inputLabels: componentInputLabels(circuit),
    outputLabels: componentOutputLabels(circuit),
    truthTable: customComponentTruthTable(circuit),
    sourceCircuitId: circuit.id,
    createdAt: nowIso(),
  };
}
