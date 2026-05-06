import type { WireGroupState } from "./WireGroup";

type Wire = {
  id: number;
  groupId?: number;
  points: [number,number][];
  state?: "preview" | WireGroupState;
}

function createNewWire(id: number, points: [number,number][]): Wire {
  return {
    id: id,
    points: points,
    state: "preview",
  }
}

export {
  type Wire,
  createNewWire,
}