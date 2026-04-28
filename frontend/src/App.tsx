import React from "react";
import Toolbar from "./components/Toolbar";
import Library from "./components/Library";
import Canvas from "./components/Canvas";
import SettingsPanel from "./components/SettingsPanel";
import SignalViewer from "./components/SignalViewer";
import type { Circuit, Gate } from "./types/circuit";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { StorageService } from "./services/storageService";
import { simulate } from "./services/simulationEngine";
import { ExportButton, ImportButton } from "./components/ImportExport";

const initialCircuit: Circuit = { gates: [], connections: [], name: "untitled", version: 0 };

function toSignalRecord(pinMap: Map<string, boolean>) {
  const obj: Record<string, boolean> = {};
  pinMap.forEach((v, k) => (obj[k] = v));
  return obj;
}

export default function App() {
  const { present: circuit, set: setCircuit, undo, redo, canUndo, canRedo } = useUndoRedo(initialCircuit);
  const [signals, setSignals] = React.useState<Record<string, boolean>>({});

  const createGate = (g: Gate) => {
    setCircuit({ ...circuit, gates: [...circuit.gates, g] });
  };

  const moveGate = (id: string, x: number, y: number) => {
    const next = { ...circuit, gates: circuit.gates.map(g => g.id === id ? { ...g, x, y } : g) };
    setCircuit(next);
  };

  const deleteGate = (id: string) => {
    const next = {
      ...circuit,
      gates: circuit.gates.filter(g => g.id !== id),
      connections: circuit.connections.filter(c => c.fromGateId !== id && c.toGateId !== id)
    };
    setCircuit(next);
  };

  const toggleSwitch = (id: string) => {
    const next = {
      ...circuit,
      gates: circuit.gates.map(g => {
        if (g.id !== id || g.type !== "SWITCH") return g;
        const nextValue = !Boolean(g.outputs[0]?.value);

        return {
          ...g,
          outputs: g.outputs.map((pin, index) => index === 0 ? { ...pin, value: nextValue } : pin)
        };
      })
    };

    setCircuit(next);
  };

  const onSimulate = () => {
    setSignals(toSignalRecord(simulate(circuit)));
  };

  React.useEffect(() => {
    setSignals(toSignalRecord(simulate(circuit)));
  }, [circuit]);

  const onSave = () => {
    const name = prompt("Project name", circuit.name || "untitled") || "untitled";
    const toSave = { ...circuit, name };
    StorageService.saveLocal(name, toSave);
    setCircuit(toSave);
    alert("Saved");
  };

  const onLoad = () => {
    const list = StorageService.listLocal();
    const name = prompt("Load project name", list[0] || "");
    if (!name) return;
    const loaded = StorageService.loadLocal(name);
    if (loaded) setCircuit(loaded);
    else alert("Not found or invalid");
  };

  const onClear = () => {
    if (!confirm("Clear canvas?")) return;
    setCircuit({ ...circuit, gates: [], connections: [] });
  };

  const onImport = (c: Circuit) => {
    setCircuit(c);
  };
  
  return (
    <div className="h-screen flex flex-col dark:bg-gray-900 dark:text-white">
      <Toolbar onSave={onSave} onLoad={onLoad} onSimulate={onSimulate} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} onClear={onClear} />
      <div className="flex flex-1">
        <div className="w-48">
          <Library onCreate={createGate} />
          <div className="p-2">
            <ExportButton circuit={circuit} />
            <ImportButton onImport={onImport} />
          </div>
        </div>
        <Canvas
          circuit={circuit}
          onChange={setCircuit}
          //connecting={connecting}
          //onCreateConnection={createConnection}
          onDeleteGate={deleteGate}
          onMoveGate={moveGate}
          onToggleSwitch={toggleSwitch}
          signals={signals}
        />
        <div className="w-64 border-l p-2 dark:border-gray-700">
          <SettingsPanel />
          <div className="mt-4">
            <h4 className="font-semibold">Signals</h4>
            <SignalViewer signals={signals} />
          </div>
        </div>
      </div>
    </div>
  );
}
