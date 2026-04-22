// src/utils/grid.ts
export const GRID_SIZE = 20;

export function snapValue(v: number, grid = GRID_SIZE) {
  return Math.round(v / grid) * grid;
}

export function snapPoint(x: number, y: number, grid = GRID_SIZE) {
  return { x: snapValue(x, grid), y: snapValue(y, grid) };
}
