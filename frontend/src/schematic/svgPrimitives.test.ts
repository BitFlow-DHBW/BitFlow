import { describe, expect, it } from 'vitest';
import { componentSymbolSvg, escapeSvgText, orthogonalPath } from './svgPrimitives';
import { isIndicatorGate, isInteractiveSourceGate, symbolGeometry } from './symbolGeometry';
import { gate } from '../test/builders';

describe('schematic SVG helpers', () => {
  it('escapes user-controlled labels before inserting SVG markup', () => {
    expect(escapeSvgText('<bad attr="x">&')).toBe('&lt;bad attr=&quot;x&quot;&gt;&amp;');

    const svg = componentSymbolSvg({ ...gate('AND', 'and_svg'), label: '<script>' });
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).not.toContain('<script>');
  });

  it('renders operator labels for built-in logic symbols', () => {
    expect(componentSymbolSvg(gate('AND', 'and_svg'))).toContain('AND');
    expect(componentSymbolSvg(gate('OR', 'or_svg'))).toContain('OR');
    expect(componentSymbolSvg(gate('XOR', 'xor_svg'))).toContain('XOR');
    expect(componentSymbolSvg(gate('NOT', 'not_svg'))).toContain('NOT');
    expect(componentSymbolSvg(gate('DFF', 'dff_svg'))).toContain('DFF');
    expect(componentSymbolSvg(gate('TFF', 'tff_svg'))).toContain('TFF');
    expect(componentSymbolSvg(gate('JKFF', 'jk_svg'))).toContain('JK');
    expect(componentSymbolSvg(gate('INPUT', 'input_svg'))).toContain('Input Pin');
  });

  it('builds orthogonal paths and symbol geometry from gate dimensions', () => {
    const input = gate('INPUT', 'input_geometry', 24, 48);

    expect(orthogonalPath({ x: 0, y: 10 }, { x: 100, y: 50 })).toBe('M 0 10 L 50 10 L 50 50 L 100 50');
    expect(symbolGeometry(input)).toMatchObject({
      width: 72,
      height: 48,
      bodyX: 32,
      bodyY: 56,
    });
  });

  it('identifies indicators and interactive source gates', () => {
    expect(isIndicatorGate(gate('OUTPUT', 'output_gate'))).toBe(true);
    expect(isIndicatorGate({ ...gate('OUTPUT', 'legacy_led'), type: 'LED' })).toBe(true);
    expect(isInteractiveSourceGate(gate('INPUT', 'input_gate'))).toBe(true);
    expect(isInteractiveSourceGate({ ...gate('INPUT', 'legacy_clock'), type: 'CLOCK' })).toBe(true);
    expect(isInteractiveSourceGate(gate('AND', 'and_gate'))).toBe(false);
  });
});
