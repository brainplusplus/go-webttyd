package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMiddlewareRejectsMissingCredentials(t *testing.T) {
	handler := Middleware("alice", "secret")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
	if got := rec.Header().Get("WWW-Authenticate"); got == "" {
		t.Fatal("expected WWW-Authenticate header to be set")
	}
}

func TestMiddlewareAllowsValidCredentials(t *testing.T) {
	reached := false
	handler := Middleware("alice", "secret")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reached = true
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.SetBasicAuth("alice", "secret")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if !reached {
		t.Fatal("expected wrapped handler to be reached")
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}

func TestMiddlewareAllowsValidSessionCookie(t *testing.T) {
	handler := Middleware("alice", "secret")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(newSessionCookie("alice", "secret"))
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}
