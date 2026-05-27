import { buildWireEndpointGroups, normalizeWireEndpoint } from './wireUtils';
import type { Circuit, Net, WireEndpoint } from '../types/circuit';

function collectPinIds(endpoint: WireEndpoint | null): string[] {
  return endpoint?.kind === 'pin' ? [endpoint.pinId] : [];
}

export function buildCircuitNets(circuit: Circuit): Net[] {
  const groups = buildWireEndpointGroups(circuit);

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
