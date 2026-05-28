import type { Circuit, SignalState } from '../../../types/circuit';

interface SimulationPanelProps {
  circuit: Circuit;
  signals: SignalState;
  inputSignals: SignalState;
  enabled: boolean;
  onToggleInput: (gateId: string) => void;
}

export function SimulationPanel({ circuit, signals, inputSignals, enabled, onToggleInput }: SimulationPanelProps) {
  const inputs = circuit.gates.filter((gate) => gate.type === 'INPUT' || gate.type === 'SWITCH' || gate.type === 'CLOCK');
  const outputs = circuit.gates.filter((gate) => gate.type === 'OUTPUT' || gate.type === 'LED');

  return (
    <section className="editor-panel simulation-panel">
      <div className="panel-heading">
        <p className="eyebrow">Simulation</p>
        <h2>Live-Signale</h2>
        {!enabled && <p className="muted">Eingänge lassen sich nur im Simulationsmodus schalten.</p>}
      </div>

      <div className="sim-group">
        <h3>Eingänge</h3>
        {inputs.length === 0 ? (
          <p className="muted">Keine Eingänge vorhanden.</p>
        ) : (
          inputs.map((gate) => (
            <button
              key={gate.id}
              className={`signal-toggle ${inputSignals[gate.id] ? 'is-on' : ''}`}
              type="button"
              disabled={!enabled}
              onClick={() => onToggleInput(gate.id)}
            >
              <span>{gate.label ?? gate.type}</span>
              <strong>{inputSignals[gate.id] ? '1' : '0'}</strong>
            </button>
          ))
        )}
      </div>

      <div className="sim-group">
        <h3>Ausgänge</h3>
        {outputs.length === 0 ? (
          <p className="muted">Keine Ausgänge vorhanden.</p>
        ) : (
          outputs.map((gate) => (
            <div key={gate.id} className={`signal-readout ${signals[gate.id] ? 'is-on' : ''}`}>
              <span>{gate.label ?? gate.type}</span>
              <strong>{signals[gate.id] ? '1' : '0'}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
