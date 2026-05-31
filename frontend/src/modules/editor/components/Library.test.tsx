import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Library } from './Library';
import { customComponent } from '../../../test/builders';

describe('Library', () => {
  it('renders built-in and custom tools and selects them on click', async () => {
    const user = userEvent.setup();
    const onSelectTool = vi.fn();

    render(
      <Library
        customComponents={[customComponent({ id: 'custom_adder', name: 'Adder' })]}
        selectedTool={{ kind: 'builtin', type: 'AND' }}
        onSelectTool={onSelectTool}
        onToolDragStart={vi.fn()}
        onToolDragEnd={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /AND/ })).toHaveClass('is-selected');
    expect(screen.getByRole('button', { name: /Adder/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\?Generisch/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Auswahl/ }));
    await user.click(screen.getByRole('button', { name: /Adder/ }));

    expect(onSelectTool).toHaveBeenNthCalledWith(1, null);
    expect(onSelectTool).toHaveBeenNthCalledWith(2, { kind: 'custom', componentId: 'custom_adder' });
  });

  it('serializes dragged tools for canvas drop handling', () => {
    const onToolDragStart = vi.fn();
    const setData = vi.fn();

    render(
      <Library
        customComponents={[]}
        selectedTool={null}
        onSelectTool={vi.fn()}
        onToolDragStart={onToolDragStart}
        onToolDragEnd={vi.fn()}
      />,
    );

    fireEvent.dragStart(screen.getByRole('button', { name: /AND/ }), {
      dataTransfer: {
        effectAllowed: '',
        setData,
      },
    });

    expect(setData).toHaveBeenCalledWith('application/x-bitflow-tool', JSON.stringify({ kind: 'builtin', type: 'AND' }));
    expect(onToolDragStart).toHaveBeenCalledWith({ kind: 'builtin', type: 'AND' });
  });

  it('shows an empty custom component state', () => {
    render(
      <Library
        customComponents={[]}
        selectedTool={null}
        onSelectTool={vi.fn()}
        onToolDragStart={vi.fn()}
        onToolDragEnd={vi.fn()}
      />,
    );

    expect(screen.getByText('Noch keine eigenen Bausteine.')).toBeInTheDocument();
  });
});
