import { endpointNodeId, normalizeWireEndpoint } from './wireUtils';
import type { Circuit, Net, WireEndpoint } from '../types/circuit';

class DisjointSet {
  private readonly parent = new Map<string, string>();

  find(id: string): string {
    if (!this.parent.has(id)) this.parent.set(id, id);
    const parent = this.parent.get(id);
    if (!parent || parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}

function collectPinIds(endpoint: WireEndpoint | null): string[] {
  return endpoint?.kind === 'pin' ? [endpoint.pinId] : [];
}

export function buildCircuitNets(circuit: Circuit): Net[] {
  const groups = new DisjointSet();

  for (const wire of circuit.wires) {
    const wireNode = `wire:${wire.id}`;
    const from = normalizeWireEndpoint(wire, 'from');
    const to = normalizeWireEndpoint(wire, 'to');
    if (from) groups.union(wireNode, endpointNodeId(from));
    if (to) groups.union(wireNode, endpointNodeId(to));
  }

  const netsByRoot = new Map<string, Net>();

  for (const wire of circuit.wires) {
    const root = groups.find(`wire:${wire.id}`);
    const from = normalizeWireEndpoint(wire, 'from');
    const to = normalizeWireEndpoint(wire, 'to');
    const net =
      netsByRoot.get(root) ??
      ({
        id: root,
        name: '',
        pinIds: [],
        wireIds: [],
      } satisfies Net);

    net.wireIds.push(wire.id);
    net.pinIds.push(...collectPinIds(from), ...collectPinIds(to));
    netsByRoot.set(root, net);
  }

  return [...netsByRoot.values()].map((net, index) => ({
    ...net,
    name: net.name || `N${index + 1}`,
    pinIds: [...new Set(net.pinIds)],
    wireIds: [...new Set(net.wireIds)],
  }));
}
