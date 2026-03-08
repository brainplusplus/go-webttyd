import type { ShellProfile } from '../types';

type TopBarProps = {
  shells: ShellProfile[];
  selectedShellId: string;
  creating: boolean;
  onSelectedShellChange: (value: string) => void;
  onCreateTab: () => void;
};

export function TopBar(props: TopBarProps) {
  const { shells, selectedShellId, creating, onSelectedShellChange, onCreateTab } = props;

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Local tool</p>
        <h1>Browser Terminal</h1>
      </div>

      <div className="topbar-controls">
        <label className="shell-picker">
          <span>Shell profile</span>
          <select value={selectedShellId} onChange={(event) => onSelectedShellChange(event.target.value)}>
            {shells.map((shell) => (
              <option key={shell.id} value={shell.id}>
                {shell.label}
              </option>
            ))}
          </select>
        </label>

        <button className="primary-button" disabled={creating || shells.length === 0} onClick={onCreateTab} type="button">
          {creating ? 'Opening…' : 'New tab'}
        </button>
      </div>
    </header>
  );
}
