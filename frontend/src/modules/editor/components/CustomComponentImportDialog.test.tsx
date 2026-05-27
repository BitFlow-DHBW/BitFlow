import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomComponentImportDialog } from './CustomComponentImportDialog';
import { customComponent, testProject } from '../../../test/builders';
import { projectService } from '../../../services/projectService';

vi.mock('../../../services/projectService', () => ({
  projectService: {
    listProjects: vi.fn(),
  },
}));

describe('CustomComponentImportDialog', () => {
  beforeEach(() => {
    vi.mocked(projectService.listProjects).mockReset();
  });

  it('renders nothing while closed', () => {
    const { container } = render(
      <CustomComponentImportDialog
        currentProjectId="project_current"
        existingComponentIds={new Set()}
        open={false}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('groups custom gates by other projects and imports selected components', async () => {
    const user = userEvent.setup();
    const importedComponent = customComponent({ id: 'custom_other', name: 'Half Adder' });
    vi.mocked(projectService.listProjects).mockResolvedValue([
      testProject({ id: 'project_current', name: 'Current' }),
      testProject({ id: 'project_other', name: 'Logic Blocks', customComponents: [importedComponent] }),
    ]);
    const onImport = vi.fn();

    render(
      <CustomComponentImportDialog
        currentProjectId="project_current"
        existingComponentIds={new Set()}
        open
        onClose={vi.fn()}
        onImport={onImport}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Logic Blocks' })).toBeInTheDocument();
    expect(screen.getByText('Half Adder')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    expect(onImport).toHaveBeenCalledWith(importedComponent);
  });

  it('shows empty states for missing projects and missing custom gates', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValueOnce([testProject({ id: 'project_current' })]);
    const { rerender } = render(
      <CustomComponentImportDialog
        currentProjectId="project_current"
        existingComponentIds={new Set()}
        open
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(await screen.findByText('Keine anderen Projekte vorhanden.')).toBeInTheDocument();

    vi.mocked(projectService.listProjects).mockResolvedValueOnce([
      testProject({ id: 'project_current' }),
      testProject({ id: 'project_empty', name: 'Empty Project', customComponents: [] }),
    ]);
    rerender(
      <CustomComponentImportDialog
        currentProjectId="project_current"
        existingComponentIds={new Set()}
        open={false}
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    rerender(
      <CustomComponentImportDialog
        currentProjectId="project_current"
        existingComponentIds={new Set()}
        open
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    await waitFor(() => expect(projectService.listProjects).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Keine Custom Gates gefunden.')).toBeInTheDocument();
  });

  it('disables components that already exist in the current project', async () => {
    const component = customComponent({ id: 'custom_existing', name: 'Existing Gate' });
    vi.mocked(projectService.listProjects).mockResolvedValue([
      testProject({ id: 'project_current' }),
      testProject({ id: 'project_other', name: 'Other', customComponents: [component] }),
    ]);

    render(
      <CustomComponentImportDialog
        currentProjectId="project_current"
        existingComponentIds={new Set(['custom_existing'])}
        open
        onClose={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(await screen.findByRole('button', { name: 'Bereits importiert' })).toBeDisabled();
  });
});
