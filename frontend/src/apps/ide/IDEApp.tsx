import { useWorkspaceStore } from '../../stores/workspace';
import { ProjectPicker } from './ProjectPicker';
import { IDEWorkspace } from './IDEWorkspace';

export function IDEApp() {
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);

  if (!activeProjectId) {
    return <ProjectPicker />;
  }

  return <IDEWorkspace />;
}
