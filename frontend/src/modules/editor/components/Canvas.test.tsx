import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Canvas } from './Canvas';
import { createStarterCircuit } from '../../../simulation/gateLibrary';
import { circuitWith, gate, wire } from '../../../test/builders';

type CanvasProps = Parameters<typeof Canvas>[0];

function canvasProps(overrides: Partial<CanvasProps> = {}): CanvasProps {
  return {
    circuit: createStarterCircuit('Canvas Project'),
    signals: {},
    mode: 'edit',
    selectedTool: null,
    selectedGateId: null,
    selectedWireId: null,
    dragState: null,
    wireDraft: null,
    draggedTool: null,
    toolPreviewGate: null,
    onCanvasClick: vi.fn(),
    onToolDrop: vi.fn(),
    onToolDragPreview: vi.fn(),
    onToolDragCancel: vi.fn(),
    onGateDragStart: vi.fn(),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    onSelectGate: vi.fn(),
    onSelectWire: vi.fn(),
    onWireStart: vi.fn(),
    onWireEnd: vi.fn(),
    onWirePreview: vi.fn(),
    onWireCancel: vi.fn(),
    onToggleInput: vi.fn(),
    ...overrides,
  };
}

describe('Canvas', () => {
  it('renders the editor grid, gates, wires and annotations', () => {
    const props = canvasProps({ signals: { 'input_a:output:0': true }, selectedWireId: 'wire_input_a_to_and_main_0' });
    const { container } = render(<Canvas {...props} />);

    expect(screen.getByRole('img', { name: 'Schaltungseditor' })).toBeInTheDocument();
    expect(container.querySelectorAll('.gate-node')).toHaveLength(4);
    expect(container.querySelectorAll('.wire')).toHaveLength(3);
    expect(container.querySelector('.wire.is-selected')).toBeInTheDocument();
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getByText('BitFlow starter schematic')).toBeInTheDocument();
  });

  it('selects wires and places selected tools on grid clicks', () => {
    const props = canvasProps({
      selectedTool: { kind: 'builtin', type: 'AND' },
    });
    const { container } = render(<Canvas {...props} />);

    fireEvent.click(container.querySelector('path.wire') as SVGPathElement);
    expect(props.onSelectWire).toHaveBeenCalled();

    fireEvent.click(container.querySelector('[data-role="canvas-grid"]') as SVGRectElement, { clientX: 240, clientY: 120 });
    expect(props.onSelectGate).toHaveBeenCalledWith(null);
    expect(props.onCanvasClick).toHaveBeenCalledWith({ x: 240, y: 120 });
  });

  it('renders wires as live when connected to a true output pin in either direction', () => {
    const input = gate('INPUT', 'input_live');
    const andGate = gate('AND', 'and_live');
    const reversedWire = {
      id: 'wire_reversed',
      from: { kind: 'pin' as const, pinId: andGate.inputs[0].id },
      to: { kind: 'pin' as const, pinId: input.outputs[0].id },
      sourcePinId: andGate.inputs[0].id,
      targetPinId: input.outputs[0].id,
      points: [],
    };
    const props = canvasProps({
      circuit: circuitWith([input, andGate], [reversedWire]),
      signals: { [input.outputs[0].id]: true },
    });
    const { container } = render(<Canvas {...props} />);

    expect(container.querySelector('path.wire.is-live')).toBeInTheDocument();
  });

  it('handles drag preview, drop payloads and wire drafts', () => {
    const input = gate('INPUT', 'input_canvas');
    const output = gate('OUTPUT', 'output_canvas');
    const props = canvasProps({
      circuit: circuitWith([input, output], [wire('wire_canvas', input, 0, output)]),
      draggedTool: { kind: 'builtin', type: 'OR' },
      wireDraft: { start: { kind: 'pin', pinId: input.outputs[0].id }, from: { x: 0, y: 0 }, to: { x: 24, y: 24 } },
    });
    const { container } = render(<Canvas {...props} />);
    const svg = screen.getByRole('img', { name: 'Schaltungseditor' });

    fireEvent.dragOver(svg, { clientX: 120, clientY: 96, dataTransfer: { dropEffect: '' } });
    expect(props.onToolDragPreview).toHaveBeenCalledWith({ x: 0, y: 0 });

    fireEvent.drop(svg, {
      clientX: 144,
      clientY: 120,
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ kind: 'builtin', type: 'XOR' })),
      },
    });
    expect(props.onToolDrop).toHaveBeenCalledWith({ kind: 'builtin', type: 'XOR' }, { x: 0, y: 0 });

    fireEvent.pointerMove(svg, { clientX: 41, clientY: 47 });
    expect(props.onWirePreview).toHaveBeenCalledWith({ x: 48, y: 48 });

    fireEvent.pointerUp(svg, { clientX: 72, clientY: 96 });
    expect(props.onWireEnd).toHaveBeenCalledWith({ kind: 'point', point: { x: 72, y: 96 } });
    expect(container.querySelector('.wire.is-preview')).toBeInTheDocument();
  });

  it('disables editing interactions in simulate mode and toggles source gates on click release', () => {
    const input = gate('INPUT', 'input_sim');
    const props = canvasProps({ circuit: circuitWith([input]), mode: 'simulate', selectedGateId: input.id });
    const { container } = render(<Canvas {...props} />);
    const gateNode = container.querySelector('.gate-node') as SVGGElement;

    expect(gateNode).not.toHaveClass('is-selected');

    Object.defineProperty(gateNode, 'setPointerCapture', { value: vi.fn(), configurable: true });
    fireEvent.pointerDown(gateNode, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(screen.getByRole('img', { name: 'Schaltungseditor' }), { clientX: 0, clientY: 0 });

    expect(props.onGateDragStart).not.toHaveBeenCalled();
    expect(props.onToggleInput).toHaveBeenCalledWith(input.id);
  });
});
