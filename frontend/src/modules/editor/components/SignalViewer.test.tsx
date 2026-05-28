import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SignalViewer } from './SignalViewer';
import { circuitWith, gate } from '../../../test/builders';

describe('SignalViewer', () => {
  it('lists output pins as binary signal values', () => {
    const input = gate('INPUT', 'input_signal');
    const andGate = gate('AND', 'and_signal');

    render(<SignalViewer circuit={circuitWith([input, andGate])} signals={{ [input.outputs[0].id]: true }} />);

    expect(screen.getByText('Eingang.OUT')).toBeInTheDocument();
    expect(screen.getByText('AND.Y')).toBeInTheDocument();
    expect(screen.getByText('1')).toHaveClass('is-on');
  });

  it('shows an empty state when no output pins exist', () => {
    render(<SignalViewer circuit={circuitWith([])} signals={{}} />);

    expect(screen.getByText('Keine Ausgangs-Pins vorhanden.')).toBeInTheDocument();
  });
});
