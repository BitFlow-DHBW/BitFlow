import type { Point } from '../../types/circuit';

export interface CanvasSize {
  width: number;
  height: number;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MIN_CANVAS_ZOOM = 0.25;
export const MAX_CANVAS_ZOOM = 3;
export const CANVAS_ZOOM_STEP = 1.15;

export function createDefaultViewBox(size: CanvasSize): ViewBox {
  return {
    x: 0,
    y: 0,
    width: Math.max(1, size.width),
    height: Math.max(1, size.height),
  };
}

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, zoom));
}

export function getViewBoxZoom(viewBox: ViewBox, size: CanvasSize): number {
  if (viewBox.width <= 0) return 1;
  return clampZoom(Math.max(1, size.width) / viewBox.width);
}

export function zoomViewBox(viewBox: ViewBox, focalPoint: Point, scaleFactor: number, size: CanvasSize): ViewBox {
  const currentZoom = getViewBoxZoom(viewBox, size);
  const nextZoom = clampZoom(currentZoom * scaleFactor);
  const width = Math.max(1, size.width) / nextZoom;
  const height = Math.max(1, size.height) / nextZoom;
  const focalRatioX = viewBox.width === 0 ? 0.5 : (focalPoint.x - viewBox.x) / viewBox.width;
  const focalRatioY = viewBox.height === 0 ? 0.5 : (focalPoint.y - viewBox.y) / viewBox.height;

  return {
    x: focalPoint.x - width * focalRatioX,
    y: focalPoint.y - height * focalRatioY,
    width,
    height,
  };
}

export function panViewBox(viewBox: ViewBox, screenDelta: Point, size: CanvasSize): ViewBox {
  const scaleX = viewBox.width / Math.max(1, size.width);
  const scaleY = viewBox.height / Math.max(1, size.height);

  return {
    ...viewBox,
    x: viewBox.x - screenDelta.x * scaleX,
    y: viewBox.y - screenDelta.y * scaleY,
  };
}

export function resizeViewBox(viewBox: ViewBox, currentSize: CanvasSize, nextSize: CanvasSize): ViewBox {
  const nextDefaultViewBox = createDefaultViewBox(nextSize);
  const isDefaultView =
    viewBox.x === 0 &&
    viewBox.y === 0 &&
    viewBox.width === currentSize.width &&
    viewBox.height === currentSize.height;

  if (isDefaultView) return nextDefaultViewBox;

  const zoom = getViewBoxZoom(viewBox, currentSize);
  const width = Math.max(1, nextSize.width) / zoom;
  const height = Math.max(1, nextSize.height) / zoom;
  const center = {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };

  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  };
}
