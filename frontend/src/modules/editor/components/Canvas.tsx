import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { GateComp } from './GateComp';
import { WireComp, wireBranchPoint } from './WireComp';
import { getAnnotationLayout } from '../annotationLayout';
import {
  CANVAS_ZOOM_STEP,
  createDefaultViewBox,
  getViewBoxZoom,
  panViewBox,
  resizeViewBox,
  zoomViewBox,
  type CanvasSize,
  type ViewBox,
} from '../canvasViewBox';
import { isInteractiveSourceGate } from '../../../schematic/symbolGeometry';
import { GRID_SIZE, snapToGrid } from '../../../simulation/gateLibrary';
import { buildLiveWireIds, createPinLookup, getWirePoints, normalizeWireEndpoint } from '../../../simulation/wireUtils';
import type {
  Circuit,
  DragState,
  EditorMode,
  EditorTool,
  Gate,
  Annotation,
  Point,
  SignalState,
  WireDraft,
  WireEndpoint,
} from '../../../types/circuit';
import type { RemoteCursor } from '../../../types/collaboration';

interface CanvasProps {
  circuit: Circuit;
  signals: SignalState;
  mode: EditorMode;
  selectedTool: EditorTool | null;
  selectedGateId: string | null;
  selectedWireId: string | null;
  selectedAnnotationId: string | null;
  dragState: DragState | null;
  wireDraft: WireDraft | null;
  draggedTool: EditorTool | null;
  toolPreviewGate: Gate | null;
  remoteCursors?: RemoteCursor[];
  onCanvasClick: (point: Point) => void;
  onCanvasPointerMove?: (point: Point) => void;
  onToolDrop: (tool: EditorTool, point: Point) => void;
  onToolDragPreview: (point: Point) => void;
  onToolDragCancel: () => void;
  onGateDragStart: (gate: Gate, point: Point) => void;
  onAnnotationDragStart: (annotation: Annotation, point: Point) => void;
  onDragMove: (point: Point) => void;
  onDragEnd: () => void;
  onSelectGate: (gateId: string | null) => void;
  onSelectWire: (wireId: string | null) => void;
  onSelectAnnotation: (annotationId: string | null) => void;
  onWireStart: (endpoint: WireEndpoint, point: Point) => void;
  onWireEnd: (endpoint: WireEndpoint) => void;
  onWirePreview: (point: Point) => void;
  onWireCancel: () => void;
  onToggleInput: (gateId: string) => void;
}

const FALLBACK_WIDTH = 1280;
const FALLBACK_HEIGHT = 760;
const FALLBACK_SIZE: CanvasSize = { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT };

interface PanState {
  pointerId: number;
  startClient: Point;
  startViewBox: ViewBox;
  moved: boolean;
}

