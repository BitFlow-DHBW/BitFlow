import type { Circuit, Gate, Connection } from "../types/circuit";

/**
 * Simple synchronous simulation:
 * - Build adjacency from outputs to inputs
 * - Evaluate gates in topological order (naive approach: iterate until stable or max steps)
 * - Gate semantics for builtins: AND, OR, NOT
 */

function evalGate(g: Gate, inputValues: boolean[]): boolean {
  switch (g.type) {
    case "AND":
      return inputValues.every(Boolean);
    case "OR":
      return inputValues.some(Boolean);
    case "NOT":
      return !inputValues[0];
    case "NAND":
      return !inputValues.every(Boolean);
    case "NOR":
      return !inputValues.some(Boolean);
    case "XOR":
      // XOR for two inputs; for more inputs, parity
      return inputValues.reduce((a, b) => Boolean(a) !== Boolean(b), false);
    case "XNOR":
      return !inputValues.reduce((a, b) => Boolean(a) !== Boolean(b), false);
    case "BUF":
      return Boolean(inputValues[0]);
    case "SWITCH":
      // SWITCH has no inputs; its output should be provided via overrides (handled outside)
      // If no override, default false
      return inputValues[0] ?? false;
    case "LED":
      // LED is a sink; return its input so UI can display it; does not drive others
      return Boolean(inputValues[0]);
    case "MUX2":
      // inputs: [a, b, sel]
      const a = Boolean(inputValues[0]);
      const b = Boolean(inputValues[1]);
      const sel = Boolean(inputValues[2]);
      return sel ? b : a;
    default:
      // fallback: if gate has at least one input, return first input; else false
      return inputValues[0] ?? false;
  }
}

export function simulate(circuit: Circuit, inputOverrides: Record<string, boolean> = {}) {
  const pinValues = new Map<string, boolean>();

  // apply overrides (e.g., switches)
  Object.entries(inputOverrides).forEach(([pinId, val]) => pinValues.set(pinId, val));

  const gateById = new Map(circuit.gates.map(g => [g.id, g]));
  const outMap = new Map<string, string[]>();
  circuit.connections.forEach(c => {
    outMap.set(c.fromPinId, [...(outMap.get(c.fromPinId) || []), c.toPinId]);
  });

  const MAX_STEPS = 40;
  for (let step = 0; step < MAX_STEPS; step++) {
    let changed = false;
    for (const gate of circuit.gates) {
      // collect input values for this gate (from pin ids)
      const inputVals = gate.inputs.map(pin => pinValues.get(pin.id) ?? false);
      // special-case: SWITCH outputs may be overridden by inputOverrides keyed by its output pin id
      const outVal = evalGate(gate, inputVals);
      for (const outPin of gate.outputs) {
        const prev = pinValues.get(outPin.id);
        // if override exists for this pin, keep override
        if (outPin.id in inputOverrides) {
          const overrideVal = inputOverrides[outPin.id];
          if (prev !== overrideVal) {
            pinValues.set(outPin.id, overrideVal);
            changed = true;
          }
        } else {
          if (prev !== outVal) {
            pinValues.set(outPin.id, outVal);
            changed = true;
          }
        }
        // propagate to connected pins
        const targets = outMap.get(outPin.id) || [];
        for (const t of targets) {
          if (pinValues.get(t) !== pinValues.get(outPin.id)) {
            pinValues.set(t, pinValues.get(outPin.id)!);
            changed = true;
          }
        }
      }
      // For LED (no outputs) we still set its input pin value in map so UI can read it
      if (gate.type === "LED" && gate.inputs.length > 0) {
        const inPin = gate.inputs[0];
        const val = inputVals[0] ?? false;
        if (pinValues.get(inPin.id) !== val) {
          pinValues.set(inPin.id, val);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  return pinValues;
}