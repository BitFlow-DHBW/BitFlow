import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useHistory } from './useHistory';

function HistoryHarness({ initial = 'A', resetKey = 'one' }: { initial?: string; resetKey?: string }) {
  const history = useHistory(initial, resetKey);

  return (
    <div>
      <output aria-label="state">{history.state}</output>
      <output aria-label="can undo">{String(history.canUndo)}</output>
      <output aria-label="can redo">{String(history.canRedo)}</output>
      <button type="button" onClick={() => history.set('B')}>
        set B
      </button>
      <button type="button" onClick={() => history.set('C', 'previous override')}>
        set C with previous
      </button>
      <button type="button" onClick={() => history.replace('R')}>
        replace R
      </button>
      <button type="button" onClick={history.undo}>
        undo
      </button>
      <button type="button" onClick={history.redo}>
        redo
      </button>
    </div>
  );
}

describe('useHistory', () => {
  it('sets, replaces, undoes and redoes state changes', async () => {
    const user = userEvent.setup();
    render(<HistoryHarness />);

    await user.click(screen.getByRole('button', { name: 'set B' }));
    expect(screen.getByLabelText('state')).toHaveTextContent('B');
    expect(screen.getByLabelText('can undo')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'replace R' }));
    expect(screen.getByLabelText('state')).toHaveTextContent('R');

    await user.click(screen.getByRole('button', { name: 'undo' }));
    expect(screen.getByLabelText('state')).toHaveTextContent('A');
    expect(screen.getByLabelText('can redo')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'redo' }));
    expect(screen.getByLabelText('state')).toHaveTextContent('R');
  });

  it('can store an explicit previous state and resets when resetKey changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<HistoryHarness initial="A" resetKey="one" />);

    await user.click(screen.getByRole('button', { name: 'set C with previous' }));
    await user.click(screen.getByRole('button', { name: 'undo' }));
    expect(screen.getByLabelText('state')).toHaveTextContent('previous override');

    rerender(<HistoryHarness initial="Z" resetKey="two" />);
    expect(screen.getByLabelText('state')).toHaveTextContent('Z');
    expect(screen.getByLabelText('can undo')).toHaveTextContent('false');
  });
});
