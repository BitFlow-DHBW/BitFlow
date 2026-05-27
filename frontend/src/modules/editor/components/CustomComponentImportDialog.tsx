import { useEffect, useMemo, useState } from 'react';
import { projectService } from '../../../services/projectService';
import type { CustomComponent } from '../../../types/circuit';
import type { Project } from '../../../types/domain';

interface CustomComponentImportDialogProps {
  currentProjectId: string;
  existingComponentIds: Set<string>;
  open: boolean;
  onClose: () => void;
  onImport: (component: CustomComponent) => void;
}

export function CustomComponentImportDialog({
  currentProjectId,
  existingComponentIds,
  open,
  onClose,
  onImport,
}: CustomComponentImportDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    setLoading(true);
    setError(false);

    async function loadProjects() {
      try {
        const loadedProjects = await projectService.listProjects();
        if (active) setProjects(loadedProjects);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, [open]);

  const otherProjects = useMemo(
    () => projects.filter((project) => project.id !== currentProjectId),
    [currentProjectId, projects],
  );
  const projectsWithComponents = useMemo(
    () => otherProjects.filter((project) => project.customComponents.length > 0),
    [otherProjects],
  );

  if (!open) return null;

  function handleImport(component: CustomComponent) {
    if (existingComponentIds.has(component.id)) return;
    onImport(component);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="import-component-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Custom Component</p>
            <h2 id="import-component-title">Baustein importieren</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schliessen">
            x
          </button>
        </div>

        {loading ? (
          <div className="component-summary">
            <p>Bausteine werden geladen.</p>
          </div>
        ) : error ? (
          <p className="form-error">Bausteine konnten nicht geladen werden.</p>
        ) : otherProjects.length === 0 ? (
          <div className="component-summary">
            <h3>Keine anderen Projekte vorhanden.</h3>
            <p>Lege zuerst ein weiteres Projekt mit einem Custom Gate an.</p>
          </div>
        ) : projectsWithComponents.length === 0 ? (
          <div className="component-summary">
            <h3>Keine Custom Gates gefunden.</h3>
            <p>In den anderen Projekten wurden noch keine Custom Gates erstellt.</p>
          </div>
        ) : (
          <div className="component-import-list">
            {projectsWithComponents.map((project) => (
              <section className="component-import-group" key={project.id} aria-labelledby={`project-${project.id}`}>
                <div className="panel-heading">
                  <p className="eyebrow">Projekt</p>
                  <h3 id={`project-${project.id}`}>{project.name}</h3>
                </div>
                <div className="component-import-items">
                  {project.customComponents.map((component) => {
                    const alreadyImported = existingComponentIds.has(component.id);
                    return (
                      <div className="component-import-row" key={component.id}>
                        <div>
                          <strong>{component.name}</strong>
                          <small>
                            {component.inputLabels.length} in · {component.outputLabels.length} out
                          </small>
                        </div>
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={alreadyImported}
                          onClick={() => handleImport(component)}
                        >
                          {alreadyImported ? 'Bereits importiert' : 'Hinzufuegen'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Schliessen
          </button>
        </div>
      </section>
    </div>
  );
}
