package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"go-webttyd/internal/shells"
	"go-webttyd/internal/terminal"

	"github.com/gorilla/websocket"
)

func TestRouterReturnsShellProfiles(t *testing.T) {
	api := New(Dependencies{
		Shells:   []shells.Profile{{ID: "bash", Label: "Bash", Command: "/usr/bin/bash"}},
		Sessions: &fakeManager{},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/shells", nil)
	rec := httptest.NewRecorder()

	api.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestRouterCreatesAndDeletesSession(t *testing.T) {
	manager := &fakeManager{}
	api := New(Dependencies{
		Shells:   []shells.Profile{{ID: "bash", Label: "Bash", Command: "bash"}},
		Sessions: manager,
	})

	body, err := json.Marshal(createSessionRequest{ShellID: "bash"})
	if err != nil {
		t.Fatalf("Marshal returned error: %v", err)
	}

	createReq := httptest.NewRequest(http.MethodPost, "/api/sessions", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	api.Handler().ServeHTTP(rec, createReq)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/sessions/session-1", nil)
	deleteRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(deleteRec, deleteReq)

	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", deleteRec.Code)
	}
	if manager.removedID != "session-1" {
		t.Fatalf("expected removed session id session-1, got %q", manager.removedID)
	}
}

func TestWebSocketDisconnectRemovesSession(t *testing.T) {
	manager := terminal.NewManager(func(profile terminal.ShellProfile) (terminal.PtySession, error) {
		return &blockingSession{id: "session-1", profile: profile, closed: make(chan struct{})}, nil
	})

	session, err := manager.Create(terminal.ShellProfile{ID: "pwsh", Label: "PowerShell 7", Command: "pwsh.exe"})
	if err != nil {
		t.Fatalf("Create returned error: %v", err)
	}

	api := New(Dependencies{Sessions: manager})
	server := httptest.NewServer(api.Handler())
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/sessions/" + session.ID
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Dial returned error: %v", err)
	}

	if err := conn.Close(); err != nil {
		t.Fatalf("Close returned error: %v", err)
	}

	deadline := time.Now().Add(500 * time.Millisecond)
	for time.Now().Before(deadline) {
		if _, ok := manager.Get(session.ID); !ok {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}

	t.Fatal("expected session to be removed after websocket disconnect")
}

func TestUpgraderRejectsDifferentOrigin(t *testing.T) {
	api := New(Dependencies{Sessions: &fakeManager{}})
	req := httptest.NewRequest(http.MethodGet, "http://localhost/ws/sessions/session-1", nil)
	req.Host = "localhost"
	req.Header.Set("Origin", "http://evil.example")

	if api.upgrader.CheckOrigin(req) {
		t.Fatal("expected foreign origin to be rejected")
	}
}

type fakeManager struct {
	removedID string
}

func (f *fakeManager) Create(profile terminal.ShellProfile) (*terminal.ManagedSession, error) {
	return &terminal.ManagedSession{ID: "session-1", Profile: profile}, nil
}

func (f *fakeManager) Get(id string) (*terminal.ManagedSession, bool) {
	return nil, false
}

func (f *fakeManager) Remove(id string) error {
	f.removedID = id
	return nil
}

type blockingSession struct {
	id      string
	profile terminal.ShellProfile
	closed  chan struct{}
}

func (s *blockingSession) ID() string {
	return s.id
}

func (s *blockingSession) Profile() terminal.ShellProfile {
	return s.profile
}

func (s *blockingSession) Read([]byte) (int, error) {
	<-s.closed
	return 0, io.EOF
}

func (s *blockingSession) Write(p []byte) (int, error) {
	return len(p), nil
}

func (s *blockingSession) Resize(cols uint16, rows uint16) error {
	return nil
}

func (s *blockingSession) Close() error {
	select {
	case <-s.closed:
	default:
		close(s.closed)
	}
	return nil
}
