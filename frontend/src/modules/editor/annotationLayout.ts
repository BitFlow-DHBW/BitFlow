import { GRID_SIZE } from '../../simulation/gateLibrary';

const MAX_LINE_CHARS = 30;
const MIN_WIDTH = GRID_SIZE * 3;
const MAX_WIDTH = GRID_SIZE * 12;
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

function splitLongWord(word: string): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < word.length; start += MAX_LINE_CHARS) {
    chunks.push(word.slice(start, start + MAX_LINE_CHARS));
  }
  return chunks;
}

function wrapParagraph(paragraph: string): string[] {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (word.length > MAX_LINE_CHARS) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      lines.push(...splitLongWord(word));
      continue;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= MAX_LINE_CHARS) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function gridAlignedWidth(contentWidth: number): number {
  const unclampedWidth = Math.max(MIN_WIDTH, contentWidth);
  return Math.min(MAX_WIDTH, Math.ceil(unclampedWidth / GRID_SIZE) * GRID_SIZE);
}

export function getAnnotationLayout(text: string): AnnotationLayout {
  const paragraphs = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = paragraphs.flatMap(wrapParagraph);
  const visibleLines = lines.length > 0 ? lines : [''];
  const longestLineLength = Math.max(1, ...visibleLines.map((line) => line.length));

  return {
    lines: visibleLines,
    width: gridAlignedWidth(longestLineLength * CHAR_WIDTH + PADDING_X + PADDING_RIGHT),
    height: (visibleLines.length + 1) * GRID_SIZE,
    paddingX: PADDING_X,
    paddingY: PADDING_Y,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  };
}
