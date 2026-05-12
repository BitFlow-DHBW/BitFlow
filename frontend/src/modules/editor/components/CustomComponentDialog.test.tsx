import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CustomComponentDialog } from './CustomComponentDialog';
import { circuitWith, gate } from '../../../test/builders';

describe('CustomComponentDialog', () => {
  it('renders nothing while closed', () => {
    const { container } = render(
      <CustomComponentDialog circuit={circuitWith([])} open={false} onClose={vi.fn()} onCreate={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('creates custom components from circuit inputs, outputs and truth table rows', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onClose = vi.fn();
    const input = { ...gate('INPUT', 'input_custom'), label: 'A' };
    const output = { ...gate('OUTPUT', 'output_custom'), label: 'Y' };

    render(<CustomComponentDialog circuit={circuitWith([input, output])} open onClose={onClose} onCreate={onCreate} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Buffer');
    await user.type(screen.getByLabelText('Beschreibung'), 'One bit buffer');
    await user.click(screen.getByRole('button', { name: /Zeile/ }));
    await user.click(screen.getAllByRole('button', { name: '0' })[0]);
    await user.click(screen.getByRole('button', { name: 'Baustein speichern' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Buffer',
        description: 'One bit buffer',
        inputLabels: ['A'],
        outputLabels: ['Y'],
        truthTable: [{ inputs: [true], outputs: [false] }],
        sourceCircuitId: 'circuit_test',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when the dismiss button is used', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CustomComponentDialog circuit={circuitWith([])} open onClose={onClose} onCreate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Dialog/ }));

    expect(onClose).toHaveBeenCalled();
  });
});
