import React from "react";

interface Props {
  onSave: () => void;
  onLoad: () => void;
  onSimulate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
}

export default function Toolbar({ onSave, onLoad, onSimulate, onUndo, onRedo, canUndo, canRedo, onClear }: Props) {
  return (
    <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800">
      <button className="btn" onClick={onSave}>Save</button>
      <button className="btn" onClick={onLoad}>Load</button>
      <button className="btn" onClick={onSimulate}>Simulate</button>
      <button className="btn" onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button className="btn" onClick={onRedo} disabled={!canRedo}>Redo</button>
      <button className="btn" onClick={onClear}>Clear</button>
    </div>
  );
}
