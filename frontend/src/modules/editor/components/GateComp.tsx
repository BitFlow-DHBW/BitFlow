import { pinPosition } from '../../../simulation/gateLibrary';
import { componentSymbolSvg } from '../../../schematic/svgPrimitives';
import type { EditorTool, Gate, Pin, SignalState } from '../../../types/circuit';

interface GateCompProps {
  gate: Gate;
  signals: SignalState;
  selected: boolean;
  selectedTool: EditorTool | null;
  preview?: boolean;
  snapTarget?: { pinId: string; status: 'valid' | 'invalid' } | null;
  onGatePointerDown: (event: React.PointerEvent<SVGGElement>, gate: Gate) => void;
  onGateClick: (event: React.MouseEvent<SVGGElement>, gate: Gate) => void;
  onPinPointerDown: (event: React.PointerEvent<SVGCircleElement>, pin: Pin) => void;
  onPinPointerUp: (event: React.PointerEvent<SVGCircleElement>, pin: Pin) => void;
}

export function GateComp({
  gate,
  signals,
  selected,
  selectedTool,
  preview = false,
  snapTarget = null,
  onGatePointerDown,
  onGateClick,
  onPinPointerDown,
  onPinPointerUp,
}: GateCompProps) {
  const isSourceOn = ['INPUT', 'SWITCH', 'CLOCK'].includes(gate.type) && Boolean(signals[gate.id]);
  const isIndicatorOn = ['OUTPUT', 'LED'].includes(gate.type) && Boolean(signals[gate.id]);
  const pins = [...gate.inputs, ...gate.outputs];

  return (
    <g
      className={`gate-node ${selected ? 'is-selected' : ''} ${selectedTool ? 'is-tool-active' : ''} ${preview ? 'is-preview' : ''}`}
      onPointerDown={(event) => onGatePointerDown(event, gate)}
      onClick={(event) => onGateClick(event, gate)}
    >
      <g
        className={`schematic-symbol ${isSourceOn || isIndicatorOn ? 'is-live' : ''}`}
        dangerouslySetInnerHTML={{ __html: componentSymbolSvg(gate) }}
      />

      {pins.map((pin) => {
        const position = pinPosition(gate, pin);
        const live = pin.direction === 'output' ? Boolean(signals[pin.id]) : false;
        const snapStatus = snapTarget?.pinId === pin.id ? snapTarget.status : null;
        return (
          <circle
            key={pin.id}
            cx={position.x}
            cy={position.y}
            r={6}
            className={`pin ${pin.direction} ${live ? 'is-live' : ''} ${snapStatus ? `is-snap-${snapStatus}` : ''}`}
            onPointerDown={(event) => onPinPointerDown(event, pin)}
            onPointerUp={(event) => onPinPointerUp(event, pin)}
          />
        );
      })}
    </g>
  );
}
