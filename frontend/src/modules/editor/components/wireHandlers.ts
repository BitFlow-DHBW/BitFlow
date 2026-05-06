import { createNewWire, type Wire } from "../types/Wire";
import type { Gate } from "../types/Gate";
import type { WireGroup } from "../types/WireGroup";
import type { Input } from "../types/Input";
import type { Output } from "../types/Output";

export function createWireHandlers(state: any) {
  const {
    wires,
    cacheWires,
    wireGroups,
    gates,
    newWireId,
    wireDraggingId,
    wireDraggingStart
  } = state.values;

  const {
    setNewWireId,
    setCacheWires,
    setWireDraggingId,
    setWireDraggingStart
  } = state.setters;

  const {
    updateWireStart,
    getGridCoords,
    resetWireDragging
  } = state.helpers;

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
    handleMouseDown,
    handleMouseDownInput,
    handleMouseDownNode,
    handleNewWiresInput,
    handleNewWiresOutput,
    dragWire,
    deleteWire
  };
}
