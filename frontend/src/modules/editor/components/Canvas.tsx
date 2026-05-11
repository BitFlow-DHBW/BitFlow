import { useEffect, useMemo, useRef, useState } from 'react';
import { GateComp } from './GateComp';
import { WireComp, wireBranchPoint } from './WireComp';
import { isInteractiveSourceGate } from '../../../schematic/symbolGeometry';
import { GRID_SIZE } from '../../../simulation/gateLibrary';
import { createPinLookup, getWirePoints, normalizeWireEndpoint, resolveWireEndpoint } from '../../../simulation/wireUtils';
import type {
  Circuit,
  DragState,
  EditorMode,
  EditorTool,
  Gate,
  Pin,
  Point,
  SignalState,
  WireDraft,
  WireEndpoint,
} from '../../../types/circuit';

interface CanvasProps {
  circuit: Circuit;
  signals: SignalState;
  mode: EditorMode;
  selectedTool: EditorTool | null;
  selectedGateId: string | null;
  selectedWireId: string | null;
  dragState: DragState | null;
  wireDraft: WireDraft | null;
  onCanvasClick: (point: Point) => void;
  onToolDrop: (tool: EditorTool, point: Point) => void;
  onGateDragStart: (gate: Gate, point: Point) => void;
  onDragMove: (point: Point) => void;
  onDragEnd: () => void;
  onSelectGate: (gateId: string | null) => void;
  onSelectWire: (wireId: string | null) => void;
  onWireStart: (endpoint: WireEndpoint, point: Point) => void;
  onWireEnd: (endpoint: WireEndpoint) => void;
  onWirePreview: (point: Point) => void;
  onWireCancel: () => void;
  onToggleInput: (gateId: string) => void;
}

const FALLBACK_WIDTH = 1280;
const FALLBACK_HEIGHT = 760;

