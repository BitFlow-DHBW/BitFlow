import { describe, expect, it } from 'vitest';
import { getAnnotationLayout } from './annotationLayout';

describe('getAnnotationLayout', () => {
  it('keeps short comments compact', () => {
    const layout = getAnnotationLayout('BitFlow Startschaltung');

    expect(layout.lines).toEqual(['BitFlow Startschaltung']);
    expect(layout.height).toBeLessThan(50);
    expect(layout.width).toBeGreaterThan(132);
  });

  it('adapts the width to very short comments', () => {
    const shortLayout = getAnnotationLayout('OK');
    const longerLayout = getAnnotationLayout('BitFlow Startschaltung');

    expect(shortLayout.width).toBeLessThan(longerLayout.width);
    expect(shortLayout.width).toBe(72);
  });

  it('expands the height when text wraps across multiple lines', () => {
    const layout = getAnnotationLayout('Dieser Kommentar ist lang genug, um automatisch auf mehrere Zeilen umbrochen zu werden.');

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.height).toBe(20 + layout.lines.length * 18);
    expect(layout.width).toBeLessThanOrEqual(280);
  });

  it('uses manual line breaks for the calculated height', () => {
    const layout = getAnnotationLayout('Erste Zeile\nZweite Zeile\nDritte Zeile');

    expect(layout.lines).toEqual(['Erste Zeile', 'Zweite Zeile', 'Dritte Zeile']);
    expect(layout.height).toBe(74);
  });
});
