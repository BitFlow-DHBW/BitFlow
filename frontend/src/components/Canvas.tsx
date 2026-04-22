import React, { useRef, useState } from "react";
import type { Circuit, Connection } from "../types/circuit";
import GateNode from "./GateNode";
import ConnectionView from "./Connection";
import { v4 as uuidv4 } from "uuid";
import { GRID_SIZE, snapPoint } from "../utils/grid";

interface Props {
  circuit: Circuit;
  onChange: (c: Circuit) => void;
  onDeleteGate: (id: string) => void;
  onMoveGate: (id: string, x: number, y: number) => void;
}

type DraggingState = {
  fromGateId: string;
  fromPinId: string;
  startClientX: number;
  startClientY: number;
  startSvgX: number;
  startSvgY: number;
} | null;

export default function Canvas({ circuit, onChange, onDeleteGate, onMoveGate }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<DraggingState>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const inv = ctm.inverse();
    const p = pt.matrixTransform(inv);
    return { x: p.x, y: p.y };
  }

  const handleStartConnect = (gateId: string, pinId: string, clientX: number, clientY: number) => {
    let svgPt = clientToSvg(clientX, clientY);
    svgPt = snapPoint(svgPt.x, svgPt.y);

    setDragging({
      fromGateId: gateId,
      fromPinId: pinId,
      startClientX: clientX,
      startClientY: clientY,
      startSvgX: svgPt.x,
      startSvgY: svgPt.y
    });
    setMousePos({ x: svgPt.x, y: svgPt.y });
  };

  const findNearestPin = (x: number, y: number, maxDist = 12) => {
    let best: { gateId: string; pinId: string; dx: number; dy: number; dist: number } | null = null;
    for (const g of circuit.gates) {
      for (const p of [...g.inputs, ...g.outputs]) {
        const ox = (p.offsetX ?? (p.type === "input" ? 0 : 1)) * g.width;
        const oy = (p.offsetY ?? 0.5) * g.height;
        const px = g.x + ox;
        const py = g.y + oy;
        const dx = px - x;
        const dy = py - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= maxDist && (!best || dist < best.dist)) {
          best = { gateId: g.id, pinId: p.id, dx, dy, dist };
        }
      }
    }
    return best;
  };

  function clientToSvgSnapped(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return snapPoint(clientX, clientY);
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return snapPoint(clientX, clientY);
    const inv = ctm.inverse();
    const p = pt.matrixTransform(inv);
    return snapPoint(p.x, p.y);
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const svgPt = clientToSvgSnapped(e.clientX, e.clientY);
    setMousePos({ x: svgPt.x, y: svgPt.y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const svgPt = clientToSvgSnapped(e.clientX, e.clientY);
    const snap = findNearestPin(svgPt.x, svgPt.y, 14);
    if (snap) {
      // avoid connecting pin to itself or same gate same pin
      if (!(dragging.fromGateId === snap.gateId && dragging.fromPinId === snap.pinId)) {
        const conn: Connection = {
          id: uuidv4(),
          fromGateId: dragging.fromGateId,
          fromPinId: dragging.fromPinId,
          toGateId: snap.gateId,
          toPinId: snap.pinId
        };
        onChange({ ...circuit, connections: [...circuit.connections, conn] });
      }
    }
    setDragging(null);
    setMousePos(null);
  };

  return (
    <div className="flex-1 relative">
      <svg ref={svgRef} className="w-full h-full no-select" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} style={{ minHeight: 600 }}>
        <defs>
          <pattern id="canvas_pattern" x="0" y="0" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <>
              <circle id="gridcircletl" r="1" cx="0" cy="0" fill="grey" stroke="grey" strokeWidth="0.5"/>
              <circle id="gridcirclebl" r="1" cx="0" cy={GRID_SIZE} fill="grey" stroke="grey" strokeWidth="0.5"/>
              <circle id="gridcircletr" r="1" cx={GRID_SIZE} cy="0" fill="grey" stroke="grey" strokeWidth="0.5"/>
              <circle id="gridcirclebr" r="1" cx={GRID_SIZE} cy={GRID_SIZE} fill="grey" stroke="grey" strokeWidth="0.5"/>
            </>
          </pattern>
        </defs>
        <rect width="100%" height="100%" x="0" y="0" stroke="black" strokeWidth="2" fill="url(#canvas_pattern)"/>

        {/* connections */}
        <g>
          {circuit.connections.map(conn => (
            <ConnectionView key={conn.id} conn={conn} circuit={circuit} />
          ))}
        </g>

        {/* live dragging line */}
        {dragging && mousePos && (
          <polyline
            points={`${dragging.startSvgX},${dragging.startSvgY} ${mousePos.x},${dragging.startSvgY} ${mousePos.x},${mousePos.y}`}
            fill="none"
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {/* gates */}
        <g>
          {circuit.gates.map(g => (
            <GateNode
              key={g.id}
              gate={g}
              onDrag={onMoveGate}
              onDelete={onDeleteGate}
              onStartConnect={handleStartConnect}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
