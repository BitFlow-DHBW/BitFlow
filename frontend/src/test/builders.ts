import { createGate } from '../simulation/gateLibrary';
import type { BuiltInGateType, Circuit, CustomComponent, Gate, Wire } from '../types/circuit';
import type { Project, User } from '../types/domain';

export function emptyCircuit(overrides: Partial<Circuit> = {}): Circuit {
  return {
    id: 'circuit_test',
    name: 'Test Circuit',
    version: 1,
    gates: [],
    wires: [],
    labels: [],
    annotations: [],
    customComponents: [],
    ...overrides,
  };
}

export function gate(type: BuiltInGateType, id: string, x = 0, y = 0): Gate {
  return createGate(type, x, y, id);
}

export function wire(id: string, source: Gate, sourcePin = 0, target?: Gate, targetPin = 0): Wire {
  const output = source.outputs[sourcePin];
  const input = target?.inputs[targetPin];

  return {
    id,
    from: output ? { kind: 'pin', pinId: output.id } : undefined,
    to: input ? { kind: 'pin', pinId: input.id } : undefined,
    sourcePinId: output?.id,
    targetPinId: input?.id,
    points: [],
  };
}

export function circuitWith(gates: Gate[], wires: Wire[] = [], overrides: Partial<Circuit> = {}): Circuit {
  return emptyCircuit({ gates, wires, ...overrides });
}

export function testUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user_test',
    name: 'Ada Lovelace',
    email: 'ada@bitflow.test',
    createdAt: '2026-05-01T08:00:00.000Z',
    ...overrides,
  };
}

export function testProject(overrides: Partial<Project> = {}): Project {
  const ownerId = overrides.ownerId ?? 'user_test';

  return {
    id: 'project_test',
    ownerId,
    name: 'CPU Playground',
    description: 'A local test project',
    circuit: emptyCircuit(),
    inputSignals: {},
    customComponents: [],
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T09:00:00.000Z',
    ...overrides,
  };
}

export function customComponent(overrides: Partial<CustomComponent> = {}): CustomComponent {
  return {
    id: 'custom_half_adder',
    name: 'Half Adder',
    description: 'XOR sum plus carry',
    inputLabels: ['A', 'B'],
    outputLabels: ['SUM', 'CARRY'],
    truthTable: [
      { inputs: [false, false], outputs: [false, false] },
      { inputs: [false, true], outputs: [true, false] },
      { inputs: [true, false], outputs: [true, false] },
      { inputs: [true, true], outputs: [false, true] },
    ],
    createdAt: '2026-05-01T10:00:00.000Z',
    ...overrides,
  };
}
