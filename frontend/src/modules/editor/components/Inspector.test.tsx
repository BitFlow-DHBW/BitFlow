import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Inspector } from './Inspector';
import { circuitWith, customComponent, gate } from '../../../test/builders';

describe('Inspector', () => {
  it('shows circuit counts when no gate is selected', () => {
    render(<Inspector circuit={circuitWith([gate('INPUT', 'input_a')], [])} selectedGate={null} onUpdateGate={vi.fn()} />);

    expect(screen.getByText(/Kein Baustein/)).toBeInTheDocument();
    expect(screen.getByText(/1 Komponenten/)).toBeInTheDocument();
  });

  it('updates gate labels, metadata and pin labels', async () => {
    const onUpdateGate = vi.fn();
    const selectedGate = gate('AND', 'and_inspector', 48, 72);

    render(<Inspector circuit={circuitWith([selectedGate])} selectedGate={selectedGate} onUpdateGate={onUpdateGate} />);

    fireEvent.change(screen.getByLabelText('Bezeichnung'), { target: { value: 'Enable' } });
    fireEvent.change(screen.getByLabelText('Referenz'), { target: { value: 'U1' } });
    fireEvent.change(screen.getByLabelText('Wert'), { target: { value: '74HC08' } });
    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'IN_A' } });

    expect(onUpdateGate).toHaveBeenCalledWith(expect.objectContaining({ label: 'Enable' }));
    expect(onUpdateGate).toHaveBeenCalledWith(expect.objectContaining({ reference: 'U1' }));
    expect(onUpdateGate).toHaveBeenCalledWith(expect.objectContaining({ value: '74HC08' }));
    expect(onUpdateGate).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.arrayContaining([expect.objectContaining({ label: 'IN_A', name: 'IN_A' })]),
      }),
    );
    expect(screen.getByText('AND')).toBeInTheDocument();
    expect(screen.getByText('48 / 72')).toBeInTheDocument();
  });

  it('configures variable pin counts and shows custom component metadata', async () => {
    const onUpdateGate = vi.fn();
    const genericGate = gate('GENERIC', 'generic_inspector');
    const component = customComponent({ id: 'component_cpu', name: 'CPU Slice' });
    const customGate = {
      ...genericGate,
      type: 'CUSTOM' as const,
      customComponentId: 'component_cpu',
      label: 'Slice',
    };
    const { rerender } = render(
      <Inspector circuit={circuitWith([genericGate])} selectedGate={genericGate} onUpdateGate={onUpdateGate} />,
    );

    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '4' } });
    fireEvent.change(numberInputs[1], { target: { value: '3' } });

    expect(onUpdateGate.mock.calls.some(([nextGate]) => nextGate.inputs.length === 4)).toBe(true);
    expect(onUpdateGate.mock.calls.some(([nextGate]) => nextGate.outputs.length === 3)).toBe(true);

    rerender(
      <Inspector
        circuit={circuitWith([customGate], [], { customComponents: [component] })}
        selectedGate={customGate}
        onUpdateGate={onUpdateGate}
      />,
    );

    expect(screen.getByText('CPU Slice')).toBeInTheDocument();
  });
});
