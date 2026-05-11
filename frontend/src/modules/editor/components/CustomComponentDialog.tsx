import { useMemo, useState } from 'react';
import { TruthTableEditor } from './TruthTableEditor';
import type { Circuit, CustomComponent, TruthTableRow } from '../../../types/circuit';
import { createId, nowIso } from '../../../utils/id';

interface CustomComponentDialogProps {
  circuit: Circuit;
  open: boolean;
  onClose: () => void;
  onCreate: (component: CustomComponent) => void;
}

export function CustomComponentDialog({ circuit, open, onClose, onCreate }: CustomComponentDialogProps) {
  const [name, setName] = useState('Custom Gate');
  const [description, setDescription] = useState('');
  const [truthTable, setTruthTable] = useState<TruthTableRow[]>([]);

  const inputLabels = useMemo(
    () => circuit.gates.filter((gate) => gate.type === 'INPUT').map((gate, index) => gate.label ?? `I${index + 1}`),
    [circuit.gates],
  );
  const outputLabels = useMemo(
    () => circuit.gates.filter((gate) => gate.type === 'OUTPUT').map((gate, index) => gate.label ?? `O${index + 1}`),
    [circuit.gates],
  );

  if (!open) return null;

  function handleCreate() {
    onCreate({
      id: createId('custom'),
      name,
      description,
      inputLabels,
      outputLabels,
      truthTable,
      sourceCircuitId: circuit.id,
      createdAt: nowIso(),
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="custom-component-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Custom Component</p>
            <h2 id="custom-component-title">Schaltung als Baustein speichern</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen">
            ×
          </button>
        </div>

        <div className="stack-form">
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Beschreibung
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>
        </div>

        <TruthTableEditor
          inputLabels={inputLabels}
          outputLabels={outputLabels}
          rows={truthTable}
          onChange={setTruthTable}
        />

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button className="primary-button" type="button" onClick={handleCreate}>
            Baustein speichern
          </button>
        </div>
      </section>
    </div>
  );
}
