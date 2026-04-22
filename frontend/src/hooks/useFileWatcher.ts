import { useEffect, useRef } from 'react';

type FileEvent = {
  type: 'create' | 'modify' | 'delete' | 'rename';
  path: string;
  name: string;
};

type UseFileWatcherOptions = {
  root: string | null;
  onFileChange: (event: FileEvent) => void;
};

export function useFileWatcher({ root, onFileChange }: UseFileWatcherOptions) {
  const callbackRef = useRef(onFileChange);
  callbackRef.current = onFileChange;

  useEffect(() => {
    if (!root) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/watch?root=${encodeURIComponent(root)}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      ws = new WebSocket(url);

      ws.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data) as FileEvent;
          callbackRef.current(event);
        } catch {}
      });

      ws.addEventListener('close', () => {
        if (!disposed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      });

      ws.addEventListener('error', () => {
        ws?.close();
      });
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [root]);
}
