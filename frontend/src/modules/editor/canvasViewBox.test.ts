import { describe, expect, it } from 'vitest';
import {
  CANVAS_ZOOM_STEP,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
  clampZoom,
  createDefaultViewBox,
  getViewBoxZoom,
  panViewBox,
  resizeViewBox,
  zoomViewBox,
} from './canvasViewBox';

const size = { width: 1280, height: 760 };

describe('canvasViewBox', () => {
  it('creates a default view and clamps zoom limits', () => {
    expect(createDefaultViewBox(size)).toEqual({ x: 0, y: 0, width: 1280, height: 760 });
    expect(clampZoom(0.05)).toBe(MIN_CANVAS_ZOOM);
    expect(clampZoom(10)).toBe(MAX_CANVAS_ZOOM);
    expect(clampZoom(Number.NaN)).toBe(1);
  });

  it('zooms around the focal point and preserves the pointer position', () => {
    const viewBox = createDefaultViewBox(size);
    const next = zoomViewBox(viewBox, { x: 640, y: 380 }, CANVAS_ZOOM_STEP, size);

    expect(getViewBoxZoom(next, size)).toBeCloseTo(CANVAS_ZOOM_STEP);
    expect(next.width).toBeLessThan(viewBox.width);
    expect(next.x + next.width / 2).toBeCloseTo(640);
    expect(next.y + next.height / 2).toBeCloseTo(380);
  });

  it('pans by converting screen movement into viewBox movement', () => {
    const viewBox = createDefaultViewBox(size);

    expect(panViewBox(viewBox, { x: 48, y: -24 }, size)).toEqual({
      x: -48,
      y: 24,
      width: 1280,
      height: 760,
    });
  });

  it('updates the default view when the canvas is resized', () => {
    expect(resizeViewBox(createDefaultViewBox(size), size, { width: 900, height: 600 })).toEqual({
      x: 0,
      y: 0,
      width: 900,
      height: 600,
    });
  });

  it('preserves zoom and center for resized non-default views', () => {
    const zoomed = zoomViewBox(createDefaultViewBox(size), { x: 640, y: 380 }, 2, size);
    const resized = resizeViewBox(zoomed, size, { width: 900, height: 600 });

    expect(getViewBoxZoom(resized, { width: 900, height: 600 })).toBeCloseTo(2);
    expect(resized.x + resized.width / 2).toBeCloseTo(640);
    expect(resized.y + resized.height / 2).toBeCloseTo(380);
  });
});
