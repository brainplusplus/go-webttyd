# Web Terminal

Browser-based terminal sessions with multi-tab support, Basic Auth protection, and OS-aware shell discovery.

## Features

- PTY-backed terminal sessions managed by a Go backend
- React + Vite frontend with multi-tab terminal UI using `xterm.js`
- Basic Auth in front of the UI, API, and websocket access flow
- Environment-driven configuration through `.env`
- Cross-platform shell detection
  - Windows: `pwsh`, `powershell`, `cmd`, Git Bash, WSL when available
  - Linux/macOS: `bash` and other supported shells actually present on the host

## Requirements

- Go 1.24+
- Node.js 20+

## Setup

1. Copy `.env.example` to `.env`.
2. Set `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD`.
3. Install frontend dependencies:

```bash
npm install
```

4. Build the frontend:

```bash
npm run build
```

5. Start the server:

```bash
go run ./cmd/server
```

6. Open `http://localhost:8080` or the port from `.env`.

The browser prompts for Basic Auth credentials before the app loads.

## Environment Variables

- `PORT`: HTTP listen port. Defaults to `8080` when unset.
- `BASIC_AUTH_USERNAME`: required username for Basic Auth.
- `BASIC_AUTH_PASSWORD`: required password for Basic Auth.

## Development Commands

```bash
go test ./...
go build ./...
npm run typecheck
npm run build
```

## Shell Discovery Notes

- Only shells discovered on the current host are shown in the UI.
- On Windows, Git Bash is detected from `PATH` and common Git for Windows install locations.
- On Linux/macOS, the backend checks the current `SHELL`, `/etc/shells` when available, and common shell names.

## Project Structure

- `cmd/server`: application entry point
- `internal/config`: `.env` loading and validation
- `internal/auth`: Basic Auth middleware and session cookie bridge for browser websocket access
- `internal/shells`: OS-aware shell discovery
- `internal/terminal`: PTY session spawning and registry management
- `internal/httpapi`: shell/session API and terminal websocket handler
- `internal/server`: HTTP assembly and static asset serving
- `frontend/src`: React UI and terminal components

## Verification

The implementation is intended to be verified with:

```bash
go test ./...
go build ./...
npm run typecheck
npm run build
```
