import { useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import {
  componentInputLabels,
  componentOutputLabels,
  createCustomComponentFromCircuit,
} from '../../../simulation/customComponentFactory';
import type { Circuit, CustomComponent } from '../../../types/circuit';

interface CustomComponentDialogProps {
  circuit: Circuit;
  open: boolean;
  onClose: () => void;
  onCreate: (component: CustomComponent) => void;
}

export function CustomComponentDialog({ circuit, open, onClose, onCreate }: CustomComponentDialogProps) {
  const [name, setName] = useState('Eigener Baustein');
  const [description, setDescription] = useState('');

  const inputLabels = useMemo(() => componentInputLabels(circuit), [circuit]);
  const outputLabels = useMemo(() => componentOutputLabels(circuit), [circuit]);
  const truthTableRowCount = 2 ** inputLabels.length;
  const canCreate = outputLabels.length > 0;

  if (!open) return null;

  function handleCreate() {
    if (!canCreate) return;
    onCreate(createCustomComponentFromCircuit(circuit, { name, description }));
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="custom-component-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Eigener Baustein</p>
            <h2 id="custom-component-title">Schaltung als Baustein speichern</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen">
            <Icon name="x" />
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

        <div className="component-summary">
          <h3>Baustein aus aktueller Schaltung erstellen?</h3>
          <p>
            {inputLabels.length} Eingänge · {outputLabels.length} Ausgänge · {truthTableRowCount} automatisch erzeugte
            Tabellenzeilen
          </p>
          {!canCreate && <p className="form-error">Mindestens ein Ausgang wird benötigt.</p>}
        </div>

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button className="primary-button" type="button" onClick={handleCreate} disabled={!canCreate}>
            Baustein speichern
          </button>
        </div>
      </section>
    </div>
  );
}
