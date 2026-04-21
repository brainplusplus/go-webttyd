import type { AppConfig, DirEntry, FileContent, SearchResult, SessionResponse, ShellProfile } from './types';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getShells(): Promise<ShellProfile[]> {
  const response = await fetch('/api/shells', {
    credentials: 'include',
  });

  return parseResponse<ShellProfile[]>(response);
}

export async function createSession(shellId: string, cwd?: string): Promise<SessionResponse> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shellId, cwd }),
  });

  return parseResponse<SessionResponse>(response);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 404) {
    const message = await response.text();
    throw new Error(message || `Failed to close session ${sessionId}`);
  }
}

export function createSessionWebSocket(sessionId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new WebSocket(`${protocol}//${window.location.host}/ws/sessions/${sessionId}`);
}

export async function getConfig(): Promise<AppConfig> {
  const response = await fetch('/api/config', { credentials: 'include' });
  return parseResponse<AppConfig>(response);
}

export async function getFileTree(path: string): Promise<DirEntry[]> {
  const response = await fetch(`/api/files/tree?path=${encodeURIComponent(path)}`, { credentials: 'include' });
  return parseResponse<DirEntry[]>(response);
}

export async function getFileContent(path: string): Promise<FileContent> {
  const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`, { credentials: 'include' });
  return parseResponse<FileContent>(response);
}

export async function saveFileContent(path: string, content: string): Promise<void> {
  const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to save file');
  }
}

export async function createEntry(path: string, type: 'file' | 'dir'): Promise<void> {
  const response = await fetch('/api/files/create', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, type }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create entry');
  }
}

export async function renameEntry(oldPath: string, newPath: string): Promise<void> {
  const response = await fetch('/api/files/rename', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newPath }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to rename');
  }
}

export async function deleteEntry(path: string): Promise<void> {
  const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok && response.status !== 404) {
    const message = await response.text();
    throw new Error(message || 'Failed to delete');
  }
}

export async function copyEntry(sourcePath: string, destPath: string): Promise<void> {
  const response = await fetch('/api/files/copy', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, destPath }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to copy');
  }
}

export async function moveEntry(sourcePath: string, destPath: string): Promise<void> {
  const response = await fetch('/api/files/move', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, destPath }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to move');
  }
}

export async function searchFiles(root: string, query: string, regex: boolean, maxResults: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({ root, query, regex: String(regex), maxResults: String(maxResults) });
  const response = await fetch(`/api/files/search?${params}`, { credentials: 'include' });
  return parseResponse<SearchResult[]>(response);
}

export function downloadFile(path: string): void {
  const a = document.createElement('a');
  a.href = `/api/files/download?path=${encodeURIComponent(path)}`;
  a.download = '';
  a.click();
}

export async function uploadFiles(targetPath: string, files: FileList): Promise<void> {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  const response = await fetch(`/api/files/upload?path=${encodeURIComponent(targetPath)}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to upload');
  }
}
