import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { builtinGates } from "../data/builtinGates";
import GateNode from "./GateNode";

function renderSvg(element: ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  act(() => {
    root.render(<svg>{element}</svg>);
  });

  return { host, root };
}

function cleanup(root: Root, host: HTMLDivElement) {
  act(() => {
    root.unmount();
  });
  host.remove();
}

describe("GateNode", () => {
  it("renders a clickable SWITCH and calls the toggle handler", () => {
    const gate = builtinGates.SWITCH("sw1");
    const onToggleSwitch = jest.fn();
    const { host, root } = renderSvg(
      <GateNode
        gate={gate}
        onDrag={jest.fn()}
        onDelete={jest.fn()}
        onStartConnect={jest.fn()}
        onToggleSwitch={onToggleSwitch}
        signals={{}}
      />
    );

    const button = host.querySelector("button");

    expect(button?.textContent).toBe("OFF");
    expect(button?.getAttribute("aria-pressed")).toBe("false");

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onToggleSwitch).toHaveBeenCalledWith("sw1");

    cleanup(root, host);
  });

  it("visualizes an active LED signal", () => {
    const gate = builtinGates.LED("led1");
    const { host, root } = renderSvg(
      <GateNode
        gate={gate}
        onDrag={jest.fn()}
        onDelete={jest.fn()}
        onStartConnect={jest.fn()}
        onToggleSwitch={jest.fn()}
        signals={{ [gate.inputs[0].id]: true }}
      />
    );

    const led = host.querySelector("circle[aria-label='LED led1 on']");

    expect(led?.getAttribute("fill")).toBe("#22c55e");

    cleanup(root, host);
  });
});
