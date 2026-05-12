import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GateComp } from './GateComp';
import { gate } from '../../../test/builders';

describe('GateComp', () => {
  it('renders a live selected gate with pin handles and symbol markup', () => {
    const input = gate('INPUT', 'input_comp', 24, 48);
    const onGatePointerDown = vi.fn();
    const onGateClick = vi.fn();
    const onPinPointerDown = vi.fn();
    const onPinPointerUp = vi.fn();

    const { container } = render(
      <svg>
        <GateComp
          gate={input}
          signals={{ [input.id]: true, [input.outputs[0].id]: true }}
          selected
          selectedTool={{ kind: 'builtin', type: 'AND' }}
          onGatePointerDown={onGatePointerDown}
          onGateClick={onGateClick}
          onPinPointerDown={onPinPointerDown}
          onPinPointerUp={onPinPointerUp}
        />
      </svg>,
    );

    expect(container.querySelector('.gate-node')).toHaveClass('is-selected', 'is-tool-active');
    expect(container.querySelector('.schematic-symbol')).toHaveClass('is-live');
    expect(container.querySelectorAll('circle.pin')).toHaveLength(1);
    expect(container.querySelector('circle.pin')).toHaveClass('is-live');
    expect(container.textContent).toContain('Input Pin');

    fireEvent.pointerDown(container.querySelector('.gate-node') as SVGGElement);
    fireEvent.click(container.querySelector('.gate-node') as SVGGElement);
    fireEvent.pointerDown(container.querySelector('circle.pin') as SVGCircleElement);
    fireEvent.pointerUp(container.querySelector('circle.pin') as SVGCircleElement);

    expect(onGatePointerDown).toHaveBeenCalledWith(expect.anything(), input);
    expect(onGateClick).toHaveBeenCalledWith(expect.anything(), input);
    expect(onPinPointerDown).toHaveBeenCalledWith(expect.anything(), input.outputs[0]);
    expect(onPinPointerUp).toHaveBeenCalledWith(expect.anything(), input.outputs[0]);
  });

  it('renders indicator gates as live when their gate signal is true', () => {
    const output = gate('OUTPUT', 'output_comp', 24, 48);
    const { container } = render(
      <svg>
        <GateComp
          gate={output}
          signals={{ [output.id]: true }}
          selected={false}
          selectedTool={null}
          preview
          onGatePointerDown={vi.fn()}
          onGateClick={vi.fn()}
          onPinPointerDown={vi.fn()}
          onPinPointerUp={vi.fn()}
        />
      </svg>,
    );

    expect(container.querySelector('.gate-node')).toHaveClass('is-preview');
    expect(container.querySelector('.schematic-symbol')).toHaveClass('is-live');
  });
});
