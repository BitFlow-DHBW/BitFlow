import type { Wire } from "../types/Wire";
import type { Gate } from "../types/Gate";
import type { WireGroup } from "../types/WireGroup";
import type { Input } from "../types/Input";
import type { Output } from "../types/Output";
import { rotationNext } from "../types/Gate";

import { createWireHandlers } from "./wireHandlers";

export function createCanvasHandlers(state: any) {
  const {
    wires,
    cacheWires,
    wireGroups,
    gates,
    newWireId,
    offset,
    oldMousePosition,
    gateDraggingId,
    wireDraggingId
  } = state.values;

  const {
    setNewWireId,
    setCacheWires,
    setWires,
    setWireGroups,
    setGates,
    setOffset,
    setOldMousePosition,
    setGateDraggingId,
    setWireDraggingId
  } = state.setters;

  const {
    getGridCoords,
    gatePinConfig,
    updateWireStart,
    resetWireDragging
  } = state.helpers;

  
  const wireHandlers = createWireHandlers(state);

  
  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { x, y } = getGridCoords(e);

    const type = e.dataTransfer.getData("gateType");
    if (!type) return;

    const newId = gates.length;

    const config = gatePinConfig[type] || { inputs: 0, outputs: 0 };

    const inputs = Array.from({ length: config.inputs }, () => ({ gateId: newId }));
    const outputs = Array.from({ length: config.outputs }, () => ({ gateId: newId }));

    const width = 3;
    const height = Math.max(2, inputs.length + 1, outputs.length + 1);

    const newGateObj = {
      ...state.createGate(newId, x, y, width, height, type, undefined, inputs, outputs)
    };

    setGates((prev: Gate[]) => [...prev, newGateObj]);
  };

  const handleDragOver = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
  };

  const handleMouseDownGate = (e: any, gateId: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setGateDraggingId((prev: any) => [...(prev ?? []), gateId]);

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setOffset({ x: mouseX / state.gridSize, y: mouseY / state.gridSize });

    let _newWireId = newWireId;

    const gate = gates.find((g: Gate) => g.id === gateId);
    if (!gate) return;

    // Wires für Inputs erzeugen
    wireHandlers.handleNewWiresInput(gate, _newWireId);

    _newWireId += gate.inputs.filter((input: Input, inputId: number) => {
      return wireGroups.some((wg: WireGroup) =>
        wg.inputs.some(inputArr =>
          inputArr[0] === input.gateId && inputArr[1] === inputId
        )
      );
    }).length;

    // Wires für Outputs erzeugen
    wireHandlers.handleNewWiresOutput(gate, _newWireId);

    _newWireId += gate.outputs.filter((output: Output, outputId: number) => {
      return wireGroups.some((wg: WireGroup) =>
        wg.outputs.some(outputArr =>
          outputArr[0] === output.gateId && outputArr[1] === outputId
        )
      );
    }).length;

    setNewWireId(_newWireId);
  };

 
  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    console.log(e.code);
    e.stopPropagation();

    switch (e.code) {
      case "KeyR":
        if (!gateDraggingId) return;
        setGates((gates: Gate[]) =>
          gates.map((gate: Gate) => {
            if (!gateDraggingId.includes(gate.id)) return gate;

            return {
              ...gate,
              rotation: rotationNext[gate.rotation]
            };
          })
        );
        break;

      case "Delete":
        if (!gateDraggingId) return;

        setGates((gates: Gate[]) =>
          gates.filter((gate: Gate) => !gateDraggingId.includes(gate.id))
        );

        if (wireDraggingId) {
          const newCacheWires = cacheWires
            .filter((wire: Wire) => wire.points.length > 1 &&
              !wireDraggingId.some(
                (v: { wireId: number; type?: "input" | "output"; nodeId?: number }) =>
                  v.wireId === wire.id
              )
            );

          setCacheWires(newCacheWires);
          resetWireDragging();
        }
        break;
    }
  };

 
  const handleMouseMove = (e: any) => {
    e.stopPropagation();

    const { x, y } = getGridCoords(e);

    if (oldMousePosition.x === x && oldMousePosition.y === y) return;
    setOldMousePosition({ x, y });

    if (gateDraggingId !== null) {
      moveGate(x, y);
    } else if (wireDraggingId) {
      wireHandlers.dragWire(wireDraggingId[wireDraggingId.length - 1].wireId, x, y);
    }
  };

  const handleMouseUp = () => {
    if (gateDraggingId !== null) {
      setGateDraggingId(null);
    }

    if (wireDraggingId) {
      const newCacheWires = cacheWires
        .filter((wire: Wire) => wire.points.length > 1)
        .map((wire: Wire) =>
          wireDraggingId.some(
            (v: { wireId: number; type?: "input" | "output"; nodeId?: number }) =>
              v.wireId === wire.id
          )
            ? { ...wire, state: undefined }
            : wire
        );

      setCacheWires(newCacheWires);
      resetWireDragging();
    }
  };

  const moveGate = (newX: number, newY: number) => {
    const newGates = gates.map((gate: Gate) => {
      if (!gateDraggingId?.includes(gate.id)) return gate;

      const newGateX = Math.round(newX - offset.x);
      const newGateY = Math.round(newY - offset.y);

      wireDraggingId?.forEach((value: any) => {
        if (!value.type || value.nodeId === undefined) return;

        switch (value.type) {
          case "input":
            const input = gate.inputs[value.nodeId];
            if (input.xOffset === undefined || input.yOffset === undefined) return;
            wireHandlers.dragWire(value.wireId, newGateX + input.xOffset, newGateY + input.yOffset);
            break;

          case "output":
            const output = gate.outputs[value.nodeId];
            if (output.xOffset === undefined || output.yOffset === undefined) return;
            wireHandlers.dragWire(value.wireId, newGateX + output.xOffset, newGateY + output.yOffset);
            break;
        }
      });

      return {
        ...gate,
        x: newGateX,
        y: newGateY
      };
    });

    setGates(newGates);
  };


  return {
    // Gate
    handleDrop,
    handleDragOver,
    handleMouseDownGate,

    // Wire
    handleMouseDown: wireHandlers.handleMouseDown,
    handleMouseDownInput: wireHandlers.handleMouseDownInput,
    handleMouseDownNode: wireHandlers.handleMouseDownNode,
    deleteWire: wireHandlers.deleteWire,

    // Mouse
    handleMouseMove,
    handleMouseUp,

    // Keyboard
    handleKeyDown
  };
}
