import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { projectService } from '../../services/projectService';
import type { Project } from '../../types/domain';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('Meine erste Schaltung');
  const [description, setDescription] = useState('');

  async function loadProjects() {
    if (!user) return;
    setProjects(await projectService.listProjects(user.id));
  }

  useEffect(() => {
    void loadProjects();
  }, [user]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const project = await projectService.createProject(user.id, name, description);
    setName('Meine erste Schaltung');
    setDescription('');
    navigate(`/editor/${project.id}`);
  }

  async function handleDelete(projectId: string) {
    if (!user) return;
    await projectService.deleteProject(user.id, projectId);
    await loadProjects();
  }

  return (
    <main className="page-shell">
      <section className="page-header split-header">
        <div>
          <p className="eyebrow">Projektverwaltung</p>
          <h1>Schaltungen und Workspaces</h1>
          <p>Projekte werden aktuell lokal gespeichert. Die Service-Schicht ist für REST/ASP.NET vorbereitet.</p>
        </div>
      </section>

      <div className="projects-layout">
        <section className="project-grid" aria-label="Projektliste">
          {projects.length === 0 ? (
            <div className="empty-state">
              <h2>Noch keine Projekte</h2>
              <p>Erstelle links dein erstes Projekt und öffne direkt den Editor.</p>
            </div>
          ) : (
            projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div>
                  <p className="project-meta">{formatDate(project.updatedAt)}</p>
                  <h2>{project.name}</h2>
                  <p>{project.description || 'Keine Beschreibung hinterlegt.'}</p>
                </div>
                <div className="project-stats">
                  <span>{project.circuit.gates.length} Gates</span>
                  <span>{project.circuit.wires.length} Wires</span>
                </div>
                <div className="card-actions">
                  <button className="primary-button" type="button" onClick={() => navigate(`/editor/${project.id}`)}>
                    Öffnen
                  </button>
                  <button className="ghost-button danger" type="button" onClick={() => void handleDelete(project.id)}>
                    Löschen
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        <aside className="project-sidebar">
          <form className="side-panel stack-form" onSubmit={handleCreate}>
            <h2>Neues Projekt</h2>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Beschreibung
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
            </label>
            <button className="primary-button" type="submit">
              Projekt erstellen
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
