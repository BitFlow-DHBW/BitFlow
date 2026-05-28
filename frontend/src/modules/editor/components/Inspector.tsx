import { useState } from 'react';
import { canConfigureInputs, canConfigureOutputs, configureGatePins, createTruthTableRows } from '../../../simulation/gateLibrary';
import type { Circuit, Gate, Pin, TruthTableRow } from '../../../types/circuit';
import { GenericTruthTableDialog } from './GenericTruthTableDialog';

interface InspectorProps {
  circuit: Circuit;
  selectedGate: Gate | null;
  onUpdateGate: (gate: Gate) => void;
}

function updatePinLabel(gate: Gate, pin: Pin, label: string): Gate {
  const update = (entry: Pin) => (entry.id === pin.id ? { ...entry, label, name: label } : entry);
  return {
    ...gate,
    inputs: gate.inputs.map(update),
    outputs: gate.outputs.map(update),
  };
}

export function Inspector({ circuit, selectedGate, onUpdateGate }: InspectorProps) {
  const [truthTableDialogOpen, setTruthTableDialogOpen] = useState(false);
  const customComponent = selectedGate?.customComponentId
    ? circuit.customComponents.find((component) => component.id === selectedGate.customComponentId)
    : null;

  function updateGenericTruthTable(rows: TruthTableRow[]) {
    if (!selectedGate || selectedGate.type !== 'GENERIC') return;
    onUpdateGate({
      ...selectedGate,
      truthTable: createTruthTableRows(selectedGate.inputs.length, selectedGate.outputs.length, rows),
    });
  }

  return (
    <section className="editor-panel inspector-panel">
      <div className="panel-heading">
        <p className="eyebrow">Inspektor</p>
        <h2>Eigenschaften</h2>
      </div>

      {!selectedGate ? (
        <div className="empty-panel">
          <p>Kein Baustein ausgewählt.</p>
          <span>
            {circuit.gates.length} Komponenten · {circuit.wires.length} Leitungen
          </span>
        </div>
      ) : (
        <div className="inspector-form">
          <label>
            Bezeichnung
            <input
              value={selectedGate.label ?? selectedGate.type}
              onChange={(event) => onUpdateGate({ ...selectedGate, label: event.target.value })}
            />
          </label>

          <div className="inspector-inline">
            <label>
              Referenz
              <input
                value={selectedGate.reference ?? ''}
                onChange={(event) => onUpdateGate({ ...selectedGate, reference: event.target.value })}
              />
            </label>
            <label>
              Wert
              <input
                value={selectedGate.value ?? ''}
                onChange={(event) => onUpdateGate({ ...selectedGate, value: event.target.value })}
              />
            </label>
          </div>

          {(canConfigureInputs(selectedGate) || canConfigureOutputs(selectedGate)) && (
            <>
              <div className="inspector-inline">
                {canConfigureInputs(selectedGate) && (
                  <label>
                    Eingänge
                    <input
                      type="number"
                      min={0}
                      max={16}
                      value={selectedGate.inputs.length}
                      onChange={(event) =>
                        onUpdateGate(configureGatePins(selectedGate, Number(event.target.value), selectedGate.outputs.length))
                      }
                    />
                  </label>
                )}
                {canConfigureOutputs(selectedGate) && (
                  <label>
                    Ausgänge
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={selectedGate.outputs.length}
                      onChange={(event) =>
                        onUpdateGate(configureGatePins(selectedGate, selectedGate.inputs.length, Number(event.target.value)))
                      }
                    />
                  </label>
                )}
              </div>

              {selectedGate.type === 'GENERIC' && (
                <div className="generic-truth-table-actions">
                  <button className="secondary-button" type="button" onClick={() => setTruthTableDialogOpen(true)}>
                    Wahrheitstabelle erstellen
                  </button>
                </div>
              )}
            </>
          )}

          <div className="property-grid">
            <span>Typ</span>
            <strong>{selectedGate.type}</strong>
            {customComponent && (
              <>
                <span>Baustein</span>
                <strong>{customComponent.name}</strong>
              </>
            )}
            <span>X/Y</span>
            <strong>
              {selectedGate.x} / {selectedGate.y}
            </strong>
            <span>Pins</span>
            <strong>
              {selectedGate.inputs.length} Eingänge · {selectedGate.outputs.length} Ausgänge
            </strong>
          </div>

          <div className="pin-editor">
            {[...selectedGate.inputs, ...selectedGate.outputs].map((pin) => (
              <label key={pin.id}>
                {pin.direction === 'input' ? 'IN' : 'OUT'} {pin.index + 1}
                <input
                  value={pin.label ?? ''}
                  onChange={(event) => onUpdateGate(updatePinLabel(selectedGate, pin, event.target.value))}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedGate?.type === 'GENERIC' && truthTableDialogOpen && (
        <GenericTruthTableDialog
          gate={selectedGate}
          onClose={() => setTruthTableDialogOpen(false)}
          onSave={updateGenericTruthTable}
        />
      )}
    </section>
  );
}
