package filesystem

import (
	"path/filepath"
	"runtime"
	"testing"
)

func TestValidatePathAllowsChildPaths(t *testing.T) {
	root := "/home/user/projects"
	if runtime.GOOS == "windows" {
		root = `C:\Users\user\projects`
	}

	child := filepath.Join(root, "myapp", "main.go")
	result, err := ValidatePath(root, child)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != child {
		t.Fatalf("expected %q, got %q", child, result)
	}
}

func TestValidatePathRejectsTraversal(t *testing.T) {
	root := "/home/user/projects"
	if runtime.GOOS == "windows" {
		root = `C:\Users\user\projects`
	}

	_, err := ValidatePath(root, filepath.Join(root, "..", "..", "etc", "passwd"))
	if err == nil {
		t.Fatal("expected error for path traversal")
	}
}

func TestValidatePathAllowsRootItself(t *testing.T) {
	root := "/home/user/projects"
	if runtime.GOOS == "windows" {
		root = `C:\Users\user\projects`
	}

	result, err := ValidatePath(root, root)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != root {
		t.Fatalf("expected %q, got %q", root, result)
	}
}

func TestValidatePathWithEmptyRootAllowsAnything(t *testing.T) {
	result, err := ValidatePath("", "/any/path/at/all")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result == "" {
		t.Fatal("expected non-empty result")
	}
}
