"use client";
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Archive, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { getProjectId, setProjectId } from '../utils/project-context';

interface ProjectMetadata {
  slug?: string;
  version?: string;
  owner?: string;
  team?: string;
  services?: string[];
  description?: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  metadata: ProjectMetadata;
  createdAt: string;
  updatedAt: string;
}

interface ProjectForm {
  name: string;
  version: string;
  owner: string;
  team: string;
  services: string;
  description: string;
}

const EMPTY_FORM: ProjectForm = {
  name: '',
  version: '1.0.0',
  owner: '',
  team: '',
  services: '',
  description: '',
};

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof body?.error === 'string' ? body.error : `Request failed (${response.status})`;
}

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => getProjectId());
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectProject = useCallback((projectId: string | null) => {
    setSelectedId(projectId);
    setProjectId(projectId);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/projects?includeArchived=true');
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as { projects: Project[] };
      const next = Array.isArray(body.projects) ? body.projects : [];
      setProjects(next);

      const active = next.filter((project) => project.status === 'active');
      const stored = getProjectId();
      const nextSelected = active.some((project) => project.id === stored) ? stored : active[0]?.id ?? null;
      setSelectedId(nextSelected);
      setProjectId(nextSelected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const updateForm = (field: keyof ProjectForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const submitProject = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editingId ? `/api/projects/${encodeURIComponent(editingId)}` : '/api/projects', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const project = await response.json() as Project;
      resetForm();
      if (!editingId) selectProject(project.id);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save project');
    } finally {
      setSaving(false);
    }
  };

  const editProject = (project: Project) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      version: project.metadata.version ?? '1.0.0',
      owner: project.metadata.owner ?? '',
      team: project.metadata.team ?? '',
      services: project.metadata.services?.join(', ') ?? '',
      description: project.metadata.description ?? '',
    });
  };

  const setArchived = async (project: Project, restore: boolean) => {
    setError('');
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update project status');
    }
  };

  const removeProject = async (project: Project) => {
    if (!window.confirm(`Delete project “${project.name}”? This cannot be undone.`)) return;
    setError('');
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await responseError(response));
      if (editingId === project.id) resetForm();
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete project');
    }
  };

  const activeProjects = projects.filter((project) => project.status === 'active');

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Project ownership, versioning, filters, and execution context.</p>
        </div>
        <button className="pt-ghost-btn" type="button" onClick={() => void loadProjects()} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <section className="panel">
        <div className="ph"><h3>Project Context</h3></div>
        <div className="panel-body">
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Active project</span>
            <select className="pt-input w-full md:w-1/2 lg:w-1/3" value={selectedId ?? ''} onChange={(event) => selectProject(event.target.value || null)}>
              {activeProjects.length === 0 && <option value="">No active projects</option>}
              {activeProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      <form className="panel" onSubmit={submitProject}>
        <div className="ph"><h3>{editingId ? 'Edit Project' : 'Add Project'}</h3></div>
        <div className="panel-body pt-page-stack">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Project name</span><input required type="text" className="pt-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Project name" /></label>
            <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Version</span><input required type="text" className="pt-input" value={form.version} onChange={(event) => updateForm('version', event.target.value)} placeholder="1.0.0" pattern="\d+\.\d+\.\d+" /></label>
            <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Owner</span><input type="text" className="pt-input" value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} placeholder="Owner" /></label>
            <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Team</span><input type="text" className="pt-input" value={form.team} onChange={(event) => updateForm('team', event.target.value)} placeholder="Team" /></label>
            <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Services</span><input type="text" className="pt-input" value={form.services} onChange={(event) => updateForm('services', event.target.value)} placeholder="Services comma-separated" /></label>
            <label className="block md:col-span-2 lg:col-span-3"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</span><input type="text" className="pt-input" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Description" /></label>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {editingId && <button className="pt-ghost-btn" type="button" onClick={resetForm}>Cancel</button>}
            <button className="pt-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Project'}</button>
          </div>
        </div>
      </form>

      {error && <p className="text-red-500 text-sm mt-2" role="alert">{error}</p>}

      <section className="panel">
        <div className="tbl-scroll">
          <table className="mock">
            <thead><tr><th>Name</th><th>Version</th><th>Owner / Team</th><th>Services</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td><strong className="table-primary">{project.name}</strong><span className="table-secondary">{project.metadata.slug ?? project.id}</span></td>
                  <td>{project.metadata.version ?? '—'}</td>
                  <td><span>{project.metadata.owner || '—'}</span><span className="table-secondary">{project.metadata.team || '—'}</span></td>
                  <td>{project.metadata.services?.length ?? 0}</td>
                  <td><span className={`pill${project.status === 'active' ? ' ok' : ''}`}>{project.status.toUpperCase()}</span></td>
                  <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-s-1">
                      <button className="table-action-btn" type="button" onClick={() => editProject(project)}>Edit</button>
                      <button className="table-action-btn icon-btn" type="button" onClick={() => void setArchived(project, project.status === 'archived')} aria-label={`${project.status === 'archived' ? 'Restore' : 'Archive'} project ${project.name}`} disabled={project.id === 'default' && project.status === 'active'}>
                        {project.status === 'archived' ? <RotateCcw size={14} /> : <Archive size={14} />}
                      </button>
                      <button className="table-action-btn icon-btn" type="button" onClick={() => void removeProject(project)} aria-label={`Delete project ${project.name}`} disabled={project.id === 'default'}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && projects.length === 0 && <tr><td colSpan={7}>No projects found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
