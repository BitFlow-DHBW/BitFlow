import { createGate, createStarterCircuit, normalizeBuiltInGateType } from '../simulation/gateLibrary';
import { readStorage, writeStorage } from '../storage/localStorage';
import type { Circuit, CustomComponent, Gate, Pin, SignalState } from '../types/circuit';
import type { Project } from '../types/domain';
import { createId, nowIso } from '../utils/id';

const PROJECTS_KEY = 'bitflow.projects';

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
  return {
    ...project,
    inputSignals: normalizeInputSignals(project),
    circuit: {
      ...project.circuit,
      gates: project.circuit.gates.map(normalizeGate),
    },
  };
}

function readProjects(): Project[] {
  return readStorage<Project[]>(PROJECTS_KEY, []).map(normalizeProject);
}

function writeProjects(projects: Project[]): void {
  writeStorage(PROJECTS_KEY, projects);
}

export const projectService = {
  async listProjects(ownerId: string): Promise<Project[]> {
    return readProjects()
      .filter((project) => project.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getProject(ownerId: string, projectId: string): Promise<Project | null> {
    return readProjects().find((project) => project.ownerId === ownerId && project.id === projectId) ?? null;
  },

  async createProject(ownerId: string, name: string, description = ''): Promise<Project> {
    const createdAt = nowIso();
    const circuit = createStarterCircuit(name);
    const project: Project = {
      id: createId('project'),
      ownerId,
      name,
      description,
      circuit,
      inputSignals: {},
      customComponents: [],
      createdAt,
      updatedAt: createdAt,
    };

    writeProjects([project, ...readProjects()]);
    return project;
  },

  async updateProject(
    ownerId: string,
    projectId: string,
    patch: Partial<Pick<Project, 'name' | 'description' | 'inputSignals' | 'customComponents'>> & {
      circuit?: Circuit;
    },
  ): Promise<Project> {
    const projects = readProjects();
    const index = projects.findIndex((project) => project.ownerId === ownerId && project.id === projectId);
    if (index === -1) {
      throw new Error('Projekt wurde nicht gefunden.');
    }

    const nextProject: Project = {
      ...projects[index],
      ...patch,
      updatedAt: nowIso(),
    };

    const nextProjects = [...projects];
    nextProjects[index] = nextProject;
    writeProjects(nextProjects);
    return nextProject;
  },

  async deleteProject(ownerId: string, projectId: string): Promise<void> {
    writeProjects(readProjects().filter((project) => !(project.ownerId === ownerId && project.id === projectId)));
  },

  async addCustomComponent(ownerId: string, projectId: string, component: CustomComponent): Promise<Project> {
    const project = await this.getProject(ownerId, projectId);
    if (!project) {
      throw new Error('Projekt wurde nicht gefunden.');
    }

    return this.updateProject(ownerId, projectId, {
      customComponents: [...project.customComponents, component],
      circuit: {
        ...project.circuit,
        customComponents: [...project.circuit.customComponents, component],
      },
    });
  },
};
