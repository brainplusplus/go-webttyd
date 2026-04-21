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

export type DirEntry = {
  name: string;
  type: 'file' | 'dir';
  size: number;
  modified: number;
};

export type FileContent = {
  content: string;
  encoding: string;
  size: number;
};

export type SearchResult = {
  path: string;
  line: number;
  column: number;
  preview: string;
};

export type FileTab = {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  modified: boolean;
};

export type Project = {
  id: string;
  path: string;
  name: string;
  openFiles: FileTab[];
  activeFileId: string | null;
  terminalSessions: string[];
};

export type ActivePanel = 'explorer' | 'search' | 'projects' | 'terminal';

export type AppConfig = {
  mode: 'simple' | 'full';
  workspaceRoot: string;
};
