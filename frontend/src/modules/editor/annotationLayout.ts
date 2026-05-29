import { GRID_SIZE } from '../../simulation/gateLibrary';

const DEFAULT_LINE_CHARS = 30;
export const MIN_ANNOTATION_WIDTH = GRID_SIZE * 3;
export const MAX_ANNOTATION_WIDTH = GRID_SIZE * 32;
const CHAR_WIDTH = 7.2;
const PADDING_X = GRID_SIZE / 2;
const PADDING_RIGHT = GRID_SIZE / 16;
const PADDING_Y = GRID_SIZE / 2;
const FONT_SIZE = 12;
const LINE_HEIGHT = GRID_SIZE;

export interface AnnotationLayout {
  lines: string[];
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
  fontSize: number;
  lineHeight: number;
}

function splitLongWord(word: string, maxLineChars: number): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < word.length; start += maxLineChars) {
    chunks.push(word.slice(start, start + maxLineChars));
  }
  return chunks;
}

function wrapParagraph(paragraph: string, maxLineChars: number): string[] {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (word.length > maxLineChars) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      lines.push(...splitLongWord(word, maxLineChars));
      continue;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxLineChars) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

export function normalizeAnnotationWidth(width: number): number {
  const finiteWidth = Number.isFinite(width) ? width : MIN_ANNOTATION_WIDTH;
  const gridWidth = Math.round(finiteWidth / GRID_SIZE) * GRID_SIZE;
  return Math.min(MAX_ANNOTATION_WIDTH, Math.max(MIN_ANNOTATION_WIDTH, gridWidth));
}

function contentWidthToGridWidth(contentWidth: number): number {
  const unclampedWidth = Math.max(MIN_ANNOTATION_WIDTH, contentWidth);
  return Math.min(MAX_ANNOTATION_WIDTH, Math.ceil(unclampedWidth / GRID_SIZE) * GRID_SIZE);
}

function lineCapacityForWidth(width: number): number {
  const availableWidth = Math.max(CHAR_WIDTH, width - PADDING_X - PADDING_RIGHT);
  return Math.max(1, Math.floor(availableWidth / CHAR_WIDTH));
}

export function getAnnotationLayout(text: string, preferredWidth?: number): AnnotationLayout {
  const fixedWidth = preferredWidth === undefined ? null : normalizeAnnotationWidth(preferredWidth);
  const maxLineChars = fixedWidth ? lineCapacityForWidth(fixedWidth) : DEFAULT_LINE_CHARS;
  const paragraphs = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = paragraphs.flatMap((paragraph) => wrapParagraph(paragraph, maxLineChars));
  const visibleLines = lines.length > 0 ? lines : [''];
  const longestLineLength = Math.max(1, ...visibleLines.map((line) => line.length));

  return {
    lines: visibleLines,
    width: fixedWidth ?? contentWidthToGridWidth(longestLineLength * CHAR_WIDTH + PADDING_X + PADDING_RIGHT),
    height: (visibleLines.length + 1) * GRID_SIZE,
    paddingX: PADDING_X,
    paddingY: PADDING_Y,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  };
}
