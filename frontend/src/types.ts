export type ShellProfile = {
  id: string;
  label: string;
  command: string;
  args: string[];
};

export type SessionResponse = {
  id: string;
  profile: ShellProfile;
};

export type SessionTab = {
  id: string;
  profile: ShellProfile;
  status: 'connecting' | 'ready' | 'disconnected' | 'error';
  errorMessage?: string;
};

export type WebSocketIncomingMessage =
  | { type: 'output'; data: string }
  | { type: 'error'; data: string };

export type WebSocketOutgoingMessage =
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number };
