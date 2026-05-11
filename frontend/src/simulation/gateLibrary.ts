import type { BuiltInGateType, Circuit, CustomComponent, ElectricalPinType, Gate, Pin, PinDirection } from '../types/circuit';
import { createId } from '../utils/id';

export const GRID_SIZE = 24;

const DEPRECATED_GATE_TYPE_MAP: Partial<Record<BuiltInGateType, BuiltInGateType>> = {
  SWITCH: 'INPUT',
  CLOCK: 'INPUT',
  VCC: 'INPUT',
  GND: 'INPUT',
  LED: 'OUTPUT',
};

export interface GateTemplate {
  type: BuiltInGateType;
  label: string;
  description: string;
  width: number;
  height: number;
  inputs: number;
  outputs: number;
  minInputs?: number;
  maxInputs?: number;
  configurableInputs?: boolean;
  minOutputs?: number;
  maxOutputs?: number;
  configurableOutputs?: boolean;
  inputLabels?: string[];
  outputLabels?: string[];
  inputElectricalType?: ElectricalPinType;
  outputElectricalType?: ElectricalPinType;
}

export const GATE_TEMPLATES: GateTemplate[] = [
  {
    type: 'INPUT',
    label: 'Input Pin',
    description: 'Externer Eingang / Terminal',
    width: 3,
    height: 2,
    inputs: 0,
    outputs: 1,
    outputLabels: ['OUT'],
  },
  {
    type: 'OUTPUT',
    label: 'Output Pin',
    description: 'Externer Ausgang / Terminal',
    width: 3,
    height: 2,
    inputs: 1,
    outputs: 0,
    inputLabels: ['IN'],
  },
  {
    type: 'AND',
    label: 'AND',
    description: 'Konfigurierbares AND-Gatter',
    width: 4,
    height: 3,
    inputs: 2,
    outputs: 1,
    minInputs: 2,
    maxInputs: 8,
    configurableInputs: true,
    outputLabels: ['Y'],
  },
  {
    type: 'OR',
    label: 'OR',
    description: 'Konfigurierbares OR-Gatter',
    width: 4,
    height: 3,
    inputs: 2,
    outputs: 1,
    minInputs: 2,
    maxInputs: 8,
    configurableInputs: true,
    outputLabels: ['Y'],
  },
  {
    type: 'NOT',
    label: 'NOT',
    description: 'Invertiert ein Signal',
    width: 4,
    height: 3,
    inputs: 1,
    outputs: 1,
    inputLabels: ['A'],
    outputLabels: ['Y'],
  },
  {
    type: 'XOR',
    label: 'XOR',
    description: 'Konfigurierbares Exklusiv-ODER',
    width: 4,
    height: 3,
    inputs: 2,
    outputs: 1,
    minInputs: 2,
    maxInputs: 8,
    configurableInputs: true,
    outputLabels: ['Y'],
  },
  {
    type: 'DFF',
    label: 'D Flip-Flop',
    description: 'Übernimmt D bei steigender CLK-Flanke',
    width: 5,
    height: 4,
    inputs: 2,
    outputs: 1,
    inputLabels: ['D', 'CLK'],
    outputLabels: ['Q'],
  },
  {
    type: 'TFF',
    label: 'T Flip-Flop',
    description: 'Toggelt Q bei T=1 und steigender CLK-Flanke',
    width: 5,
    height: 4,
    inputs: 2,
    outputs: 1,
    inputLabels: ['T', 'CLK'],
    outputLabels: ['Q'],
  },
  {
    type: 'JKFF',
    label: 'JK Flip-Flop',
    description: 'Set, Reset oder Toggle bei steigender CLK-Flanke',
    width: 5,
    height: 4,
    inputs: 3,
    outputs: 1,
    inputLabels: ['J', 'K', 'CLK'],
    outputLabels: ['Q'],
  },
  {
    type: 'GENERIC',
    label: 'Generic IC',
    description: 'Generischer beschriftbarer Baustein',
    width: 5,
    height: 4,
    inputs: 2,
    outputs: 1,
    minInputs: 0,
    maxInputs: 16,
    configurableInputs: true,
    minOutputs: 1,
    maxOutputs: 16,
    configurableOutputs: true,
    outputLabels: ['OUT'],
  },
];

export function normalizeBuiltInGateType(type: BuiltInGateType): BuiltInGateType {
  return DEPRECATED_GATE_TYPE_MAP[type] ?? type;
}

function templateFor(type: BuiltInGateType): GateTemplate {
  const normalizedType = normalizeBuiltInGateType(type);
  const template = GATE_TEMPLATES.find((entry) => entry.type === normalizedType);
  if (!template) {
    throw new Error(`Unknown gate type: ${normalizedType}`);
  }
  return template;
}

function defaultPinLabel(direction: PinDirection, index: number): string {
  return direction === 'input' ? String.fromCharCode(65 + index) : index === 0 ? 'OUT' : `OUT${index + 1}`;
}

