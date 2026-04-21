import type { FileTab } from '../../types';

type EditorTabsProps = {
  files: FileTab[];
  activeFileId: string | null;
  onSelect: (fileId: string) => void;
  onClose: (fileId: string) => void;
};

export function EditorTabs({ files, activeFileId, onSelect, onClose }: EditorTabsProps) {
  return (
    <div className="editor-tabs" role="tablist">
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <div key={file.id} className={`editor-tab${isActive ? ' active' : ''}`}>
            <button className="editor-tab-btn" onClick={() => onSelect(file.id)} role="tab" aria-selected={isActive} type="button">
              {file.modified && <span className="editor-tab-dot">●</span>}
              {file.name}
            </button>
            <button className="editor-tab-close" onClick={() => onClose(file.id)} type="button" aria-label={`Close ${file.name}`}>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
