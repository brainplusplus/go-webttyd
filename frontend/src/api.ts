import type { SessionResponse, ShellProfile } from './types';

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

export async function createSession(shellId: string): Promise<SessionResponse> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shellId }),
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