export function createPins(
  gateId: string,
  count: number,
  direction: PinDirection,
  labels?: string[],
  electricalType?: ElectricalPinType,
): Pin[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${gateId}:${direction}:${index}`,
    gateId,
    direction,
    electricalType: electricalType ?? direction,
    index,
    label: labels?.[index] ?? defaultPinLabel(direction, index),
    name: labels?.[index] ?? defaultPinLabel(direction, index),
  }));
}

export function createGate(type: BuiltInGateType, x: number, y: number, id = createId('gate')): Gate {
  const normalizedType = normalizeBuiltInGateType(type);
  const template = templateFor(normalizedType);
  const height = template.configurableInputs ? Math.max(template.height, template.inputs + 1) : template.height;

  return {
    id,
    type: normalizedType,
    label: template.label,
    reference: `${normalizedType}${id.slice(-4).toUpperCase()}`,
    value: template.label,
    x,
    y,
    width: template.width,
    height,
    inputs: createPins(id, template.inputs, 'input', template.inputLabels, template.inputElectricalType),
    outputs: createPins(id, template.outputs, 'output', template.outputLabels, template.outputElectricalType),
  };
}

export function createCustomGate(component: CustomComponent, x: number, y: number, id = createId('gate')): Gate {
  const pinCount = Math.max(component.inputLabels.length, component.outputLabels.length, 1);

  return {
    id,
    type: 'CUSTOM',
    customComponentId: component.id,
    label: component.name,
    reference: `U${id.slice(-4).toUpperCase()}`,
    value: component.name,
    x,
    y,
    width: Math.max(4, Math.ceil(component.name.length / 4)),
    height: Math.max(3, pinCount + 1),
    inputs: createPins(id, component.inputLabels.length, 'input', component.inputLabels),
    outputs: createPins(id, component.outputLabels.length, 'output', component.outputLabels),
  };
}

export function canConfigureInputs(gate: Gate): boolean {
  if (gate.type === 'CUSTOM') return false;
  return Boolean(templateFor(gate.type).configurableInputs);
}

export function canConfigureOutputs(gate: Gate): boolean {
  if (gate.type === 'CUSTOM') return false;
  return Boolean(templateFor(gate.type).configurableOutputs);
}

export function configureGatePins(gate: Gate, inputCount: number, outputCount = gate.outputs.length): Gate {
  if (gate.type === 'CUSTOM') return gate;
  const template = templateFor(gate.type);
  const nextInputCount = canConfigureInputs(gate)
    ? Math.max(template.minInputs ?? 0, Math.min(template.maxInputs ?? 16, inputCount))
    : gate.inputs.length;
  const nextOutputCount = canConfigureOutputs(gate)
    ? Math.max(template.minOutputs ?? 0, Math.min(template.maxOutputs ?? 16, outputCount))
    : gate.outputs.length;
  const pinCount = Math.max(nextInputCount, nextOutputCount, 1);

  return {
    ...gate,
    height: Math.max(template.height, pinCount + 1),
    inputs: createPins(gate.id, nextInputCount, 'input', template.inputLabels, template.inputElectricalType),
    outputs: createPins(gate.id, nextOutputCount, 'output', template.outputLabels, template.outputElectricalType),
  };
}

export function configureGateInputs(gate: Gate, inputCount: number): Gate {
  return configureGatePins(gate, inputCount, gate.outputs.length);
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function gateRectPx(gate: Gate): { width: number; height: number } {
  return {
    width: gate.width * GRID_SIZE,
    height: gate.height * GRID_SIZE,
  };
}

export function pinPosition(gate: Gate, pin: Pin): { x: number; y: number } {
  const { width, height } = gateRectPx(gate);
  const pinCount = pin.direction === 'input' ? gate.inputs.length : gate.outputs.length;
  const spacing = height / (pinCount + 1);
  const y = gate.y + spacing * (pin.index + 1);
  const x = pin.direction === 'input' ? gate.x : gate.x + width;
  return { x, y };
}

export function createStarterCircuit(name = 'Neue Schaltung'): Circuit {
  const inputA = createGate('INPUT', 96, 120, 'input_a');
  const inputB = createGate('INPUT', 96, 240, 'input_b');
  const andGate = createGate('AND', 336, 168, 'and_main');
  const outputY = createGate('OUTPUT', 624, 192, 'output_main');

  return {
    id: createId('circuit'),
    name,
    version: 1,
    gates: [inputA, inputB, andGate, outputY],
    wires: [
      {
        id: 'wire_input_a_to_and_main_0',
        from: { kind: 'pin', pinId: inputA.outputs[0].id },
        to: { kind: 'pin', pinId: andGate.inputs[0].id },
        sourcePinId: inputA.outputs[0].id,
        targetPinId: andGate.inputs[0].id,
        points: [],
      },
      {
        id: 'wire_input_b_to_and_main_1',
        from: { kind: 'pin', pinId: inputB.outputs[0].id },
        to: { kind: 'pin', pinId: andGate.inputs[1].id },
        sourcePinId: inputB.outputs[0].id,
        targetPinId: andGate.inputs[1].id,
        points: [],
      },
      {
        id: 'wire_and_main_to_output_main',
        from: { kind: 'pin', pinId: andGate.outputs[0].id },
        to: { kind: 'pin', pinId: outputY.inputs[0].id },
        sourcePinId: andGate.outputs[0].id,
        targetPinId: outputY.inputs[0].id,
        points: [],
      },
    ],
    labels: [
      { id: 'label_a', text: 'A', x: 96, y: 104, wireId: 'wire_input_a_to_and_main_0' },
      { id: 'label_b', text: 'B', x: 96, y: 224, wireId: 'wire_input_b_to_and_main_1' },
    ],
    annotations: [{ id: 'annotation_starter', text: 'BitFlow starter schematic', x: 96, y: 64 }],
    customComponents: [],
  };
}
