import type { Circuit, SignalState } from '../../../types/circuit';

interface SignalViewerProps {
  circuit: Circuit;
  signals: SignalState;
}

export function SignalViewer({ circuit, signals }: SignalViewerProps) {
  const outputPins = circuit.gates.flatMap((gate) =>
    gate.outputs.map((pin) => ({
      id: pin.id,
      gateLabel: gate.label ?? gate.type,
      pinLabel: pin.label ?? `O${pin.index + 1}`,
      value: Boolean(signals[pin.id]),
    })),
  );

  return (
    <section className="editor-panel signal-viewer">
      <div className="panel-heading">
        <p className="eyebrow">SignalViewer</p>
        <h2>Pin-Zustände</h2>
      </div>
      <div className="signal-list">
        {outputPins.length === 0 ? (
          <p className="muted">Keine Output-Pins vorhanden.</p>
        ) : (
          outputPins.map((signal) => (
            <div key={signal.id} className="signal-row">
              <span>
                {signal.gateLabel}.{signal.pinLabel}
              </span>
              <strong className={signal.value ? 'is-on' : ''}>{signal.value ? '1' : '0'}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
