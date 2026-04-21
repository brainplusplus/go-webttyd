package filesystem

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSearchFindsMatchingLines(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "main.go"), []byte("package main\n// TODO: fix this\nfunc main() {}\n"), 0644)

	results, err := Search(dir, "TODO", false, 100)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	if results[0].Line != 2 {
		t.Fatalf("expected line 2, got %d", results[0].Line)
	}
}

func TestSearchRespectsMaxResults(t *testing.T) {
	dir := t.TempDir()
	content := "match\nmatch\nmatch\nmatch\nmatch\n"
	_ = os.WriteFile(filepath.Join(dir, "many.txt"), []byte(content), 0644)

	results, err := Search(dir, "match", false, 2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}
}

func TestSearchRecursesSubdirectories(t *testing.T) {
	dir := t.TempDir()
	sub := filepath.Join(dir, "sub")
	_ = os.Mkdir(sub, 0755)
	_ = os.WriteFile(filepath.Join(sub, "nested.txt"), []byte("findme here\n"), 0644)

	results, err := Search(dir, "findme", false, 100)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
}

func TestSearchWithRegex(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "code.go"), []byte("func Hello() {}\nfunc World() {}\n"), 0644)

	results, err := Search(dir, `func \w+\(\)`, true, 100)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}
}
