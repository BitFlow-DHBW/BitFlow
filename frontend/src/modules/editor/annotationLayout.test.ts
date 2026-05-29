import { describe, expect, it } from 'vitest';
import { GRID_SIZE } from '../../simulation/gateLibrary';
import { MAX_ANNOTATION_WIDTH, getAnnotationLayout, normalizeAnnotationWidth } from './annotationLayout';

describe('getAnnotationLayout', () => {
  it('keeps short comments compact', () => {
    const layout = getAnnotationLayout('BitFlow Startschaltung');

    expect(layout.lines).toEqual(['BitFlow Startschaltung']);
    expect(layout.height).toBe(2 * GRID_SIZE);
    expect(layout.width).toBeGreaterThan(132);
  });

  it('adapts the width to very short comments', () => {
    const shortLayout = getAnnotationLayout('OK');
    const longerLayout = getAnnotationLayout('BitFlow Startschaltung');

    expect(shortLayout.width).toBeLessThan(longerLayout.width);
    expect(shortLayout.width).toBe(3 * GRID_SIZE);
  });

  it('expands the height when text wraps across multiple lines', () => {
    const layout = getAnnotationLayout('Dieser Kommentar ist lang genug, um automatisch auf mehrere Zeilen umbrochen zu werden.');

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.height).toBe((layout.lines.length + 1) * GRID_SIZE);
    expect(layout.width).toBeLessThanOrEqual(MAX_ANNOTATION_WIDTH);
  });

  it('grows annotation widths in full grid columns', () => {
    const layout = getAnnotationLayout('Dieser Kommentar braucht etwas mehr Breite');

    expect(layout.width % GRID_SIZE).toBe(0);
  });

  it('uses a fixed annotation width to wrap lines', () => {
    const layout = getAnnotationLayout('Dieser Kommentar wird schmal umbrochen', 3 * GRID_SIZE);

    expect(layout.width).toBe(3 * GRID_SIZE);
    expect(layout.lines.length).toBeGreaterThan(1);
  });

  it('normalizes manually resized widths to the grid', () => {
    expect(normalizeAnnotationWidth(83)).toBe(3 * GRID_SIZE);
    expect(normalizeAnnotationWidth(84)).toBe(4 * GRID_SIZE);
  });

  it('allows manually resized comments to become much wider', () => {
    expect(normalizeAnnotationWidth(30 * GRID_SIZE)).toBe(30 * GRID_SIZE);
    expect(normalizeAnnotationWidth(MAX_ANNOTATION_WIDTH + 100)).toBe(MAX_ANNOTATION_WIDTH);
  });

  it('uses manual line breaks for the calculated height', () => {
    const layout = getAnnotationLayout('Erste Zeile\nZweite Zeile\nDritte Zeile');

    expect(layout.lines).toEqual(['Erste Zeile', 'Zweite Zeile', 'Dritte Zeile']);
    expect(layout.height).toBe(4 * GRID_SIZE);
  });

  it('keeps annotation heights aligned to the editor grid', () => {
    const layout = getAnnotationLayout('Eine\nZwei');

    expect(layout.height % GRID_SIZE).toBe(0);
  });

  it('centers text in each grid row with equal horizontal and vertical spacing', () => {
    const layout = getAnnotationLayout('Zentriert');

    expect(layout.paddingX).toBe(GRID_SIZE / 2);
    expect(layout.paddingY).toBe(GRID_SIZE / 2);
    expect(layout.lineHeight).toBe(GRID_SIZE);
  });
});
