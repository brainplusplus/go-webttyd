import { useCallback, useEffect, useMemo, useState } from 'react';

import { createSession, deleteSession, getShells } from './api';
import { TerminalTabs } from './components/TerminalTabs';
import { TerminalView } from './components/TerminalView';
import { TopBar } from './components/TopBar';
import type { SessionTab, ShellProfile } from './types';

function App() {
  const [shells, setShells] = useState<ShellProfile[]>([]);
  const [selectedShellId, setSelectedShellId] = useState('');
  const [tabs, setTabs] = useState<SessionTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadShells() {
      try {
        const availableShells = await getShells();
        if (cancelled) {
          return;
        }

        setShells(availableShells);
        setSelectedShellId(availableShells[0]?.id ?? '');
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load shell profiles');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadShells();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? null, [activeTabId, tabs]);

  const handleCreateTab = useCallback(async (shellId = selectedShellId) => {
    if (!shellId) {
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const session = await createSession(shellId);
      const newTab: SessionTab = {
        id: session.id,
        profile: session.profile,
        status: 'connecting',
      };
      setTabs((currentTabs) => [...currentTabs, newTab]);
      setActiveTabId(session.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setCreating(false);
    }
  }, [selectedShellId]);

  const handleCloseTab = useCallback(async (sessionId: string) => {
    setTabs((currentTabs) => {
      const index = currentTabs.findIndex((tab) => tab.id === sessionId);
      const nextTabs = currentTabs.filter((tab) => tab.id !== sessionId);

      if (activeTabId === sessionId) {
        const fallback = nextTabs[index] ?? nextTabs[index - 1] ?? null;
        setActiveTabId(fallback?.id ?? null);
      }

      return nextTabs;
    });

    try {
      await deleteSession(sessionId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to close session');
    }
  }, [activeTabId]);

  useEffect(() => {
    if (loading || creating || shells.length === 0 || tabs.length > 0 || !selectedShellId) {
      return;
    }

    void handleCreateTab(selectedShellId);
  }, [creating, handleCreateTab, loading, selectedShellId, shells.length, tabs.length]);

  function updateTabStatus(sessionId: string, status: SessionTab['status'], error?: string) {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === sessionId
          ? {
              ...tab,
              status,
              errorMessage: error,
            }
          : tab,
      ),
    );
  }

  return (
    <main className="app-shell">
      <div className="app-card">
        <TopBar
          shells={shells}
          selectedShellId={selectedShellId}
          creating={creating}
          onSelectedShellChange={setSelectedShellId}
          onCreateTab={() => {
            void handleCreateTab();
          }}
        />

        {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
        {loading ? <div className="status-banner">Detecting shell profiles…</div> : null}
        {!loading && shells.length === 0 ? <div className="status-banner">No supported shells were detected on this host.</div> : null}

        <TerminalTabs tabs={tabs} activeTabId={activeTabId} onSelectTab={setActiveTabId} onCloseTab={(sessionId) => {
          void handleCloseTab(sessionId);
        }} />

        {tabs.length === 0 && !loading ? (
          <section className="empty-state">
            <p>No terminal tabs are open.</p>
            <button className="primary-button" disabled={!selectedShellId || creating} onClick={() => {
              void handleCreateTab();
            }} type="button">
              Open first terminal
            </button>
          </section>
        ) : null}

        <section className="terminal-stack">
          {tabs.map((tab) => (
            <TerminalView key={tab.id} tab={tab} active={tab.id === activeTab?.id} onStatusChange={updateTabStatus} />
          ))}
        </section>
      </div>
    </main>
  );
}

export default App;
