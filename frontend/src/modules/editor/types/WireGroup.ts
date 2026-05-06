import type { Wire } from "./Wire";

type WireGroupState = "error" | "high" | "low"

type WireGroup = {
  id: number;
  state: WireGroupState;
  wires: Wire[];
  inputs: [gateId: number, inputId: number][]
  outputs: [gateId: number, outputId: number][]
}

export {
  type WireGroup,
  type WireGroupState
}