package config

import (
	"testing"
)

func TestLoadFromEnvUsesDefaultPortWhenUnset(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("BASIC_AUTH_USERNAME", "alice")
	t.Setenv("BASIC_AUTH_PASSWORD", "secret")

	cfg, err := LoadFromEnv()
	if err != nil {
		t.Fatalf("LoadFromEnv returned error: %v", err)
	}

	if cfg.Port != "8080" {
		t.Fatalf("expected default port 8080, got %q", cfg.Port)
	}
}

func TestLoadFromEnvRejectsMissingCredentials(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("BASIC_AUTH_USERNAME", "")
	t.Setenv("BASIC_AUTH_PASSWORD", "")

	_, err := LoadFromEnv()
	if err == nil {
		t.Fatal("expected error for missing credentials")
	}
}

func TestLoadFromEnvReadsConfiguredValues(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("BASIC_AUTH_USERNAME", "bob")
	t.Setenv("BASIC_AUTH_PASSWORD", "hunter2")

	cfg, err := LoadFromEnv()
	if err != nil {
		t.Fatalf("LoadFromEnv returned error: %v", err)
	}

	if cfg.Port != "9090" {
		t.Fatalf("expected configured port, got %q", cfg.Port)
	}
	if cfg.BasicAuthUsername != "bob" {
		t.Fatalf("expected configured username, got %q", cfg.BasicAuthUsername)
	}
	if cfg.BasicAuthPassword != "hunter2" {
		t.Fatalf("expected configured password, got %q", cfg.BasicAuthPassword)
	}
}
