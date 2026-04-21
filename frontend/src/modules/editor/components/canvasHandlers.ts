import { createNewWire, type Wire } from "../types/Wire";
import { newGate, rotationNext, type Gate } from "../types/Gate";
import type { WireGroup } from "../types/WireGroup";
import type { Input } from "../types/Input";
import type { Output } from "../types/Output";

export function createCanvasHandlers(state: any) {

  const {
    getGridCoords,
    gatePinConfig,
    updateWireStart,
    resetWireDragging
  } = state.helpers;

  const {
    wires,
    cacheWires,
    wireGroups,
    gates,
    newWireId,
    offset,
    oldMousePosition,
    gateDraggingId,
    wireDraggingId,
    wireDraggingStart
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
    setWireDraggingId,
    setWireDraggingStart
  } = state.setters;

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

    const newGateObj = newGate(newId, x, y, width, height, type, undefined, inputs, outputs);
    setGates((prev: Gate[]) => [...prev, newGateObj]);
  };

  const handleDragOver = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const { x, y } = getGridCoords(e);

    const _newWireId = newWireId;
    setNewWireId(_newWireId + 1);

    setCacheWires((wires: Wire[]) => [...wires, createNewWire(_newWireId, [[x, y]])]);

    setWireDraggingId((prev: any) => [...(prev ?? []), { wireId: _newWireId }]);
    updateWireStart(_newWireId, x, y);
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

    handleNewWiresInput(gate, _newWireId);

    _newWireId += gate.inputs.filter((input: Input, inputId: number) => {
      return wireGroups.some((wg: WireGroup) =>
        wg.inputs.some(inputArr =>
          inputArr[0] === input.gateId && inputArr[1] === inputId
        )
      );
    }).length;

    handleNewWiresOutput(gate, _newWireId);

    _newWireId += gate.outputs.filter((output: Output, outputId: number) => {
      return wireGroups.some((wg: WireGroup) =>
        wg.outputs.some(outputArr =>
          outputArr[0] === output.gateId && outputArr[1] === outputId
        )
      );
    }).length;

    setNewWireId(_newWireId);
  };

  const handleNewWiresInput = (gate: Gate, _newWireId: number) => {
    gate.inputs.forEach((input: Input, inputId: number) => {
      if (!wireGroups.some((wg: WireGroup) =>
        wg.inputs.some(inputArr =>
          inputArr[0] === input.gateId && inputArr[1] === inputId
        )
      )) return;

      const _tempWireId = _newWireId + inputId;
      const _tempWireX = gate.x + input.xOffset!;
      const _tempWireY = gate.y + input.yOffset!;

      if (wires.some((w: Wire) => w.id === _tempWireId)) return;

      setCacheWires((wires: Wire[]) => [...wires, createNewWire(_tempWireId, [[_tempWireX, _tempWireY]])]);
      setWireDraggingId((prev: any) => [...(prev ?? []), { wireId: _tempWireId, type: "input", nodeId: inputId }]);
      updateWireStart(_tempWireId, _tempWireX, _tempWireY);
    });
  };

  const handleNewWiresOutput = (gate: Gate, _newWireId: number) => {
    gate.outputs.forEach((output: Output, outputId: number) => {
      if (!wireGroups.some((wg: WireGroup) =>
        wg.outputs.some(outputArr =>
          outputArr[0] === output.gateId && outputArr[1] === outputId
        )
      )) return;

      const _tempWireId = _newWireId + outputId;
      const _tempWireX = gate.x + output.xOffset!;
      const _tempWireY = gate.y + output.yOffset!;

      if (wires.some((w: Wire) => w.id === _tempWireId)) return;

      setCacheWires((wires: Wire[]) => [...wires, createNewWire(_tempWireId, [[_tempWireX, _tempWireY]])]);
      setWireDraggingId((prev: any) => [...(prev ?? []), { wireId: _tempWireId, type: "output", nodeId: outputId }]);
      updateWireStart(_tempWireId, _tempWireX, _tempWireY);
    });
  };

  const handleMouseDownInput = (e: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const polyline = e.currentTarget;
    const x = parseInt(polyline.getAttribute("pos-x")!);
    const y = parseInt(polyline.getAttribute("pos-y")!);

    const _newWireId = newWireId;
    setNewWireId(_newWireId + 1);

    setCacheWires((wires: Wire[]) => [...wires, createNewWire(_newWireId, [[x, y]])]);

    setWireDraggingId((prev: any) => [...(prev ?? []), { wireId: _newWireId }]);
    updateWireStart(_newWireId, x, y);
  };

  const handleMouseDownNode = (e: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const circle = e.currentTarget;
    const x = parseInt(circle.getAttribute("pos-x")!);
    const y = parseInt(circle.getAttribute("pos-y")!);

    const _newWireId = newWireId;
    setNewWireId(_newWireId + 1);

    setCacheWires((wires: Wire[]) => [...wires, createNewWire(_newWireId, [[x, y]])]);

    setWireDraggingId((prev: any) => [...(prev ?? []), { wireId: _newWireId }]);
    updateWireStart(_newWireId, x, y);

    setNewWireId(_newWireId + 1);
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
      dragWire(wireDraggingId[wireDraggingId.length - 1].wireId, x, y);
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
            dragWire(value.wireId, newGateX + input.xOffset, newGateY + input.yOffset);
            break;

          case "output":
            const output = gate.outputs[value.nodeId];
            if (output.xOffset === undefined || output.yOffset === undefined) return;
            dragWire(value.wireId, newGateX + output.xOffset, newGateY + output.yOffset);
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

  const dragWire = (wireId: number, targetX: number, targetY: number) => {
    setCacheWires((cacheWires: Wire[]) =>
      cacheWires
        .filter((wire: Wire) => wire.points.length > 0)
        .map((wire: Wire) => {
          if (wire.id !== wireId) return wire;
          if (!wireDraggingStart.has(wire.id)) return wire;

          const [x0, y0] = [wireDraggingStart.get(wire.id)!.x, wireDraggingStart.get(wire.id)!.y];
          const [x1, y1] = [targetX, targetY];

          let newPoints: [number, number][];

          if (x0 === x1 && y0 === y1) {
            newPoints = [[x0, y0]];
          } else if (x0 === x1 || y0 === y1) {
            newPoints = [
              [x0, y0],
              [x1, y1]
            ];
          } else {
            if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) {
              newPoints = [
                [x0, y0],
                [x1, y0],
                [x1, y1]
              ];
            } else {
              newPoints = [
                [x0, y0],
                [x0, y1],
                [x1, y1]
              ];
            }
          }

          return {
            ...wire,
            points: newPoints
          };
        })
    );
  };

  const deleteWire = (wireId: number) => {
    let newCacheWires = cacheWires.filter((wire: Wire) => wire.id !== wireId);
    setCacheWires(newCacheWires);
  };

  return {
    handleDrop,
    handleDragOver,
    handleMouseDown,
    handleMouseDownGate,
    handleMouseDownInput,
    handleMouseDownNode,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    deleteWire
  };
}
