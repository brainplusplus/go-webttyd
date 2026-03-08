# Web Terminal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local/self-hosted browser-based terminal application with PTY-backed sessions, multi-tab terminal UI, Basic Auth protection, environment-driven configuration, and cross-platform shell discovery.

**Architecture:** A Go backend owns configuration, Basic Auth, shell discovery, PTY session lifecycle, websocket streaming, and static asset serving. A React + Vite frontend uses xterm.js to render one browser terminal per tab and talks to the backend through authenticated HTTP and websocket endpoints.

**Tech Stack:** Go, React, TypeScript, Vite, xterm.js, websocket transport, go PTY library, dotenv loading

---

### Task 1: Initialize repository structure and manifests

**Files:**
- Create: `go.mod`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `frontend/index.html`
- Create: `frontend/package.json` (optional if root package is not used)

**Step 1: Write the minimal manifests**

- Define the Go module and backend dependencies.
- Define frontend scripts for `dev`, `build`, and `typecheck`.
- Configure Vite to build into a directory the Go server can serve.

**Step 2: Install dependencies**

Run: `npm install`
Expected: frontend dependency tree installs successfully.

**Step 3: Verify base tooling**

Run: `go mod tidy`
Expected: module graph resolves without errors.

### Task 2: Add backend config and Basic Auth tests first

**Files:**
- Create: `internal/config/config.go`
- Create: `internal/config/config_test.go`
- Create: `internal/auth/basic_auth.go`
- Create: `internal/auth/basic_auth_test.go`

**Step 1: Write failing config tests**

- Test that missing username/password causes validation failure.
- Test that port is read from environment and default handling is explicit.

**Step 2: Run the config tests to confirm failure**

Run: `go test ./internal/config -v`
Expected: FAIL because config code does not exist yet.

**Step 3: Write minimal config implementation**

- Load `.env` if present.
- Read `PORT`, `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`.
- Return a validated config struct.

**Step 4: Run config tests again**

Run: `go test ./internal/config -v`
Expected: PASS.

**Step 5: Write failing Basic Auth tests**

- Test that requests without credentials get `401`.
- Test that correct credentials reach the wrapped handler.

**Step 6: Run auth tests to confirm failure**

Run: `go test ./internal/auth -v`
Expected: FAIL because middleware does not exist yet.

**Step 7: Implement Basic Auth middleware**

- Use constant-time credential comparison.
- Return `WWW-Authenticate` on failure.

**Step 8: Run auth tests again**

Run: `go test ./internal/auth -v`
Expected: PASS.

### Task 3: Add shell discovery with tests

**Files:**
- Create: `internal/shells/discovery.go`
- Create: `internal/shells/discovery_test.go`

**Step 1: Write failing shell discovery tests**

- Test that only existing executables are returned.
- Test that Windows and Unix discovery logic can be driven through injectable lookup functions.
- Test duplicate shells are de-duplicated and labels are stable.

**Step 2: Run shell tests to confirm failure**

Run: `go test ./internal/shells -v`
Expected: FAIL.

**Step 3: Implement shell discovery**

- Detect Windows profiles: `pwsh`, `powershell`, `cmd`, Git Bash, `wsl`.
- Detect Unix profiles from `SHELL`, `/etc/shells`, and common names.
- Return stable profile ids, labels, commands, and args.

**Step 4: Run shell tests again**

Run: `go test ./internal/shells -v`
Expected: PASS.

### Task 4: Add PTY session manager and API

**Files:**
- Create: `internal/terminal/manager.go`
- Create: `internal/terminal/session.go`
- Create: `internal/terminal/manager_test.go`
- Create: `internal/httpapi/router.go`
- Create: `internal/httpapi/types.go`

**Step 1: Write failing session manager tests**

- Test session create/remove lifecycle.
- Test concurrent registry access safety.

**Step 2: Run terminal tests to confirm failure**

Run: `go test ./internal/terminal -v`
Expected: FAIL.

**Step 3: Implement terminal manager**

- Spawn PTY-backed shell process.
- Store sessions in a mutex-protected registry.
- Support write, resize, and cleanup operations.

**Step 4: Implement API routes**

- `GET /api/shells`
- `POST /api/sessions`
- `DELETE /api/sessions/:id`
- websocket session attach endpoint

**Step 5: Run backend package tests**

Run: `go test ./internal/... -v`
Expected: PASS.

### Task 5: Wire server bootstrap and static serving

**Files:**
- Create: `cmd/server/main.go`
- Create: `internal/server/server.go`

**Step 1: Implement server bootstrap**

- Load config.
- Build dependencies.
- Apply Basic Auth.
- Serve frontend build directory.

**Step 2: Run full backend tests**

Run: `go test ./...`
Expected: PASS.

**Step 3: Build backend binary**

Run: `go build ./...`
Expected: PASS.

### Task 6: Build frontend UI with type checks

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/api.ts`
- Create: `frontend/src/components/TerminalTabs.tsx`
- Create: `frontend/src/components/TerminalView.tsx`
- Create: `frontend/src/components/TopBar.tsx`
- Create: `frontend/src/styles.css`

**Step 1: Write frontend types and API client**

- Define shell and session payloads.
- Implement authenticated fetch helpers using browser-managed Basic Auth.

**Step 2: Build multi-tab terminal UI**

- Fetch shell list on load.
- Create, switch, and close terminal tabs.
- Mount one xterm.js instance per active session.

**Step 3: Typecheck frontend**

Run: `npm run typecheck`
Expected: PASS.

**Step 4: Build frontend**

Run: `npm run build`
Expected: PASS and generated assets available for the Go server.

### Task 7: Add environment example and README

**Files:**
- Create: `.env.example`
- Create: `README.md`

**Step 1: Document environment variables**

- `PORT`
- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`

**Step 2: Document setup and verification**

- dependency installation
- frontend build
- backend run
- local auth usage
- shell detection expectations by platform

### Task 8: End-to-end verification

**Files:**
- Modify: files created above as needed

**Step 1: Run diagnostics on changed files**

- Use language server diagnostics for Go and TypeScript files.

**Step 2: Run tests and builds**

Run: `go test ./... && go build ./... && npm run typecheck && npm run build`
Expected: PASS.

**Step 3: Run local smoke test**

Run: start the Go server with `.env` values present.
Expected:

- unauthenticated request returns `401`
- authenticated request returns app HTML
- `/api/shells` returns only installed shells
- multiple sessions can be created and cleaned up

**Step 4: Update docs if verification reveals gaps**

- Keep README and `.env.example` aligned with actual behavior.
