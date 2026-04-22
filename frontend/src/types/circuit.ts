export type ID = string;

export type PinType = "input" | "output";

export interface Pin {
  id: ID;
  name?: string;
  type: PinType;
  // relative offset inside gate box for SVG positioning (0..1)
  offsetX?: number;
  offsetY?: number;
  value?: boolean;
}

export interface Gate {
  id: ID;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: Pin[];
  outputs: Pin[];
  meta?: {
    name?: string;
    description?: string;
  };
}

export interface Connection {
  id: ID;
  fromGateId: ID;
  fromPinId: ID;
  toGateId: ID;
  toPinId: ID;
}

export interface Circuit {
  gates: Gate[];
  connections: Connection[];
  name?: string;
  version?: number;
}
