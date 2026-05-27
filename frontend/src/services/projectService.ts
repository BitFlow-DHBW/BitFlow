import { createGate, createStarterCircuit, normalizeBuiltInGateType } from '../simulation/gateLibrary';
import { ApiError, apiService } from './apiService';
import type { Circuit, CustomComponent, Gate, Pin, SignalState } from '../types/circuit';
import type { Project } from '../types/domain';

const DEPRECATED_DEFAULT_LABELS: Partial<Record<Gate['type'], string>> = {
  SWITCH: 'Switch',
  LED: 'LED',
  CLOCK: 'Clock',
  VCC: 'VCC',
  GND: 'GND',
};

function preservePins(nextPins: Pin[], previousPins: Pin[]): Pin[] {
  return nextPins.map((pin, index) => {
    const previousPin = previousPins[index];
    if (!previousPin) return pin;

    return {
      ...pin,
      label: previousPin.label ?? pin.label,
      name: previousPin.name ?? previousPin.label ?? pin.name,
      electricalType: previousPin.electricalType ?? pin.electricalType,
    };
  });
}

function normalizeGate(gate: Gate): Gate {
  if (gate.type === 'CUSTOM') return gate;

  const nextType = normalizeBuiltInGateType(gate.type);
  if (nextType === gate.type) return gate;

  const normalized = createGate(nextType, gate.x, gate.y, gate.id);
  const defaultLabel = DEPRECATED_DEFAULT_LABELS[gate.type];
  const keepLabel = Boolean(gate.label && gate.label !== defaultLabel);

  return {
    ...normalized,
    label: keepLabel ? gate.label : normalized.label,
    reference: gate.reference ?? normalized.reference,
    value: gate.value ?? normalized.value,
    symbol: gate.symbol,
    inputs: preservePins(normalized.inputs, gate.inputs),
    outputs: preservePins(normalized.outputs, gate.outputs),
  };
}

function normalizeInputSignals(project: Project): SignalState {
  const nextSignals = { ...project.inputSignals };

  for (const gate of project.circuit.gates) {
    if (gate.type === 'VCC') nextSignals[gate.id] = true;
    if (gate.type === 'GND') nextSignals[gate.id] = false;
  }

  return nextSignals;
}

function normalizeProject(project: Project): Project {
  const customComponents = project.customComponents ?? project.circuit.customComponents ?? [];

  return {
    ...project,
    customComponents,
    inputSignals: normalizeInputSignals(project),
    circuit: {
      ...project.circuit,
      customComponents,
      gates: project.circuit.gates.map(normalizeGate),
    },
  };
}

export const projectService = {
  async listProjects(): Promise<Project[]> {
    const { data: projects } = await apiService.get<Project[]>('/projects');
    return projects.map(normalizeProject);
  },

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const { data: project } = await apiService.get<Project>(`/projects/${encodeURIComponent(projectId)}`);
      return normalizeProject(project);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async createProject(name: string, description = ''): Promise<Project> {
    const circuit = createStarterCircuit(name);

    const { data: project } = await apiService.post<Project>('/projects', {
      name,
      description,
      circuit,
      inputSignals: {},
      customComponents: [],
    });

    return normalizeProject(project);
  },

  async updateProject(
    projectId: string,
    patch: Partial<Pick<Project, 'name' | 'description' | 'inputSignals' | 'customComponents'>> & {
      circuit?: Circuit;
    },
  ): Promise<Project> {
    const { data: project } = await apiService.put<Project>(`/projects/${encodeURIComponent(projectId)}`, patch);
    return normalizeProject(project);
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiService.delete<void>(`/projects/${encodeURIComponent(projectId)}`);
  },

  async addCustomComponent(projectId: string, component: CustomComponent): Promise<Project> {
    const { data: project } = await apiService.post<Project>(
      `/projects/${encodeURIComponent(projectId)}/components`,
      component,
    );
    return normalizeProject(project);
  },
};
