import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditorSidePanel } from './EditorSidePanel';

describe('EditorSidePanel', () => {
  it('renders expanded content and exposes a collapse action', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <EditorSidePanel side="left" label="Bibliothek" collapsed={false} onToggle={onToggle}>
        <button type="button">AND</button>
      </EditorSidePanel>,
    );

    expect(screen.getByRole('complementary', { name: 'Bibliothek' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AND' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Bibliothek einklappen' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('hides content when collapsed and exposes an expand action', () => {
    render(
      <EditorSidePanel side="right" label="Details" collapsed onToggle={vi.fn()}>
        <button type="button">Eigenschaft</button>
      </EditorSidePanel>,
    );

    expect(screen.getByRole('button', { name: 'Details öffnen' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Eigenschaft' })).not.toBeInTheDocument();
  });
});
