// src/components/Connection.tsx
import type { Circuit, Connection } from "../types/circuit";
import { snapValue } from "../utils/grid";

interface Props {
  conn: Connection;
  circuit: Circuit;
  strokeClass?: string;
}

function getPinAbsolute(circuit: Circuit, gateId: string, pinId: string) {
  const gate = circuit.gates.find(g => g.id === gateId);
  if (!gate) return null;

  const pin = [...gate.inputs, ...gate.outputs].find(p => p.id === pinId);
  if (!pin) return null;
  const ox = (pin.offsetX ?? (pin.type === "input" ? 0 : 1)) * gate.width;
  const oy = (pin.offsetY ?? 0.5) * gate.height;

  return { x: gate.x + ox, y: gate.y + oy };
}

export default function ConnectionView({ conn, circuit, strokeClass = "stroke-gray-800 dark:stroke-gray-200" }: Props) {
  const startPoint = getPinAbsolute(circuit, conn.fromGateId, conn.fromPinId);
  const endPoint = getPinAbsolute(circuit, conn.toGateId, conn.toPinId);
  if (!startPoint || !endPoint) return null;

  const midX = snapValue((startPoint.x + endPoint.x) / 2);
  
  const points = `${startPoint.x},${startPoint.y} ${midX},${startPoint.y} ${midX},${endPoint.y} ${endPoint.x},${endPoint.y}`;

  return <polyline points={points} fill="none" className={`${strokeClass} stroke-2 fill-none`} strokeLinecap="round" strokeLinejoin="round" />;
}
