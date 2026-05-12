import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectService } from './projectService';
import { circuitWith, customComponent, gate, testProject } from '../test/builders';

describe('projectService', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000101')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000102')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000103');
  });

  it('creates, lists and loads projects for the current owner only', async () => {
    window.localStorage.setItem(
      'bitflow.projects',
      JSON.stringify([
        testProject({ id: 'other_project', ownerId: 'other_user', updatedAt: '2026-05-03T09:00:00.000Z' }),
        testProject({ id: 'older_project', ownerId: 'user_a', updatedAt: '2026-05-01T09:00:00.000Z' }),
      ]),
    );

    const created = await projectService.createProject('user_a', 'ALU', 'Test circuit');
    const projects = await projectService.listProjects('user_a');

    expect(created).toMatchObject({
      id: 'project_00000000-0000-4000-8000-000000000102',
      ownerId: 'user_a',
      name: 'ALU',
      description: 'Test circuit',
    });
    expect(created.circuit.name).toBe('ALU');
    expect(projects.map((project) => project.id)).toEqual(['project_00000000-0000-4000-8000-000000000102', 'older_project']);
    await expect(projectService.getProject('other_user', created.id)).resolves.toBeNull();
  });

  it('updates, deletes and rejects missing projects', async () => {
    window.localStorage.setItem('bitflow.projects', JSON.stringify([testProject({ id: 'project_a', ownerId: 'user_a' })]));

    const updated = await projectService.updateProject('user_a', 'project_a', {
      name: 'Updated',
      inputSignals: { input_a: true },
    });

    expect(updated.name).toBe('Updated');
    expect(updated.inputSignals.input_a).toBe(true);
    await expect(projectService.updateProject('user_a', 'missing', { name: 'Nope' })).rejects.toThrow('nicht gefunden');

    await projectService.deleteProject('user_a', 'project_a');
    await expect(projectService.getProject('user_a', 'project_a')).resolves.toBeNull();
  });

  it('adds custom components to both the project and circuit metadata', async () => {
    window.localStorage.setItem('bitflow.projects', JSON.stringify([testProject({ id: 'project_a', ownerId: 'user_a' })]));

    const component = customComponent({ id: 'component_a' });
    const updated = await projectService.addCustomComponent('user_a', 'project_a', component);

    expect(updated.customComponents).toEqual([component]);
    expect(updated.circuit.customComponents).toEqual([component]);
    await expect(projectService.addCustomComponent('user_a', 'missing', component)).rejects.toThrow('nicht gefunden');
  });

  it('normalizes deprecated gates and VCC/GND input signals from saved projects', async () => {
    const switchGate = { ...gate('INPUT', 'switch_a'), type: 'SWITCH' as const, label: 'Custom Switch' };
    const ledGate = { ...gate('OUTPUT', 'led_y'), type: 'LED' as const };
    const vccGate = { ...gate('INPUT', 'vcc_a'), type: 'VCC' as const };
    const gndGate = { ...gate('INPUT', 'gnd_a'), type: 'GND' as const };

    window.localStorage.setItem(
      'bitflow.projects',
      JSON.stringify([
        testProject({
          id: 'legacy_project',
          ownerId: 'user_a',
          circuit: circuitWith([switchGate, ledGate, vccGate, gndGate]),
          inputSignals: {},
        }),
      ]),
    );

    const legacyProject = await projectService.getProject('user_a', 'legacy_project');

    expect(legacyProject?.circuit.gates.map((entry) => entry.type)).toEqual(['INPUT', 'OUTPUT', 'INPUT', 'INPUT']);
    expect(legacyProject?.circuit.gates[0].label).toBe('Custom Switch');
    expect(legacyProject?.inputSignals).toMatchObject({ vcc_a: true, gnd_a: false });
  });
});
