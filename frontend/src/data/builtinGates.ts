// src/data/builtinGates.ts
import type { Gate } from "../types/circuit";
import { GRID_SIZE, snapValue } from "../utils/grid";

export type builtinGateTypes = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR" | "BUF" | "SWITCH" | "LED" | "MUX2";

/**
 * Builtin gate factories.
 * Width/height chosen as multiples of GRID_SIZE (e.g., 120 = 6 * 20).
 * Pin offsets chosen so absolute pin positions fall on grid nodes when gate height is multiple of GRID_SIZE.
 */

export const builtinGates = {
  AND: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "AND",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_in1", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_in2", type: "input", offsetX: 0, offsetY: 0.75 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "AND" }
  }),

  OR: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "OR",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_in1", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_in2", type: "input", offsetX: 0, offsetY: 0.75 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "OR" }
  }),

  NOT: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "NOT",
    x: snapValue(x),
    y: snapValue(y),
    width: 4 * GRID_SIZE,
    height: 2 * GRID_SIZE,
    inputs: [{ id: id + "_in", type: "input", offsetX: 0, offsetY: 0.5 }],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "NOT" }
  }),

  NAND: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "NAND",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_in1", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_in2", type: "input", offsetX: 0, offsetY: 0.75 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "NAND" }
  }),

  NOR: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "NOR",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_in1", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_in2", type: "input", offsetX: 0, offsetY: 0.75 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "NOR" }
  }),

  XOR: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "XOR",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_in1", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_in2", type: "input", offsetX: 0, offsetY: 0.75 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "XOR" }
  }),

  XNOR: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "XNOR",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_in1", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_in2", type: "input", offsetX: 0, offsetY: 0.75 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "XNOR" }
  }),

  BUF: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "BUF",
    x: snapValue(x),
    y: snapValue(y),
    width: 4 * GRID_SIZE,
    height: 2 * GRID_SIZE,
    inputs: [{ id: id + "_in", type: "input", offsetX: 0, offsetY: 0.5 }],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "BUF" }
  }),

  SWITCH: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "SWITCH",
    x: snapValue(x),
    y: snapValue(y),
    width: 4 * GRID_SIZE,
    height: 2 * GRID_SIZE,
    inputs: [],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "SWT" }
  }),

  LED: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "LED",
    x: snapValue(x),
    y: snapValue(y),
    width: 4 * GRID_SIZE,
    height: 2 * GRID_SIZE,
    inputs: [{ id: id + "_in", type: "input", offsetX: 0, offsetY: 0.5 }],
    outputs: [],
    meta: { name: "LED" }
  }),

  MUX2: (id: string, x = 100, y = 100): Gate => ({
    id,
    type: "MUX2",
    x: snapValue(x),
    y: snapValue(y),
    width: 6 * GRID_SIZE,
    height: 4 * GRID_SIZE,
    inputs: [
      { id: id + "_a", name: "a", type: "input", offsetX: 0, offsetY: 0.25 },
      { id: id + "_b", name: "b", type: "input", offsetX: 0, offsetY: 0.75 },
      { id: id + "_sel", name: "sel", type: "input", offsetX: 0.5, offsetY: 1 }
    ],
    outputs: [{ id: id + "_out", type: "output", offsetX: 1, offsetY: 0.5 }],
    meta: { name: "MUX2" }
  })
} as const;
