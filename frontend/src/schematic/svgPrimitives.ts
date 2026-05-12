import { symbolGeometry } from './symbolGeometry';
import { pinPosition } from '../simulation/gateLibrary';
import type { Gate, Point } from '../types/circuit';

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pinStubs(gate: Gate): string {
  return [...gate.inputs, ...gate.outputs]
    .map((pin) => {
      const point = pinPosition(gate, pin);
      const stub = pin.direction === 'input' ? { x1: point.x, x2: point.x + 12 } : { x1: point.x - 12, x2: point.x };
      return `<line class="pin-stub" x1="${stub.x1}" y1="${point.y}" x2="${stub.x2}" y2="${point.y}"/><circle class="pin-dot" cx="${point.x}" cy="${point.y}" r="2.5"/>`;
    })
    .join('');
}

function labelText(gate: Gate, x: number, y: number): string {
  return `<text class="component-label" x="${x}" y="${y}">${esc(gate.label ?? gate.type)}</text>`;
}

function pinLabels(gate: Gate): string {
  return [...gate.inputs, ...gate.outputs]
    .map((pin) => {
      const point = pinPosition(gate, pin);
      const x = pin.direction === 'input' ? point.x + 16 : point.x - 16;
      const anchor = pin.direction === 'input' ? 'start' : 'end';
      return `<text class="pin-label" x="${x}" y="${point.y + 4}" text-anchor="${anchor}">${esc(pin.label ?? pin.name ?? '')}</text>`;
    })
    .join('');
}

function blockSvg(gate: Gate, operator?: string): string {
  const g = symbolGeometry(gate);
  return `
    ${pinStubs(gate)}
    <rect class="symbol-body logic-body" x="${g.bodyX}" y="${g.bodyY}" width="${g.bodyWidth}" height="${g.bodyHeight}" rx="4"/>
    ${operator ? `<text class="symbol-operator" x="${gate.x + g.width / 2}" y="${gate.y + g.height / 2 + 5}">${esc(operator)}</text>` : ''}
    ${pinLabels(gate)}
    ${labelText(gate, gate.x + g.width / 2, gate.y - 6)}
  `;
}

export function componentSymbolSvg(gate: Gate, _active = false): string {
  switch (gate.type) {
    case 'AND':
      return blockSvg(gate, 'AND');
    case 'OR':
      return blockSvg(gate, 'OR');
    case 'XOR':
      return blockSvg(gate, 'XOR');
    case 'NOT':
      return blockSvg(gate, 'NOT');
    case 'DFF':
      return blockSvg(gate, 'DFF');
    case 'TFF':
      return blockSvg(gate, 'TFF');
    case 'JKFF':
      return blockSvg(gate, 'JK');
    case 'INPUT':
    case 'OUTPUT':
    case 'SWITCH':
    case 'LED':
    case 'CLOCK':
    case 'VCC':
    case 'GND':
    case 'GENERIC':
    case 'CUSTOM':
    default:
      return blockSvg(gate);
  }
}

export function orthogonalPath(from: Point, to: Point): string {
  const midX = from.x + (to.x - from.x) / 2;
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
}

export function escapeSvgText(value: string): string {
  return esc(value);
}
