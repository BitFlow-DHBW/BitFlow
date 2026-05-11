import { gateRectPx } from '../simulation/gateLibrary';
import type { Gate } from '../types/circuit';

export interface SymbolGeometry {
  width: number;
  height: number;
  bodyX: number;
  bodyY: number;
  bodyWidth: number;
  bodyHeight: number;
}

export function symbolGeometry(gate: Gate): SymbolGeometry {
  const { width, height } = gateRectPx(gate);
  return {
    width,
    height,
    bodyX: gate.x + 8,
    bodyY: gate.y + 8,
    bodyWidth: Math.max(32, width - 16),
    bodyHeight: Math.max(28, height - 16),
  };
}

export function isIndicatorGate(gate: Gate): boolean {
  return gate.type === 'LED' || gate.type === 'OUTPUT';
}

export function isInteractiveSourceGate(gate: Gate): boolean {
  return gate.type === 'INPUT' || gate.type === 'SWITCH' || gate.type === 'CLOCK';
}
