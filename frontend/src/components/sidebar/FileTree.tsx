import { useCallback, useEffect, useState } from 'react';
import { getFileTree } from '../../api';
import type { DirEntry } from '../../types';

type TreeNode = DirEntry & { fullPath: string; children?: TreeNode[]; expanded?: boolean };

type FileTreeProps = {
  rootPath: string;
  onFileSelect: (filePath: string, fileName: string) => void;
  refreshKey?: number;
};

export function FileTree({ rootPath, onFileSelect, refreshKey }: FileTreeProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const entries = await getFileTree(rootPath);
        if (!cancelled) {
          setNodes(toTreeNodes(rootPath, entries));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [rootPath, refreshKey]);

  const handleToggle = useCallback(async (node: TreeNode, path: number[]) => {
    if (node.type === 'file') {
      onFileSelect(node.fullPath, node.name);
      return;
    }

    if (node.expanded) {
      setNodes((prev) => updateAtPath(prev, path, { ...node, expanded: false }));
      return;
    }

    try {
      const entries = await getFileTree(node.fullPath);
      setNodes((prev) => updateAtPath(prev, path, { ...node, expanded: true, children: toTreeNodes(node.fullPath, entries) }));
    } catch {
      setNodes((prev) => updateAtPath(prev, path, { ...node, expanded: true, children: [] }));
    }
  }, [onFileSelect]);

  if (loading) return <div className="tree-loading">Loading…</div>;

  return (
    <div className="file-tree">
      {nodes.map((node, i) => (
        <FileTreeNode key={node.name} node={node} path={[i]} depth={0} onToggle={handleToggle} />
      ))}
    </div>
  );
}

type FileTreeNodeProps = {
  node: TreeNode;
  path: number[];
  depth: number;
  onToggle: (node: TreeNode, path: number[]) => void;
};

function FileTreeNode({ node, path, depth, onToggle }: FileTreeNodeProps) {
  const isDir = node.type === 'dir';
  return (
    <>
      <button
        className={`tree-row${isDir ? ' tree-dir' : ' tree-file'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onToggle(node, path)}
        type="button"
      >
        {isDir && <span className="tree-arrow">{node.expanded ? '▼' : '▶'}</span>}
        <span className="tree-icon">{isDir ? '📁' : '📄'}</span>
        <span className="tree-name">{node.name}</span>
      </button>
      {isDir && node.expanded && node.children?.map((child, i) => (
        <FileTreeNode key={child.name} node={child} path={[...path, i]} depth={depth + 1} onToggle={onToggle} />
      ))}
    </>
  );
}

function toTreeNodes(parentPath: string, entries: DirEntry[]): TreeNode[] {
  const sep = parentPath.includes('\\') ? '\\' : '/';
  return entries
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((e) => ({
      ...e,
      fullPath: parentPath.endsWith(sep) ? parentPath + e.name : parentPath + sep + e.name,
    }));
}

function updateAtPath(nodes: TreeNode[], path: number[], updated: TreeNode): TreeNode[] {
  if (path.length === 1) {
    return nodes.map((n, i) => (i === path[0] ? updated : n));
  }
  return nodes.map((n, i) => {
    if (i === path[0] && n.children) {
      return { ...n, children: updateAtPath(n.children, path.slice(1), updated) };
    }
    return n;
  });
}
