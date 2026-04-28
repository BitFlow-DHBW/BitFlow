import React, { useRef } from "react";
import type { Gate } from "../types/circuit";
import { snapPoint } from "../utils/grid";

interface Props {
  gate: Gate;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onStartConnect: (gateId: string, pinId: string, clientX: number, clientY: number) => void;
  onToggleSwitch: (gateId: string) => void;
  signals: Record<string, boolean>;
}

export default function GateNode({ gate, onDrag, onDelete, onStartConnect, onToggleSwitch, signals }: Props) {
  const gRef = useRef<SVGGElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<{ sx: number; sy: number; gx: number; gy: number } | null>(null);
  const switchValue = Boolean(gate.outputs[0]?.value);
  const ledValue = Boolean(gate.inputs[0] && signals[gate.inputs[0].id]);

  const onPointerDown = (e: React.PointerEvent) => {
    // only start drag when clicking body, not pins
    if ((e.target as Element).getAttribute("data-pin")) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    startRef.current = { sx: e.clientX, sy: e.clientY, gx: gate.x, gy: gate.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (pointerIdRef.current !== e.pointerId) return;
    const s = startRef.current;
    if (!s) return;
    const nx = s.gx + (e.clientX - s.sx);
    const ny = s.gy + (e.clientY - s.sy);
    const snapped = snapPoint(nx, ny);

    if(gate.x === snapped.x && gate.y === snapped.y) return;


    onDrag(gate.id, snapped.x, snapped.y);
  };
  
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    pointerIdRef.current = null;
    startRef.current = null;
  };

  return (
    <g
      ref={gRef}
      transform={`translate(${gate.x}, ${gate.y})`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: "grab", userSelect: "none" }}
    >
      {/* Hintergrund des Gatters: fill und stroke reagieren auf dark */}
      <rect
        width={gate.width}
        height={gate.height}
        rx={6}
        ry={6}
        className="fill-white dark:fill-gray-800 stroke-gray-800 dark:stroke-gray-200"
        strokeWidth={1.5}
      />

      {/* Titel/Text */}
      <text
        x={gate.width / 2}
        y={20}
        textAnchor="middle"
        className="font-l font-bold fill-gray-900 dark:fill-white pointer-events-none"
      >
        {gate.meta?.name ?? gate.type}
      </text>

      {gate.type === "SWITCH" && (
        <foreignObject x={16} y={22} width={gate.width - 32} height={gate.height - 26}>
          <button
            type="button"
            aria-label={`Toggle switch ${gate.id}`}
            aria-pressed={switchValue}
            onPointerDown={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onToggleSwitch(gate.id);
            }}
            className={`w-full h-full rounded text-xs font-bold border ${
              switchValue
                ? "bg-green-500 border-green-700 text-white"
                : "bg-gray-200 border-gray-500 text-gray-800"
            }`}
            style={{ userSelect: "none" }}
          >
            {switchValue ? "ON" : "OFF"}
          </button>
        </foreignObject>
      )}

      {gate.type === "LED" && (
        <circle
          cx={gate.width / 2}
          cy={gate.height / 2 + 6}
          r={9}
          fill={ledValue ? "#22c55e" : "#4b5563"}
          stroke={ledValue ? "#166534" : "#111827"}
          strokeWidth={2}
          aria-label={`LED ${gate.id} ${ledValue ? "on" : "off"}`}
        />
      )}

      {/* Inputs */}
      {gate.inputs.map((pin, i) => {
        const px = (pin.offsetX ?? 0) * gate.width!;
        const py = (pin.offsetY ?? ((i + 1) / (gate.inputs.length + 1))) * gate.height!;
        return (
          <g key={pin.id} transform={`translate(${px}, ${py})`}>
            <circle
              cx={0}
              cy={0}
              r={6}
              className="fill-gray-100 dark:fill-gray-700 stroke-gray-800 dark:stroke-gray-200"
              style={{ fill: signals[pin.id] ? "#22c55e" : undefined }}
              data-pin="true"
              onPointerDown={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();

                onStartConnect(gate.id, pin.id, ev.clientX, ev.clientY);
              }}
            />
            <text
              x={-8}
              y={4}
              fontSize={10}
              textAnchor="end"
              className="fill-gray-600 dark:fill-gray-300"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {pin.name ?? "in"}
            </text>
          </g>
        );
      })}

      {/* Outputs */}
      {gate.outputs.map((pin, i) => {
        const px = (pin.offsetX ?? 1) * gate.width!;
        const py = (pin.offsetY ?? ((i + 1) / (gate.outputs.length + 1))) * gate.height!;
        return (
          <g key={pin.id} transform={`translate(${px}, ${py})`}>
            <circle
              cx={0}
              cy={0}
              r={6}
              className="fill-gray-100 dark:fill-gray-700 stroke-gray-800 dark:stroke-gray-200"
              style={{ fill: (signals[pin.id] ?? pin.value) ? "#22c55e" : undefined }}
              data-pin="true"
              onPointerDown={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                
                onStartConnect(gate.id, pin.id, ev.clientX, ev.clientY);
              }}
            />
            <text
              x={8}
              y={4}
              fontSize={10}
              textAnchor="start"
              className="fill-gray-600 dark:fill-gray-300"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {pin.name ?? "out"}
            </text>
          </g>
        );
      })}

      {/* Delete-Button (klein) */}
      <foreignObject x={gate.width - 36} y={4} width={32} height={18}>
        <div className="flex justify-end">
          <button
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();

              onDelete(gate.id);
            }}
            className="text-red-600 dark:text-red-400 bg-transparent"
            style={{ userSelect: "none" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </foreignObject>
    </g>
  );
}
