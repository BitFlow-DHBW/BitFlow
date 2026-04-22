import React from "react";

export default function SettingsPanel() {
  const [dark, setDark] = React.useState(() => localStorage.getItem("bitflow:dark") === "1");
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("bitflow:dark", dark ? "1" : "0");
    } catch {
      // localStorage disabled: ignore
    }
  }, [dark]);

  return (
    <div className="p-2 border-l dark:border-gray-700">
      <h4 className="font-semibold">Settings</h4>
      <label className="flex items-center gap-2 mt-2">
        <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
        Dark Mode
      </label>
    </div>
  );
}
