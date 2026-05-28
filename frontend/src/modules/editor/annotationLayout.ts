const MAX_LINE_CHARS = 30;
const MIN_WIDTH = 72;
const MAX_WIDTH = 280;
const CHAR_WIDTH = 7.2;
const PADDING_X = 12;
const PADDING_Y = 10;
const FONT_SIZE = 12;
const LINE_HEIGHT = 18;

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

export function getAnnotationLayout(text: string): AnnotationLayout {
  const paragraphs = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = paragraphs.flatMap(wrapParagraph);
  const visibleLines = lines.length > 0 ? lines : [''];
  const longestLineLength = Math.max(1, ...visibleLines.map((line) => line.length));

  return {
    lines: visibleLines,
    width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(longestLineLength * CHAR_WIDTH + PADDING_X * 2))),
    height: PADDING_Y * 2 + visibleLines.length * LINE_HEIGHT,
    paddingX: PADDING_X,
    paddingY: PADDING_Y,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  };
}
