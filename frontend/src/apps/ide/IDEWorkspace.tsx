import { useCallback, useEffect, useMemo } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { useWorkspaceStore } from '../../stores/workspace';
import { ActivityBar } from '../../components/sidebar/ActivityBar';
import { FileTree } from '../../components/sidebar/FileTree';
import { SearchPanel } from '../../components/sidebar/SearchPanel';
import { ProjectList } from '../../components/sidebar/ProjectList';
import { EditorArea } from '../../components/editor/EditorArea';
import { TerminalPanel } from '../../components/terminal/TerminalPanel';
import { getFileContent } from '../../api';
import type { FileTab } from '../../types';

function languageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    go: 'go', py: 'python', rs: 'rust', java: 'java', c: 'c', cpp: 'cpp',
    h: 'c', hpp: 'cpp', cs: 'csharp', rb: 'ruby', php: 'php',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', sql: 'sql', sh: 'shell', bash: 'shell',
    xml: 'xml', svg: 'xml', dockerfile: 'dockerfile',
  };
  return map[ext] ?? 'plaintext';
}

export function IDEWorkspace() {
  const activePanel = useWorkspaceStore((s) => s.activePanel);
  const sidebarVisible = useWorkspaceStore((s) => s.sidebarVisible);
  const terminalVisible = useWorkspaceStore((s) => s.terminalVisible);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const projects = useWorkspaceStore((s) => s.projects);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const toggleTerminal = useWorkspaceStore((s) => s.toggleTerminal);

  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId) ?? null, [projects, activeProjectId]);

  const handleFileSelect = useCallback(async (filePath: string, fileName: string) => {
    if (!activeProjectId) return;
    try {
      const fc = await getFileContent(filePath);
      const tab: FileTab = {
        id: filePath,
        path: filePath,
        name: fileName,
        content: fc.content,
        language: languageFromPath(filePath),
        modified: false,
      };
      openFile(activeProjectId, tab);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [activeProjectId, openFile]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleTerminal]);

  return (
    <div className="ide-shell">
      <ActivityBar />
      <Group orientation="horizontal" className="ide-main">
        {sidebarVisible && (
          <>
            <Panel defaultSize="28%" minSize="15%" maxSize="50%" className="ide-sidebar">
              <div className="sidebar-header">
                <strong>{activeProject?.name ?? 'No project'}</strong>
              </div>
              {activePanel === 'explorer' && activeProject && (
                <FileTree rootPath={activeProject.path} onFileSelect={handleFileSelect} />
              )}
              {activePanel === 'search' && activeProject && (
                <SearchPanel rootPath={activeProject.path} onResultClick={handleFileSelect} />
              )}
              {activePanel === 'projects' && <ProjectList />}
            </Panel>
            <Separator className="resize-handle-h" style={{ cursor: 'col-resize' }} />
          </>
        )}
        <Panel minSize="20%" className="ide-content">
          <Group orientation="vertical" style={{ height: '100%' }}>
            <Panel minSize="15%" className="ide-editor-area">
              <EditorArea />
            </Panel>
            {terminalVisible && (
              <>
                <Separator className="resize-handle-v" style={{ cursor: 'row-resize' }} />
                <Panel defaultSize="38%" minSize="10%" maxSize="70%" className="ide-terminal-area">
                  <TerminalPanel />
                </Panel>
              </>
            )}
          </Group>
        </Panel>
      </Group>
    </div>
  );
}
