import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiService } from './apiService';
import { projectService } from './projectService';
import { circuitWith, customComponent, gate, testProject } from '../test/builders';

describe('projectService', () => {
  it('creates, lists and loads projects through the backend', async () => {
    const createdProject = testProject({ id: 'project_created', ownerId: 'user_a', name: 'ALU', description: 'Test circuit' });
    vi.spyOn(apiService, 'post').mockResolvedValueOnce({ data: createdProject, status: 201 });
    vi.spyOn(apiService, 'get')
      .mockResolvedValueOnce({ data: [createdProject], status: 200 })
      .mockResolvedValueOnce({ data: createdProject, status: 200 });

    const created = await projectService.createProject('ALU', 'Test circuit');
    const projects = await projectService.listProjects();
    const loaded = await projectService.getProject('project_created');

    expect(apiService.post).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        name: 'ALU',
        description: 'Test circuit',
        inputSignals: {},
        customComponents: [],
      }),
    );
    expect(created).toMatchObject({ id: 'project_created', ownerId: 'user_a', name: 'ALU' });
    expect(projects.map((project) => project.id)).toEqual(['project_created']);
    expect(loaded?.id).toBe('project_created');
  });

  it('updates, deletes and maps missing projects to null on load', async () => {
    const updatedProject = testProject({
      id: 'project_a',
      ownerId: 'user_a',
      name: 'Updated',
      inputSignals: { input_a: true },
    });
    vi.spyOn(apiService, 'put').mockResolvedValueOnce({ data: updatedProject, status: 200 });
    vi.spyOn(apiService, 'delete').mockResolvedValueOnce({ data: undefined, status: 204 });
    vi.spyOn(apiService, 'get').mockRejectedValueOnce(new ApiError('Projekt wurde nicht gefunden.', 404, {}));

    const updated = await projectService.updateProject('project_a', {
      name: 'Updated',
      inputSignals: { input_a: true },
    });

    expect(updated.name).toBe('Updated');
    expect(updated.inputSignals.input_a).toBe(true);
    await expect(projectService.getProject('missing')).resolves.toBeNull();
    await expect(projectService.deleteProject('project_a')).resolves.toBeUndefined();
    expect(apiService.delete).toHaveBeenCalledWith('/projects/project_a');
  });

  it('adds custom components through the project component endpoint', async () => {
    const component = customComponent({ id: 'component_a' });
    const updatedProject = testProject({
      id: 'project_a',
      ownerId: 'user_a',
      customComponents: [component],
      circuit: circuitWith([], [], { customComponents: [component] }),
    });
    vi.spyOn(apiService, 'post').mockResolvedValueOnce({ data: updatedProject, status: 200 });

    const updated = await projectService.addCustomComponent('project_a', component);

    expect(apiService.post).toHaveBeenCalledWith('/projects/project_a/components', component);
    expect(updated.customComponents).toEqual([component]);
    expect(updated.circuit.customComponents).toEqual([component]);
  });

  it('normalizes deprecated gates and VCC/GND input signals from saved projects', async () => {
    const switchGate = { ...gate('INPUT', 'switch_a'), type: 'SWITCH' as const, label: 'Custom Switch' };
    const ledGate = { ...gate('OUTPUT', 'led_y'), type: 'LED' as const };
    const vccGate = { ...gate('INPUT', 'vcc_a'), type: 'VCC' as const };
    const gndGate = { ...gate('INPUT', 'gnd_a'), type: 'GND' as const };
    const legacyProject = testProject({
      id: 'legacy_project',
      ownerId: 'user_a',
      circuit: circuitWith([switchGate, ledGate, vccGate, gndGate]),
      inputSignals: {},
    });
    vi.spyOn(apiService, 'get').mockResolvedValueOnce({ data: legacyProject, status: 200 });

    const loadedProject = await projectService.getProject('legacy_project');

    expect(loadedProject?.circuit.gates.map((entry) => entry.type)).toEqual(['INPUT', 'OUTPUT', 'INPUT', 'INPUT']);
    expect(loadedProject?.circuit.gates[0].label).toBe('Custom Switch');
    expect(loadedProject?.inputSignals).toMatchObject({ vcc_a: true, gnd_a: false });
  });
});
