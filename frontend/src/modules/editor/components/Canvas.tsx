import { useEffect, useState } from "react";
import WireComp from "./canvasElements/WireComp";
import GateComp from "./canvasElements/GateComp";
import { createNewWire, type Wire } from "../types/Wire";
import { newGate, rotationNext, type Gate } from "../types/Gate";
import { canvasLeft, canvasTop, canvasWidth, canvasHeight, gridSize } from "./constants";
import { calculateWireGroups } from "./WireGroup";
import type { WireGroup } from "../types/WireGroup";
import type { Input } from "../types/Input";
import type { Output } from "../types/Output";

import { createCanvasHandlers } from "./canvasHandlers";

function Canvas() {
  const useDotPattern: boolean = false;
  const [newWireId, setNewWireId] = useState<number>(0);
  const [cacheWires, setCacheWires] = useState<Wire[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [wireGroups, setWireGroups] = useState<WireGroup[]>([]);
  const [newGateId, setNewGateId] = useState<number>(0);
  const [gates, setGates] = useState<Gate[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [oldMousePosition, setOldMousePosition] = useState({ x: -1, y: -1 });

  const [gateDraggingId, setGateDraggingId] = useState<number[] | null>(null);
  const [wireDraggingId, setWireDraggingId] = useState<
    { wireId: number; type?: "input" | "output"; nodeId?: number }[] | null
  >(null);
  const [wireDraggingStart, setWireDraggingStart] = useState<
    Map<number, { x: number; y: number }>
  >(new Map());

  const gatePinConfig: Record<string, { inputs: number; outputs: number }> = {
    AND: { inputs: 4, outputs: 1 },
    OR: { inputs: 2, outputs: 1 },
    XOR: { inputs: 3, outputs: 1 },
    FlipFlop: { inputs: 1, outputs: 1 },
    Add: { inputs: 3, outputs: 2 },
  };

  useEffect(() => {
    const newGroups = calculateWireGroups(cacheWires, gates);
    setWireGroups(newGroups);

    const newWires = cacheWires.map((wire: Wire) => {
      const group = newGroups.find((wireGroup: WireGroup) =>
        wireGroup.wires.find((wireInGroup: Wire) => wireInGroup.id === wire.id)
      );
      if (!group) return wire;
      if (group.state === wire.state) return wire;

      return {
        ...wire,
        state: wire.state ?? group.state,
      };
    });
    setWires(newWires);
  }, [cacheWires, gates]);

  function updateWireStart(wireId: number, x: number, y: number) {
    setWireDraggingStart((prev) => {
      if (prev.has(wireId)) return prev;

      const next = new Map(prev);
      next.set(wireId, { x, y });

      return next;
    });
  }

  function resetWireDragging() {
    setWireDraggingId(null);
    setWireDraggingStart(new Map());
  }

  const getGridCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / gridSize);
    const y = Math.round((e.clientY - rect.top) / gridSize);
    return { x, y };
  };

  const handlers = createCanvasHandlers({
    gridSize,

    values: {
      wires,
      cacheWires,
      wireGroups,
      gates,
      newWireId,
      offset,
      oldMousePosition,
      gateDraggingId,
      wireDraggingId,
      wireDraggingStart,
    },

    setters: {
      setNewWireId,
      setCacheWires,
      setWires,
      setWireGroups,
      setGates,
      setOffset,
      setOldMousePosition,
      setGateDraggingId,
      setWireDraggingId,
      setWireDraggingStart,
    },

    helpers: {
      getGridCoords,
      gatePinConfig,
      updateWireStart,
      resetWireDragging,
    },
  });

  return (
    <svg
      id="svg_canvas"
      className="absolute"
      style={{ left: canvasLeft, top: canvasTop }}
      width={canvasWidth}
      height={canvasHeight}
      tabIndex={0}
      onDrop={handlers.handleDrop}
      onDragOver={handlers.handleDragOver}
      onMouseMove={handlers.handleMouseMove}
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onKeyDown={handlers.handleKeyDown}
    >
      <defs>
        <pattern
          id="canvas_pattern"
          x="0"
          y="0"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          {useDotPattern ? (
            <>
              <circle id="gridcircletl" r="1" cx="0" cy="0" fill="grey" stroke="grey" strokeWidth="0.5" />
              <circle id="gridcirclebl" r="1" cx="0" cy={gridSize} fill="grey" stroke="grey" strokeWidth="0.5" />
              <circle id="gridcircletr" r="1" cx={gridSize} cy="0" fill="grey" stroke="grey" strokeWidth="0.5" />
              <circle id="gridcirclebr" r="1" cx={gridSize} cy={gridSize} fill="grey" stroke="grey" strokeWidth="0.5" />
            </>
          ) : (
            <rect width="100%" height="100%" fill="none" stroke="grey" strokeWidth="0.5" />
          )}
        </pattern>
      </defs>

      <rect width="100%" height="100%" x="0" y="0" stroke="black" strokeWidth="2" fill="url(#canvas_pattern)" />

      <g id="wire_group">
        {wires.map((wire: Wire) => (
          <WireComp
            wire={wire}
            key={wire.id}
            remove={() => handlers.deleteWire(wire.id)}
            onMouseDownNode={(e) => handlers.handleMouseDownNode(e)}
          />
        ))}
      </g>

      <g id="gate_group">
        {gates.map((gate: Gate, index: number) => (
          <GateComp
            gate={gate}
            key={index}
            onMouseDownGate={(e: any) => handlers.handleMouseDownGate(e, index)}
            onMouseDownInput={(e: any) => handlers.handleMouseDownInput(e)}
          />
        ))}
      </g>

      <g id="input_group"></g>
      <g id="output_group"></g>
    </svg>
  );
}

export default Canvas;