export function Canvas({
  circuit,
  signals,
  mode,
  selectedTool,
  selectedGateId,
  selectedWireId,
  selectedAnnotationId,
  dragState,
  wireDraft,
  draggedTool,
  toolPreviewGate,
  remoteCursors = [],
  onCanvasClick,
  onCanvasPointerMove,
  onToolDrop,
  onToolDragPreview,
  onToolDragCancel,
  onGateDragStart,
  onAnnotationDragStart,
  onDragMove,
  onDragEnd,
  onSelectGate,
  onSelectWire,
  onSelectAnnotation,
  onWireStart,
  onWireEnd,
  onWirePreview,
  onWireCancel,
  onToggleInput,
}: CanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gatePointerRef = useRef<{ gateId: string; point: Point; moved: boolean; toggleOnRelease: boolean } | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const suppressCanvasClickRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState(FALLBACK_SIZE);
  const [viewBox, setViewBox] = useState<ViewBox>(() => createDefaultViewBox(FALLBACK_SIZE));
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const updateSize = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nextSize = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      setCanvasSize((currentSize) => {
        if (currentSize.width === nextSize.width && currentSize.height === nextSize.height) return currentSize;
        setViewBox((currentViewBox) => resizeViewBox(currentViewBox, currentSize, nextSize));
        return nextSize;
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
        setIsSpacePressed(true);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') setIsSpacePressed(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const point = getPointFromClient(event.clientX, event.clientY);
      setViewBox((current) =>
        zoomViewBox(current, point, event.deltaY < 0 ? CANVAS_ZOOM_STEP : 1 / CANVAS_ZOOM_STEP, canvasSize),
      );
    }

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [canvasSize]);

  const pinMap = useMemo(() => createPinLookup(circuit), [circuit]);
  const liveWireIds = useMemo(() => buildLiveWireIds(circuit, signals), [circuit, signals]);
  const zoomLevel = getViewBoxZoom(viewBox, canvasSize);

  function getPointFromClient(clientX: number, clientY: number): Point {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };

    const svgPoint = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return {
      x: Number.isFinite(svgPoint.x) ? svgPoint.x : 0,
      y: Number.isFinite(svgPoint.y) ? svgPoint.y : 0,
    };
  }

  function getPoint(event: React.PointerEvent<SVGElement> | React.MouseEvent<SVGElement> | React.DragEvent<SVGElement>): Point {
    return getPointFromClient(event.clientX, event.clientY);
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
    onSelectAnnotation(null);
    onWireStart(endpoint, point);
  }

  function startAnnotationDrag(event: React.PointerEvent<SVGGElement>, annotation: Annotation) {
    if (mode !== 'edit') return;

    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelectGate(null);
    onSelectWire(null);
    onSelectAnnotation(annotation.id);
    onAnnotationDragStart(annotation, getPoint(event));
  }

  function isCanvasTarget(event: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>): boolean {
    const target = event.target as SVGElement;
    return target.dataset.role === 'canvas-grid' || target === event.currentTarget;
  }

  function startPan(event: React.PointerEvent<SVGSVGElement>) {
    if (!isCanvasTarget(event)) return;

    const primaryBackgroundPan = event.button === 0 && !selectedTool && !wireDraft && !draggedTool;
    const requestedPan = event.button === 1 || isSpacePressed || primaryBackgroundPan;
    if (!requestedPan) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    panStateRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startViewBox: viewBox,
      moved: false,
    };
    setIsPanning(true);
    onSelectGate(null);
    onSelectWire(null);
    onSelectAnnotation(null);
  }

  function endPan(event?: React.PointerEvent<SVGSVGElement>, suppressClick = true) {
    const panState = panStateRef.current;
    if (!panState) return false;

    if (event?.currentTarget.hasPointerCapture?.(panState.pointerId)) {
      event.currentTarget.releasePointerCapture?.(panState.pointerId);
    }
    suppressCanvasClickRef.current = suppressClick && panState.moved;
    panStateRef.current = null;
    setIsPanning(false);
    return true;
  }

  function zoomBy(scaleFactor: number, focalPoint: Point = { x: viewBox.x + viewBox.width / 2, y: viewBox.y + viewBox.height / 2 }) {
    setViewBox((current) => zoomViewBox(current, focalPoint, scaleFactor, canvasSize));
  }

  return (
    <div ref={frameRef} className={`canvas-frame ${isPanning ? 'is-panning' : ''}`}>
      <div className="canvas-view-controls" role="group" aria-label="Arbeitsflächen-Navigation">
        <button
          className="icon-button small"
          type="button"
          title="Verkleinern"
          aria-label="Verkleinern"
          onClick={() => zoomBy(1 / CANVAS_ZOOM_STEP)}
        >
          <Icon name="zoom-out" />
        </button>
        <span className="zoom-readout" aria-label="Zoomstufe">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          className="icon-button small"
          type="button"
          title="Vergrößern"
          aria-label="Vergrößern"
          onClick={() => zoomBy(CANVAS_ZOOM_STEP)}
        >
          <Icon name="zoom-in" />
        </button>
        <button
          className="icon-button small"
          type="button"
          title="Ansicht zurücksetzen"
          aria-label="Ansicht zurücksetzen"
          onClick={() => setViewBox(createDefaultViewBox(canvasSize))}
        >
          <Icon name="reset-view" />
        </button>
      </div>

      <svg
        ref={svgRef}
        className="editor-canvas"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        role="img"
        aria-label="Schaltungseditor"
        onAuxClick={(event) => {
          if (event.button === 1) event.preventDefault();
        }}
        onDragOver={(event) => {
          if (mode === 'simulate') return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          if (draggedTool) onToolDragPreview(getPoint(event));
        }}
        onDragLeave={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const isOutside =
            event.clientX <= rect.left || event.clientX >= rect.right || event.clientY <= rect.top || event.clientY >= rect.bottom;
          if (isOutside) onToolDragCancel();
        }}
        onDrop={(event) => {
          if (mode === 'simulate') return;
          event.preventDefault();
          const tool = readDraggedTool(event) ?? draggedTool;
          onToolDragCancel();
          if (!tool) return;
          onSelectGate(null);
          onSelectWire(null);
          onSelectAnnotation(null);
          onToolDrop(tool, getPoint(event));
        }}
        onPointerDown={startPan}
        onPointerMove={(event) => {
          const panState = panStateRef.current;
          if (panState) {
            onCanvasPointerMove?.(getPointFromClient(event.clientX, event.clientY));
            const screenDelta = { x: event.clientX - panState.startClient.x, y: event.clientY - panState.startClient.y };
            panState.moved = panState.moved || Math.abs(screenDelta.x) > 4 || Math.abs(screenDelta.y) > 4;
            setViewBox(panViewBox(panState.startViewBox, screenDelta, canvasSize));
            return;
          }

          const point = getPoint(event);
          onCanvasPointerMove?.(point);
          if (gatePointerRef.current) {
            const distanceX = Math.abs(point.x - gatePointerRef.current.point.x);
            const distanceY = Math.abs(point.y - gatePointerRef.current.point.y);
            gatePointerRef.current.moved = gatePointerRef.current.moved || distanceX > 4 || distanceY > 4;
          }
          if (mode === 'edit' && dragState) onDragMove(point);
          if (mode === 'edit' && wireDraft) onWirePreview({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
        }}
        onPointerUp={(event) => {
          if (endPan(event)) return;

          const pointer = gatePointerRef.current;
          if (mode === 'simulate' && pointer?.toggleOnRelease && !pointer.moved) {
            onToggleInput(pointer.gateId);
          }
          gatePointerRef.current = null;
          onDragEnd();
          if (mode === 'edit' && wireDraft) {
            onWireEnd({ kind: 'point', point: getPoint(event) });
          }
        }}
        onPointerLeave={(event) => {
          if (endPan(event, false)) return;
          gatePointerRef.current = null;
          onDragEnd();
          if (wireDraft) onWireCancel();
        }}
        onClick={(event) => {
          if (!isCanvasTarget(event)) return;
          if (suppressCanvasClickRef.current) {
            suppressCanvasClickRef.current = false;
            return;
          }

          const point = getPoint(event);
          onSelectGate(null);
          onSelectWire(null);
          onSelectAnnotation(null);
          onCanvasClick(point);
        }}
      >
        <defs>
          <pattern id="editor-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} className="grid-line" fill="none" />
          </pattern>
        </defs>

        <rect
          data-role="canvas-grid"
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#editor-grid)"
        />

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
                active={liveWireIds.has(wire.id)}
                selected={selectedWireId === wire.id}
                onSelect={(event) => {
                  if (mode !== 'edit') return;
                  event.stopPropagation();
                  onSelectGate(null);
                  onSelectAnnotation(null);
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

        {circuit.gates.map((gate) => (
          <GateComp
            key={gate.id}
            gate={gate}
            signals={signals}
            selected={mode === 'edit' && gate.id === selectedGateId}
            selectedTool={mode === 'edit' ? selectedTool : null}
            onGatePointerDown={(event, selectedGate) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              const point = getPoint(event);
              gatePointerRef.current = {
                gateId: selectedGate.id,
                point,
                moved: false,
                toggleOnRelease: mode === 'simulate' && event.button === 0 && isInteractiveSourceGate(selectedGate),
              };
              onSelectGate(selectedGate.id);
              onSelectWire(null);
              onSelectAnnotation(null);
              if (mode === 'edit') onGateDragStart(selectedGate, point);
            }}
            onGateClick={(event) => {
              event.stopPropagation();
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

        {(circuit.annotations ?? []).map((annotation) => {
          const layout = getAnnotationLayout(annotation.text);

          return (
            <g
              key={annotation.id}
              className={[
                'canvas-annotation',
                mode === 'edit' ? 'is-editable' : '',
                selectedAnnotationId === annotation.id ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              transform={`translate(${annotation.x} ${annotation.y})`}
              onPointerDown={(event) => startAnnotationDrag(event, annotation)}
            >
              <rect className="canvas-annotation-box" width={layout.width} height={layout.height} rx={8} />
              <text className="canvas-annotation-text" x={layout.paddingX} y={layout.paddingY + layout.fontSize}>
                {layout.lines.map((line, index) => (
                  <tspan key={`${annotation.id}-line-${index}`} x={layout.paddingX} dy={index === 0 ? 0 : layout.lineHeight}>
                    {line || ' '}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {toolPreviewGate && (
          <GateComp
            gate={toolPreviewGate}
            signals={{}}
            selected={false}
            selectedTool={null}
            preview
            onGatePointerDown={(event) => event.stopPropagation()}
            onGateClick={(event) => event.stopPropagation()}
            onPinPointerDown={(event) => event.stopPropagation()}
            onPinPointerUp={(event) => event.stopPropagation()}
          />
        )}

        {remoteCursors.map((cursor) => (
          <g
            key={cursor.participantId}
            className="remote-cursor"
            transform={`translate(${cursor.position.x} ${cursor.position.y})`}
          >
            <path d="M 0 0 L 0 22 L 6 16 L 11 28 L 16 26 L 11 14 L 19 14 Z" />
            <text x={18} y={28}>
              {cursor.displayName}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
