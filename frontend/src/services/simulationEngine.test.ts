import { builtinGates } from "../data/builtinGates";
import type { Circuit, Gate } from "../types/circuit";
import { simulate } from "./simulationEngine";

function connection(from: Gate, to: Gate, toPinIndex = 0) {
  return {
    id: `${from.id}_${to.id}_${toPinIndex}`,
    fromGateId: from.id,
    fromPinId: from.outputs[0].id,
    toGateId: to.id,
    toPinId: to.inputs[toPinIndex].id
  };
}

describe("simulate", () => {
  it("passes a SWITCH value directly to an LED", () => {
    const sw = builtinGates.SWITCH("sw");
    const led = builtinGates.LED("led");
    sw.outputs[0].value = true;

    const circuit: Circuit = {
      gates: [sw, led],
      connections: [connection(sw, led)]
    };

    const result = simulate(circuit);

    expect(result.get(sw.outputs[0].id)).toBe(true);
    expect(result.get(led.inputs[0].id)).toBe(true);
  });

  it("evaluates SWITCH + SWITCH -> AND -> LED", () => {
    const a = builtinGates.SWITCH("a");
    const b = builtinGates.SWITCH("b");
    const and = builtinGates.AND("and");
    const led = builtinGates.LED("led");
    a.outputs[0].value = true;
    b.outputs[0].value = false;

    const circuit: Circuit = {
      gates: [a, b, and, led],
      connections: [
        connection(a, and, 0),
        connection(b, and, 1),
        connection(and, led)
      ]
    };

    expect(simulate(circuit).get(led.inputs[0].id)).toBe(false);

    b.outputs[0].value = true;

    expect(simulate(circuit).get(led.inputs[0].id)).toBe(true);
  });

  it("evaluates SWITCH -> NOT -> LED", () => {
    const sw = builtinGates.SWITCH("sw");
    const not = builtinGates.NOT("not");
    const led = builtinGates.LED("led");
    sw.outputs[0].value = true;

    const circuit: Circuit = {
      gates: [sw, not, led],
      connections: [
        connection(sw, not),
        connection(not, led)
      ]
    };

    expect(simulate(circuit).get(led.inputs[0].id)).toBe(false);

    sw.outputs[0].value = false;

    expect(simulate(circuit).get(led.inputs[0].id)).toBe(true);
  });
});
