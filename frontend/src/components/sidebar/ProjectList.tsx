import { useWorkspaceStore } from '../../stores/workspace';

export function ProjectList() {
  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);
  const removeProject = useWorkspaceStore((s) => s.removeProject);
  const setShowPicker = useWorkspaceStore((s) => s.setShowPicker);

  return (
    <div className="project-list">
      <div className="project-list-header">
        <strong>Open Projects</strong>
        <button className="project-open-folder-btn" onClick={() => setShowPicker(true)} type="button">
          + Open Folder
        </button>
      </div>
      {projects.map((p) => (
        <div key={p.id} className={`project-item${p.id === activeProjectId ? ' active' : ''}`}>
          <button className="project-item-btn" onClick={() => setActiveProject(p.id)} type="button">
            <span className="project-item-name">{p.name}</span>
            <span className="project-item-path">{p.path}</span>
          </button>
          <button className="project-item-close" onClick={() => removeProject(p.id)} type="button" title="Close project">
            ×
          </button>
        </div>
      ))}
      {projects.length === 0 && <p className="project-list-empty">No projects open.</p>}
    </div>
  );
}
