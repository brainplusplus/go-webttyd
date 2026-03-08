# Web Terminal Design

## Goal

Build a local/self-hosted web application that exposes real PTY-backed terminal sessions in the browser with multi-tab support, cross-platform shell discovery, Basic Auth protection, and environment-driven configuration.

## Repository State

The repository is currently empty. There is no existing scaffold, stack, build script, documentation, or configuration to preserve. The implementation will therefore establish the initial project structure while keeping the design small and focused.

## Chosen Approach

Use a Go backend with a React + Vite frontend.

This approach is preferred over a server-rendered UI or a full JavaScript backend because:

- Go is well suited for process management, PTY handling, OS-aware shell discovery, and single-binary backend distribution.
- React is a good fit for a terminal-oriented UI with dynamic tabs, active session switching, and xterm.js integration.
- Vite keeps the frontend build small and predictable for a new project.

## Architecture

The system has two runtime layers:

- A Go HTTP server that loads configuration, enforces Basic Auth, serves API endpoints, upgrades websocket connections, manages terminal PTY sessions, discovers installed shells, and serves frontend assets.
- A React single-page application that renders the browser UI, fetches shell choices from the server, creates sessions, and displays each session in an xterm.js instance.

The backend is the source of truth for security, shell availability, and terminal lifecycle. The frontend is responsible for interaction, display, and client-side tab state.

## Backend Design

### Entry Point

`cmd/server` starts the application, loads `.env`, validates required settings, initializes services, serves the built frontend, and starts the HTTP server on the configured port.

### Configuration

`internal/config` reads:

- `PORT`
- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`

The server fails fast if the username or password is missing. Port falls back to a documented default only if the implementation chooses that convention explicitly.

### Authentication

`internal/auth` provides middleware that enforces HTTP Basic Auth on:

- frontend asset requests
- API endpoints
- websocket terminal connections

This keeps the app consistently protected and avoids a websocket auth gap.

### Shell Discovery

`internal/shells` performs host-aware detection and returns only launchable shells.

Windows discovery checks:

- `pwsh`
- `powershell`
- `cmd`
- Git Bash from `PATH` and common Git for Windows install locations
- WSL through `wsl.exe`

Unix-like discovery checks:

- the current `SHELL` if valid
- `/etc/shells` when available
- common shells such as `bash`, `zsh`, `sh`, and `fish`, but only when found on the host

Each detected shell exposes a label, identifier, executable path or command, and any required launch arguments. Unavailable shells are excluded entirely.

### Terminal Sessions

`internal/terminal` owns PTY-backed sessions.

Each session includes:

- session id
- selected shell profile
- PTY handle
- underlying process handle
- cleanup lifecycle state

The backend creates one PTY-backed process per tab. Sessions can be created concurrently and are isolated from each other. Closing a tab terminates the corresponding PTY session and removes it from the registry.

### Transport

The backend exposes:

- `GET /api/shells` to return available shells
- `POST /api/sessions` to create a new session
- `DELETE /api/sessions/:id` to terminate a session
- `GET /ws/sessions/:id` for terminal streaming and resize/input messages over websocket

Websocket traffic carries user input, resize events, and terminal output. The server validates that a session exists before attaching a websocket bridge.

## Frontend Design

The frontend is a compact SPA optimized for terminal usage.

### Layout

The main UI includes:

- a top bar with app title, shell selector, and new-tab action
- a tab strip for open sessions
- a large terminal pane for the active session

The visual goal is practical and intentional, closer to an editor terminal panel than a generic dashboard.

### Session UX

Users can:

- create a new tab using an available shell profile
- switch between open tabs without destroying inactive sessions
- close tabs and automatically move focus to a remaining session

Each tab maps to one backend PTY session. The frontend maintains local tab order and active-tab state, while the backend remains authoritative for session existence.

### Terminal Integration

`xterm.js` renders terminal output and forwards keyboard input. A fit addon resizes the terminal to its container and sends dimensions back to the backend.

The initial shell selection defaults to the first server-provided shell profile, which naturally tracks the current OS and installed tools.

## Data Flow

1. Browser requests the app and is challenged by Basic Auth.
2. After authentication, the frontend loads and requests `GET /api/shells`.
3. The user creates a tab for a selected shell.
4. The frontend calls `POST /api/sessions` and receives a session id.
5. The frontend opens a websocket for that session.
6. Keyboard input and resize events flow to the server.
7. PTY output streams back to the browser.
8. Closing a tab triggers `DELETE /api/sessions/:id` and server-side cleanup.

## Error Handling

- Missing credentials in `.env`: server startup fails with a clear error.
- No optional shell present: only the remaining valid shells are returned.
- PTY spawn failure: session creation returns an error to the frontend and no broken tab remains.
- Websocket disconnect: the UI marks the session as disconnected and allows cleanup.
- Browser tab close or explicit session close: the backend terminates the process and releases resources.

## Configuration Files and Documentation

The implementation will include:

- `.env.example` documenting required variables
- `README.md` with setup, environment variables, build steps, and local run instructions

## Verification Plan

Verification should include:

- language-server diagnostics on changed files
- backend tests where practical for config, auth, and shell detection behavior
- frontend build verification
- backend build verification
- local runtime smoke test showing the app starts, auth is enforced, and session creation works

## Explicit Non-Goals

The first implementation will not include:

- multi-user accounts or role-based access control
- TLS termination inside the application
- session persistence across server restarts
- browser-side fake terminals without a PTY backend

## Constraints

- No insecure auth bypasses
- No `as any`, `@ts-ignore`, or `@ts-expect-error`
- No OS-specific shell assumptions outside the shell detection and launch layer
- No exposing shells that are not actually installed