export function Canvas({
  circuit,
  signals,
  mode,
  selectedTool,
  selectedGateId,
  selectedWireId,
  dragState,
  wireDraft,
  onCanvasClick,
  onToolDrop,
  onGateDragStart,
  onDragMove,
  onDragEnd,
  onSelectGate,
  onSelectWire,
  onWireStart,
  onWireEnd,
  onWirePreview,
  onWireCancel,
  onToggleInput,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gatePointerRef = useRef<{ gateId: string; point: Point; moved: boolean } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const updateSize = () => {
      const rect = svg.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const pinMap = useMemo(() => createPinLookup(circuit), [circuit]);

  function getPoint(event: React.PointerEvent<SVGElement> | React.MouseEvent<SVGElement> | React.DragEvent<SVGElement>): Point {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };

    const svgPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return {
      x: Math.max(0, Math.min(canvasSize.width, svgPoint.x)),
      y: Math.max(0, Math.min(canvasSize.height, svgPoint.y)),
    };
  }

  function readDraggedTool(event: React.DragEvent<SVGSVGElement>): EditorTool | null {
    const raw = event.dataTransfer.getData('application/x-bitflow-tool');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as EditorTool;
      if (parsed.kind === 'builtin' || parsed.kind === 'custom') return parsed;
      return null;
    } catch {
      return null;
    }
  }

  function startWire(event: React.PointerEvent<SVGElement>, endpoint: WireEndpoint, point: Point) {
    if (mode !== 'edit') return;
    event.stopPropagation();
    onSelectGate(null);
    onWireStart(endpoint, point);
  }

  return (
    <svg
      ref={svgRef}
      className="editor-canvas"
      viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
      role="img"
      aria-label="Schaltungseditor"
      onDragOver={(event) => {
        if (mode === 'simulate') return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(event) => {
        if (mode === 'simulate') return;
        event.preventDefault();
        const tool = readDraggedTool(event);
        if (!tool) return;
        onSelectGate(null);
        onSelectWire(null);
        onToolDrop(tool, getPoint(event));
      }}
      onPointerMove={(event) => {
        const point = getPoint(event);
        if (gatePointerRef.current) {
          const distanceX = Math.abs(point.x - gatePointerRef.current.point.x);
          const distanceY = Math.abs(point.y - gatePointerRef.current.point.y);
          gatePointerRef.current.moved = gatePointerRef.current.moved || distanceX > 4 || distanceY > 4;
        }
        if (mode === 'edit' && dragState) onDragMove(point);
        if (mode === 'edit' && wireDraft) onWirePreview(point);
      }}
      onPointerUp={(event) => {
        onDragEnd();
        if (mode === 'edit' && wireDraft) {
          onWireEnd({ kind: 'point', point: getPoint(event) });
        }
      }}
      onPointerLeave={() => {
        onDragEnd();
        if (wireDraft) onWireCancel();
      }}
      onClick={(event) => {
        const target = event.target as SVGElement;
        if (target.dataset.role !== 'canvas-grid' && target !== event.currentTarget) return;
        const point = getPoint(event);
        onSelectGate(null);
        onSelectWire(null);
        onCanvasClick(point);
      }}
    >
      <defs>
        <pattern id="editor-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} className="grid-line" fill="none" />
        </pattern>
      </defs>

      <rect data-role="canvas-grid" width={canvasSize.width} height={canvasSize.height} fill="url(#editor-grid)" />

      {circuit.wires.map((wire) => {
        const points = getWirePoints(wire, pinMap);
        if (!points) return null;

        const fromEndpoint = normalizeWireEndpoint(wire, 'from');
        const toEndpoint = normalizeWireEndpoint(wire, 'to');
        const branchPoint = wireBranchPoint(points.from, points.to);

        return (
          <g key={wire.id}>
            <WireComp
              from={points.from}
              to={points.to}
              active={Boolean(signals[wire.sourcePinId ?? ''])}
              selected={selectedWireId === wire.id}
              onSelect={(event) => {
                if (mode !== 'edit') return;
                event.stopPropagation();
                onSelectGate(null);
                onSelectWire(wire.id);
              }}
            />
            {mode === 'edit' && (
              <>
                <circle
                  className="wire-handle"
                  cx={branchPoint.x}
                  cy={branchPoint.y}
                  r={7}
                  onPointerDown={(event) => startWire(event, { kind: 'wire', wireId: wire.id, point: branchPoint }, branchPoint)}
                />
                {fromEndpoint?.kind === 'point' && (
                  <circle
                    className="wire-endpoint"
                    cx={points.from.x}
                    cy={points.from.y}
                    r={7}
                    onPointerDown={(event) => startWire(event, fromEndpoint, points.from)}
                  />
                )}
                {toEndpoint?.kind === 'point' && (
                  <circle
                    className="wire-endpoint"
                    cx={points.to.x}
                    cy={points.to.y}
                    r={7}
                    onPointerDown={(event) => startWire(event, toEndpoint, points.to)}
                  />
                )}
              </>
            )}
          </g>
        );
      })}

      {wireDraft && <WireComp from={wireDraft.from} to={wireDraft.to} preview />}

      {(circuit.labels ?? []).map((label) => (
        <text key={label.id} className="canvas-net-label" x={label.x} y={label.y}>
          {label.text}
        </text>
      ))}

      {(circuit.annotations ?? []).map((annotation) => (
        <text key={annotation.id} className="canvas-annotation" x={annotation.x} y={annotation.y}>
          {annotation.text}
        </text>
      ))}

      {circuit.gates.map((gate) => (
        <GateComp
          key={gate.id}
          gate={gate}
          signals={signals}
          selected={gate.id === selectedGateId}
          selectedTool={mode === 'edit' ? selectedTool : null}
          onGatePointerDown={(event, selectedGate) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            const point = getPoint(event);
            gatePointerRef.current = { gateId: selectedGate.id, point, moved: false };
            onSelectGate(selectedGate.id);
            onSelectWire(null);
            if (mode === 'edit') onGateDragStart(selectedGate, point);
          }}
          onGateClick={(event, clickedGate) => {
            event.stopPropagation();
            const pointer = gatePointerRef.current;
            gatePointerRef.current = null;

            if (mode === 'simulate' && isInteractiveSourceGate(clickedGate) && pointer?.gateId === clickedGate.id && !pointer.moved) {
              onToggleInput(clickedGate.id);
            }
          }}
          onPinPointerDown={(event, pin) => {
            const entry = pinMap.get(pin.id);
            if (entry) startWire(event, { kind: 'pin', pinId: pin.id }, entry.point);
          }}
          onPinPointerUp={(event, pin) => {
            if (mode !== 'edit' || !wireDraft) return;
            event.stopPropagation();
            onWireEnd({ kind: 'pin', pinId: pin.id });
          }}
        />
      ))}
    </svg>
  );
}
