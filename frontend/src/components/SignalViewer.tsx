import React from "react";

interface Props {
  signals: Record<string, boolean>;
}

export default function SignalViewer({ signals }: Props) {
  return (
    <div className="p-2 border-t dark:border-gray-700">
      <h4 className="font-semibold">Signal Viewer</h4>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(signals).map(([pin, val]) => (
          <div key={pin} className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm">
            <div className="text-sm text-gray-500">{pin}</div>
            <div className={`mt-1 font-mono ${val ? "text-green-500" : "text-red-500"}`}>{val ? "1" : "0"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
