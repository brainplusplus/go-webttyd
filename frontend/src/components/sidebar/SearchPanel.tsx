import { useCallback, useState } from 'react';
import { searchFiles } from '../../api';
import type { SearchResult } from '../../types';

type SearchPanelProps = {
  rootPath: string;
  onResultClick: (filePath: string, fileName: string) => void;
};

export function SearchPanel({ rootPath, onResultClick }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const found = await searchFiles(rootPath, query, false, 100);
      setResults(found);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [rootPath, query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleSearch();
  }, [handleSearch]);

  const sep = rootPath.includes('\\') ? '\\' : '/';

  return (
    <div className="search-panel">
      <div className="search-input-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search in files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={() => void handleSearch()} disabled={searching} type="button">
          {searching ? '…' : '🔍'}
        </button>
      </div>
      <div className="search-results">
        {results.map((r, i) => (
          <button
            key={`${r.path}:${r.line}:${i}`}
            className="search-result-row"
            onClick={() => onResultClick(rootPath + sep + r.path, r.path.split(/[/\\]/).pop() ?? r.path)}
            type="button"
          >
            <span className="search-result-path">{r.path}:{r.line}</span>
            <span className="search-result-preview">{r.preview}</span>
          </button>
        ))}
        {!searching && results.length === 0 && query && <p className="search-empty">No results.</p>}
      </div>
    </div>
  );
}
