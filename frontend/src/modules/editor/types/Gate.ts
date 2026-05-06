import type { Input } from "./Input";
import type { Output } from "./Output";


type Gate = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  rotation: Rotation;
  inputs: Input[];
  outputs: Output[];
}

function newGate(
    id: number, 
    x: number = 0, 
    y: number = 0, 
    width: number = 2, 
    height: number = 2, 
    label: string = "", 
    rotation: Rotation = "East", 
    inputs: Input[] = [], 
    outputs: Output[] = [],
  ): Gate {
  return {
    id: id,
    x: Math.floor(x),
    y: Math.floor(y),
    width: width,
    height: height,
    label: label,
    rotation: rotation,
    inputs: inputs,
    outputs: outputs,
  }
}

type Rotation = "North" | "East" | "South" | "West";

const rotationNext: Record<Rotation, Rotation> = {
  North: "East",
  East: "South",
  South: "West",
  West: "North",
};

export {
  type Gate,
  newGate,
  type Rotation,
  rotationNext
}