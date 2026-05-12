import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WireComp, wireBranchPoint, wirePath } from './WireComp';

describe('WireComp', () => {
  it('builds orthogonal snapped wire paths and branch points', () => {
    expect(wirePath({ x: 0, y: 10 }, { x: 100, y: 50 })).toBe('M 0 10 L 48 10 L 48 50 L 100 50');
    expect(wireBranchPoint({ x: 0, y: 10 }, { x: 100, y: 50 })).toEqual({ x: 48, y: 24 });
  });

  it('renders active, preview and selected classes and handles selection', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <svg>
        <WireComp from={{ x: 0, y: 0 }} to={{ x: 96, y: 96 }} active preview selected onSelect={onSelect} />
      </svg>,
    );

    const path = container.querySelector('path');
    expect(path).toHaveClass('wire', 'is-live', 'is-preview', 'is-selected');
    fireEvent.click(path as SVGPathElement);
    expect(onSelect).toHaveBeenCalled();
  });
});
