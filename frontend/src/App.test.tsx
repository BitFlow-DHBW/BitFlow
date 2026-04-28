import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

describe("App smoke test", () => {
  it("renders the editor shell with toolbar and gate library", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => {
      root.render(<App />);
    });

    expect(host.textContent).toContain("Save");
    expect(host.textContent).toContain("Simulate");
    expect(host.textContent).toContain("SWITCH");
    expect(host.textContent).toContain("LED");
    expect(host.textContent).toContain("Signal Viewer");

    act(() => {
      root.unmount();
    });
    host.remove();
  });
});
