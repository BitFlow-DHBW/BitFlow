export type BuiltInGateType =
  | 'INPUT'
  | 'OUTPUT'
  | 'SWITCH'
  | 'LED'
  | 'CLOCK'
  | 'VCC'
  | 'GND'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'XOR'
  | 'DFF'
  | 'TFF'
  | 'JKFF'
  | 'GENERIC';

export type GateType = BuiltInGateType | 'CUSTOM';

export type EditorMode = 'edit' | 'simulate';

export type EditorTool =
  | {
      kind: 'builtin';
      type: BuiltInGateType;
    }
  | {
      kind: 'custom';
      componentId: string;
    };

export type PinDirection = 'input' | 'output';

export type ElectricalPinType = 'input' | 'output' | 'passive' | 'power';

export interface Point {
  x: number;
  y: number;
}

export interface Pin {
  id: string;
  gateId: string;
  direction: PinDirection;
  electricalType?: ElectricalPinType;
  index: number;
  label?: string;
  name?: string;
}

export interface Gate {
  id: string;
  type: GateType;
  customComponentId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  reference?: string;
  value?: string;
  symbol?: string;
  inputs: Pin[];
  outputs: Pin[];
  truthTable?: TruthTableRow[];
}

export interface Wire {
  id: string;
  from?: WireEndpoint;
  to?: WireEndpoint;
  sourcePinId?: string;
  targetPinId?: string;
  points: Point[];
  previewStatus?: 'preview';
}

export type WireEndpoint =
  | {
      kind: 'pin';
      pinId: string;
    }
  | {
      kind: 'point';
      point: Point;
    }
  | {
      kind: 'wire';
      wireId: string;
      point: Point;
    };

export interface Circuit {
  id: string;
  name: string;
  version: number;
  gates: Gate[];
  wires: Wire[];
  annotations?: Annotation[];
  nets?: Net[];
  customComponents: CustomComponent[];
}

export interface Net {
  id: string;
  name: string;
  pinIds: string[];
  wireIds: string[];
}

export interface Annotation {
  id: string;
  text: string;
  x: number;
  y: number;
}

export type SignalState = Record<string, boolean>;

export interface DragState {
  gateId: string;
  offsetX: number;
  offsetY: number;
}

export interface WireDraft {
  start: WireEndpoint;
  from: Point;
  to: Point;
}

export interface TruthTableRow {
  inputs: boolean[];
  outputs: boolean[];
}

export interface CustomComponent {
  id: string;
  name: string;
  description?: string;
  inputLabels: string[];
  outputLabels: string[];
  truthTable: TruthTableRow[];
  sourceCircuitId?: string;
  createdAt: string;
}
