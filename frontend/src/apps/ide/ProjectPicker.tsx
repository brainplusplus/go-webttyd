import { useCallback, useEffect, useState } from 'react';
import { getConfig, getFileTree } from '../../api';
import { useWorkspaceStore } from '../../stores/workspace';
import type { DirEntry } from '../../types';

type TreeNode = DirEntry & { children?: TreeNode[]; expanded?: boolean; fullPath: string };

export function ProjectPicker() {
  const addProject = useWorkspaceStore((s) => s.addProject);
  const [rootPath, setRootPath] = useState('');
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const config = await getConfig();
        const root = config.workspaceRoot || (navigator.platform.startsWith('Win') ? 'C:\\' : '/');
        setRootPath(root);
        const entries = await getFileTree(root);
        if (!cancelled) {
          setNodes(
            entries
              .filter((e) => e.type === 'dir')
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e) => ({ ...e, fullPath: joinPath(root, e.name) })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => { cancelled = true; };
  }, []);

  const toggleExpand = useCallback(async (node: TreeNode, path: number[]) => {
    if (node.expanded) {
      setNodes((prev) => updateNodeAtPath(prev, path, { ...node, expanded: false }));
      return;
    }

    try {
      const entries = await getFileTree(node.fullPath);
      const children = entries
        .filter((e) => e.type === 'dir')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({ ...e, fullPath: joinPath(node.fullPath, e.name) }));
      setNodes((prev) => updateNodeAtPath(prev, path, { ...node, expanded: true, children }));
    } catch {
      setNodes((prev) => updateNodeAtPath(prev, path, { ...node, expanded: true, children: [] }));
    }
  }, []);

  const handleOpen = useCallback((node: TreeNode) => {
    addProject(node.fullPath, node.name);
  }, [addProject]);

  return (
    <main className="picker-shell">
      <div className="picker-card">
        <header className="picker-header">
          <p className="eyebrow">Web IDE</p>
          <h1>Open Project</h1>
          <p className="picker-root">Browsing: {rootPath}</p>
        </header>

        {error && <div className="status-banner error">{error}</div>}
        {loading && <div className="status-banner">Loading directories…</div>}

        <div className="picker-tree">
          {nodes.map((node, i) => (
            <FolderNode key={node.name} node={node} path={[i]} depth={0} onToggle={toggleExpand} onOpen={handleOpen} />
          ))}
          {!loading && nodes.length === 0 && <p className="picker-empty">No directories found.</p>}
        </div>
      </div>
    </main>
  );
}

type FolderNodeProps = {
  node: TreeNode;
  path: number[];
  depth: number;
  onToggle: (node: TreeNode, path: number[]) => void;
  onOpen: (node: TreeNode) => void;
};

function FolderNode({ node, path, depth, onToggle, onOpen }: FolderNodeProps) {
  return (
    <div className="folder-node">
      <div className="folder-row" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        <button className="folder-toggle" onClick={() => onToggle(node, path)} type="button">
          {node.expanded ? '▼' : '▶'}
        </button>
        <span className="folder-name">{node.name}</span>
        <button className="folder-open-btn" onClick={() => onOpen(node)} type="button">
          Open
        </button>
      </div>
      {node.expanded && node.children?.map((child, i) => (
        <FolderNode key={child.name} node={child} path={[...path, i]} depth={depth + 1} onToggle={onToggle} onOpen={onOpen} />
      ))}
    </div>
  );
}

function joinPath(base: string, name: string): string {
  if (base.includes('\\')) {
    return base.endsWith('\\') ? base + name : base + '\\' + name;
  }
  return base.endsWith('/') ? base + name : base + '/' + name;
}

function updateNodeAtPath(nodes: TreeNode[], path: number[], updated: TreeNode): TreeNode[] {
  if (path.length === 1) {
    return nodes.map((n, i) => (i === path[0] ? updated : n));
  }
  return nodes.map((n, i) => {
    if (i === path[0] && n.children) {
      return { ...n, children: updateNodeAtPath(n.children, path.slice(1), updated) };
    }
    return n;
  });
}
