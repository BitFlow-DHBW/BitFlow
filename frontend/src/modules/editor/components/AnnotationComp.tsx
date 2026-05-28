import { useEffect, useRef } from 'react';
import { annotationSize } from '../annotations';
import type { Annotation, AnnotationResizeHandle, EditorMode } from '../../../types/circuit';

interface AnnotationCompProps {
  annotation: Annotation;
  selected: boolean;
  mode: EditorMode;
  onPointerDown: (
    event: React.PointerEvent<SVGGElement>,
    annotation: Annotation,
    resizeHandle: AnnotationResizeHandle | null,
  ) => void;
  onTextChange: (annotation: Annotation) => void;
}

const resizeHandles: AnnotationResizeHandle[] = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];

function isResizeHandle(value: string | null): value is AnnotationResizeHandle {
  return resizeHandles.includes(value as AnnotationResizeHandle);
}

function cursorForHandle(handle: AnnotationResizeHandle): string {
  if (handle === 'n' || handle === 's') return 'ns-resize';
  if (handle === 'e' || handle === 'w') return 'ew-resize';
  if (handle === 'ne' || handle === 'sw') return 'nesw-resize';
  return 'nwse-resize';
}

export function AnnotationComp({ annotation, selected, mode, onPointerDown, onTextChange }: AnnotationCompProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { width, height } = annotationSize(annotation);
  const handleSize = 10;
  const cornerSize = 12;
  const handles = [
    { handle: 'n' as const, x: annotation.x + cornerSize, y: annotation.y - handleSize / 2, width: width - cornerSize * 2, height: handleSize },
    { handle: 'e' as const, x: annotation.x + width - handleSize / 2, y: annotation.y + cornerSize, width: handleSize, height: height - cornerSize * 2 },
    { handle: 's' as const, x: annotation.x + cornerSize, y: annotation.y + height - handleSize / 2, width: width - cornerSize * 2, height: handleSize },
    { handle: 'w' as const, x: annotation.x - handleSize / 2, y: annotation.y + cornerSize, width: handleSize, height: height - cornerSize * 2 },
    { handle: 'nw' as const, x: annotation.x - cornerSize / 2, y: annotation.y - cornerSize / 2, width: cornerSize, height: cornerSize },
    { handle: 'ne' as const, x: annotation.x + width - cornerSize / 2, y: annotation.y - cornerSize / 2, width: cornerSize, height: cornerSize },
    { handle: 'se' as const, x: annotation.x + width - cornerSize / 2, y: annotation.y + height - cornerSize / 2, width: cornerSize, height: cornerSize },
    { handle: 'sw' as const, x: annotation.x - cornerSize / 2, y: annotation.y + height - cornerSize / 2, width: cornerSize, height: cornerSize },
  ];

  useEffect(() => {
    if (selected && annotation.text.length === 0) textareaRef.current?.focus();
  }, [annotation.id, annotation.text.length, selected]);

  return (
    <g
      className={`canvas-annotation-node ${selected ? 'is-selected' : ''}`}
      onPointerDown={(event) => {
        const handle = (event.target as Element).getAttribute('data-resize-handle');
        onPointerDown(event, annotation, isResizeHandle(handle) ? handle : null);
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <rect
        className="annotation-frame"
        x={annotation.x}
        y={annotation.y}
        width={width}
        height={height}
        rx={6}
      />
      <foreignObject x={annotation.x} y={annotation.y} width={width} height={height}>
        <div className="annotation-foreign">
          <textarea
            ref={textareaRef}
            aria-label="Kommentar"
            placeholder="Kommentar"
            readOnly={mode !== 'edit'}
            value={annotation.text}
            onChange={(event) => onTextChange({ ...annotation, text: event.target.value })}
          />
        </div>
      </foreignObject>
      {mode === 'edit' &&
        selected &&
        handles.map((entry) => (
          <rect
            key={entry.handle}
            className="annotation-resize-handle"
            data-resize-handle={entry.handle}
            x={entry.x}
            y={entry.y}
            width={Math.max(0, entry.width)}
            height={Math.max(0, entry.height)}
            style={{ cursor: cursorForHandle(entry.handle) }}
          />
        ))}
    </g>
  );
}
