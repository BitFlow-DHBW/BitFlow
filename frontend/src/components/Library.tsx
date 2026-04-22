import React from "react";
import { builtinGates, type builtinGateTypes } from "../data/builtinGates";
import type { Gate } from "../types/circuit";

interface Props {
  onCreate: (gate: Gate) => void;
}

export default function Library({ onCreate }: Props) {
  return (
    <div className="p-2 border-r dark:border-gray-700">
      <h3 className="font-semibold mb-2">Library</h3>
      <div className="flex flex-col gap-2">
        {Object.keys(builtinGates).map((k: string) => (
          <button
            key={k}
            className="p-2 bg-white dark:bg-gray-700 rounded shadow-sm text-left"
            onClick={() => onCreate(builtinGates[k as builtinGateTypes](`${k}_${Date.now()}`, 50, 50))}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
