import type { Annotation } from '../../types/circuit';

export const DEFAULT_ANNOTATION_WIDTH = 220;
export const DEFAULT_ANNOTATION_HEIGHT = 96;
export const MIN_ANNOTATION_WIDTH = 120;
export const MIN_ANNOTATION_HEIGHT = 56;

export function annotationSize(annotation: Annotation): { width: number; height: number } {
  return {
    width: Math.max(MIN_ANNOTATION_WIDTH, annotation.width ?? DEFAULT_ANNOTATION_WIDTH),
    height: Math.max(MIN_ANNOTATION_HEIGHT, annotation.height ?? DEFAULT_ANNOTATION_HEIGHT),
  };
}
