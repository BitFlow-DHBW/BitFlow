import { GATE_TEMPLATES } from '../../../simulation/gateLibrary';
import type { BuiltInGateType, CustomComponent, EditorTool } from '../../../types/circuit';

interface LibraryProps {
  customComponents: CustomComponent[];
  selectedTool: EditorTool | null;
  onSelectTool: (tool: EditorTool | null) => void;
  onToolDragStart: (tool: EditorTool) => void;
  onToolDragEnd: () => void;
}

function isBuiltInTool(selectedTool: EditorTool | null, type: BuiltInGateType): boolean {
  return selectedTool?.kind === 'builtin' && selectedTool.type === type;
}

function isCustomTool(selectedTool: EditorTool | null, componentId: string): boolean {
  return selectedTool?.kind === 'custom' && selectedTool.componentId === componentId;
}

function startToolDrag(event: React.DragEvent<HTMLButtonElement>, tool: EditorTool, onToolDragStart: (tool: EditorTool) => void) {
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/x-bitflow-tool', JSON.stringify(tool));
  onToolDragStart(tool);
}

export function Library({ customComponents, selectedTool, onSelectTool, onToolDragStart, onToolDragEnd }: LibraryProps) {
  return (
    <aside className="editor-panel library-panel">
      <div className="panel-heading">
        <p className="eyebrow">Library</p>
        <h2>Bausteine</h2>
      </div>
      <button
        className={`tool-tile ${selectedTool === null ? 'is-selected' : ''}`}
        type="button"
        onClick={() => onSelectTool(null)}
      >
        <span>↖</span>
        <strong>Auswahl</strong>
        <small>Verschieben und auswählen</small>
      </button>

      <div className="tool-list">
        {GATE_TEMPLATES.map((template) => (
          <button
            key={template.type}
            className={`tool-tile ${isBuiltInTool(selectedTool, template.type) ? 'is-selected' : ''}`}
            type="button"
            draggable
            onDragStart={(event) => startToolDrag(event, { kind: 'builtin', type: template.type }, onToolDragStart)}
            onDragEnd={onToolDragEnd}
            onClick={() => onSelectTool({ kind: 'builtin', type: template.type })}
          >
            <span>{template.type === 'INPUT' ? 'I' : template.type === 'OUTPUT' ? 'O' : template.type}</span>
            <strong>{template.label}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>

      <div className="panel-heading custom-heading">
        <p className="eyebrow">Custom</p>
        <h2>Eigene Bausteine</h2>
      </div>
      <div className="tool-list">
        {customComponents.length === 0 ? (
          <p className="muted tool-empty">Noch keine eigenen Bausteine.</p>
        ) : (
          customComponents.map((component) => (
            <button
              key={component.id}
              className={`tool-tile custom-tool ${isCustomTool(selectedTool, component.id) ? 'is-selected' : ''}`}
              type="button"
              draggable
              onDragStart={(event) => startToolDrag(event, { kind: 'custom', componentId: component.id }, onToolDragStart)}
              onDragEnd={onToolDragEnd}
              onClick={() => onSelectTool({ kind: 'custom', componentId: component.id })}
            >
              <span>C</span>
              <strong>{component.name}</strong>
              <small>
                {component.inputLabels.length} in · {component.outputLabels.length} out
              </small>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
