import { useEffect, useMemo, useState } from 'react';
import { createTruthTableRows } from '../../../simulation/gateLibrary';
import type { Gate, Pin, TruthTableRow } from '../../../types/circuit';
import { TruthTableEditor } from './TruthTableEditor';

interface GenericTruthTableDialogProps {
  gate: Gate;
  onClose: () => void;
  onSave: (rows: TruthTableRow[]) => void;
}

function pinLabel(pin: Pin, fallbackPrefix: string): string {
  return pin.label || pin.name || `${fallbackPrefix}${pin.index + 1}`;
}

export function GenericTruthTableDialog({ gate, onClose, onSave }: GenericTruthTableDialogProps) {
  const rows = useMemo(
    () => createTruthTableRows(gate.inputs.length, gate.outputs.length, gate.truthTable),
    [gate.inputs.length, gate.outputs.length, gate.truthTable],
  );
  const [draftRows, setDraftRows] = useState<TruthTableRow[]>(rows);
  const inputLabels = gate.inputs.map((pin) => pinLabel(pin, 'I'));
  const outputLabels = gate.outputs.map((pin) => pinLabel(pin, 'O'));

  useEffect(() => {
    setDraftRows(rows);
  }, [rows]);

  function handleSave() {
    onSave(createTruthTableRows(gate.inputs.length, gate.outputs.length, draftRows));
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal truth-table-modal" role="dialog" aria-modal="true" aria-labelledby="generic-truth-table-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Generic</p>
            <h2 id="generic-truth-table-title">Wahrheitstabelle erstellen</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen">
            x
          </button>
        </div>

        <div className="component-summary">
          <h3>
            {gate.inputs.length} in / {gate.outputs.length} out
          </h3>
          <p>{rows.length} Kombinationen</p>
        </div>

        <TruthTableEditor
          inputLabels={inputLabels}
          outputLabels={outputLabels}
          rows={draftRows}
          onChange={setDraftRows}
          readOnlyInputs
          allowAddRow={false}
        />

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button className="primary-button" type="button" onClick={handleSave}>
            Wahrheitstabelle speichern
          </button>
        </div>
      </section>
    </div>
  );
}
