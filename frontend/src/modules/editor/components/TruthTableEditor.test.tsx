import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TruthTableEditor } from './TruthTableEditor';

describe('TruthTableEditor', () => {
  it('adds rows and toggles input/output cells', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TruthTableEditor inputLabels={['A']} outputLabels={['Y']} rows={[]} onChange={onChange} />);

    expect(screen.getByText('Noch keine Zeilen definiert.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zeile/ }));
    expect(onChange).toHaveBeenLastCalledWith([{ inputs: [false], outputs: [false] }]);

    await user.click(screen.getAllByRole('button', { name: '0' })[0]);
    expect(onChange).toHaveBeenLastCalledWith([{ inputs: [true], outputs: [false] }]);

    await user.click(screen.getAllByRole('button', { name: '0' })[0]);
    expect(onChange).toHaveBeenLastCalledWith([{ inputs: [true], outputs: [true] }]);
  });

  it('renders supplied rows immediately', () => {
    render(
      <TruthTableEditor inputLabels={['A']} outputLabels={['Y']} rows={[{ inputs: [true], outputs: [false] }]} onChange={vi.fn()} />,
    );

    expect(screen.getByRole('columnheader', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Y' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('can lock generated input combinations while outputs remain editable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TruthTableEditor
        inputLabels={['A']}
        outputLabels={['Y']}
        rows={[{ inputs: [true], outputs: [false] }]}
        onChange={onChange}
        readOnlyInputs
        allowAddRow={false}
      />,
    );

    expect(screen.queryByRole('button', { name: /Zeile/ })).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '0' }));

    expect(onChange).toHaveBeenLastCalledWith([{ inputs: [true], outputs: [true] }]);
  });
});
