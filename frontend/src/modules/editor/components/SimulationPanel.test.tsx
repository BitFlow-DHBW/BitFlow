import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SimulationPanel } from './SimulationPanel';
import { circuitWith, gate } from '../../../test/builders';

describe('SimulationPanel', () => {
  it('renders input toggles and output readouts from circuit signals', async () => {
    const user = userEvent.setup();
    const input = gate('INPUT', 'input_panel');
    const output = gate('OUTPUT', 'output_panel');
    const onToggleInput = vi.fn();

    render(
      <SimulationPanel
        circuit={circuitWith([input, output])}
        signals={{ [output.id]: true }}
        inputSignals={{ [input.id]: false }}
        enabled
        onToggleInput={onToggleInput}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Input Pinfalse/ }));

    expect(onToggleInput).toHaveBeenCalledWith(input.id);
    expect(screen.getByText('Output Pin')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('disables inputs outside simulate mode and handles empty circuits', () => {
    const input = gate('INPUT', 'disabled_input');
    const { rerender } = render(
      <SimulationPanel circuit={circuitWith([input])} signals={{}} inputSignals={{}} enabled={false} onToggleInput={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /Input Pinfalse/ })).toBeDisabled();
    expect(screen.getByText('Inputs lassen sich nur im Simulate-Modus schalten.')).toBeInTheDocument();
    expect(screen.getByText('Keine Outputs vorhanden.')).toBeInTheDocument();

    rerender(<SimulationPanel circuit={circuitWith([])} signals={{}} inputSignals={{}} enabled onToggleInput={vi.fn()} />);
    expect(screen.getByText('Keine Inputs vorhanden.')).toBeInTheDocument();
  });
});
