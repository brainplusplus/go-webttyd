import { useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '../../stores/workspace';
import { EditorTabs } from './EditorTabs';
import { MonacoEditor } from './MonacoEditor';
import { saveFileContent } from '../../api';

export function EditorArea() {
  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const closeFile = useWorkspaceStore((s) => s.closeFile);
  const setActiveFile = useWorkspaceStore((s) => s.setActiveFile);
  const updateFileContent = useWorkspaceStore((s) => s.updateFileContent);
  const markFileSaved = useWorkspaceStore((s) => s.markFileSaved);

  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId) ?? null, [projects, activeProjectId]);
  const activeFile = useMemo(
    () => activeProject?.openFiles.find((f) => f.id === activeProject.activeFileId) ?? null,
    [activeProject],
  );

  const handleSave = useCallback(async () => {
    if (!activeProjectId || !activeFile) return;
    try {
      await saveFileContent(activeFile.path, activeFile.content);
      markFileSaved(activeProjectId, activeFile.id);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [activeProjectId, activeFile, markFileSaved]);

  const handleContentChange = useCallback((value: string) => {
    if (!activeProjectId || !activeFile) return;
    updateFileContent(activeProjectId, activeFile.id, value);
  }, [activeProjectId, activeFile, updateFileContent]);

  if (!activeProject || activeProject.openFiles.length === 0) {
    return (
      <div className="editor-empty">
        <p>Open a file from the explorer to start editing.</p>
      </div>
    );
  }

  return (
    <div className="editor-area">
      <EditorTabs
        files={activeProject.openFiles}
        activeFileId={activeProject.activeFileId}
        onSelect={(fileId) => setActiveFile(activeProject.id, fileId)}
        onClose={(fileId) => closeFile(activeProject.id, fileId)}
      />
      {activeFile && (
        <MonacoEditor
          key={activeFile.id}
          value={activeFile.content}
          language={activeFile.language}
          onChange={handleContentChange}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
