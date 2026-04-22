import React from "react";
import type { Circuit } from "../types/circuit";

export function ExportButton({ circuit }: { circuit: Circuit }) {
  const onExport = () => {
    const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (circuit.name || "circuit") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return <button className="btn" onClick={onExport}>Export JSON</button>;
}

export function ImportButton({ onImport }: { onImport: (c: Circuit) => void }) {
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Circuit;
        onImport(parsed);
      } catch {
        alert("Invalid file");
      }
    };
    reader.readAsText(f);
  };
  return <input type="file" accept="application/json" onChange={onFile} />;
}
