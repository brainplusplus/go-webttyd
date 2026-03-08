import type { SessionTab } from '../types';

type TerminalTabsProps = {
  tabs: SessionTab[];
  activeTabId: string | null;
  onSelectTab: (sessionId: string) => void;
  onCloseTab: (sessionId: string) => void;
};

export function TerminalTabs(props: TerminalTabsProps) {
  const { tabs, activeTabId, onSelectTab, onCloseTab } = props;

  return (
    <div className="tab-strip" role="tablist" aria-label="Terminal sessions">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div key={tab.id} className={`tab-chip${isActive ? ' active' : ''}`}>
            <button
              aria-selected={isActive}
              className="tab-button"
              onClick={() => onSelectTab(tab.id)}
              role="tab"
              type="button"
            >
              <span>{tab.profile.label}</span>
              <small>{tab.status}</small>
            </button>
            <button className="tab-close" onClick={() => onCloseTab(tab.id)} type="button" aria-label={`Close ${tab.profile.label}`}>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
