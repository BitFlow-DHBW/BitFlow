import { snapToGrid } from '../../../simulation/gateLibrary';
import type { Point } from '../../../types/circuit';

/* eslint-disable react-refresh/only-export-components */

interface WireCompProps {
  from: Point;
  to: Point;
  active?: boolean;
  preview?: boolean;
  selected?: boolean;
  onSelect?: (event: React.MouseEvent<SVGPathElement>) => void;
}

export function wirePath(from: Point, to: Point): string {
  const midX = snapToGrid(from.x + (to.x - from.x) / 2);
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
}

export function wireBranchPoint(from: Point, to: Point): Point {
  return {
    x: snapToGrid(from.x + (to.x - from.x) / 2),
    y: snapToGrid(from.y + (to.y - from.y) / 2),
  };
}

export function WireComp({ from, to, active = false, preview = false, selected = false, onSelect }: WireCompProps) {
  return (
    <path
      className={`wire ${active ? 'is-live' : ''} ${preview ? 'is-preview' : ''} ${selected ? 'is-selected' : ''}`}
      d={wirePath(from, to)}
      fill="none"
      onClick={onSelect}
    />
  );
}
