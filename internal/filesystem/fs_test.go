package filesystem

import (
	"os"
	"path/filepath"
	"testing"
)

func TestListDirectoryReturnsEntries(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "hello.txt"), []byte("hi"), 0644)
	_ = os.Mkdir(filepath.Join(dir, "subdir"), 0755)

	entries, err := ListDirectory(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	names := map[string]bool{}
	for _, e := range entries {
		names[e.Name] = true
	}
	if !names["hello.txt"] || !names["subdir"] {
		t.Fatalf("expected hello.txt and subdir, got %v", entries)
	}
}

func TestListDirectoryDistinguishesTypes(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "file.txt"), []byte("data"), 0644)
	_ = os.Mkdir(filepath.Join(dir, "folder"), 0755)

	entries, err := ListDirectory(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, e := range entries {
		if e.Name == "file.txt" && e.Type != "file" {
			t.Fatalf("expected type 'file' for file.txt, got %q", e.Type)
		}
		if e.Name == "folder" && e.Type != "dir" {
			t.Fatalf("expected type 'dir' for folder, got %q", e.Type)
		}
	}
}

func TestListDirectoryReturnsErrorForNonexistent(t *testing.T) {
	_, err := ListDirectory(filepath.Join(t.TempDir(), "nonexistent"))
	if err == nil {
		t.Fatal("expected error for nonexistent directory")
	}
}

func TestReadFileReturnsContent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "test.txt")
	_ = os.WriteFile(path, []byte("hello world"), 0644)

	result, err := ReadFile(path, 10*1024*1024)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Content != "hello world" {
		t.Fatalf("expected 'hello world', got %q", result.Content)
	}
}

func TestWriteFileCreatesAndWrites(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.txt")

	err := WriteFile(path, "new content")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	data, _ := os.ReadFile(path)
	if string(data) != "new content" {
		t.Fatalf("expected 'new content', got %q", string(data))
	}
}

func TestCreateFileCreatesEmptyFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "new.txt")

	err := CreateEntry(path, "file")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("file not created: %v", err)
	}
	if info.IsDir() {
		t.Fatal("expected file, got directory")
	}
}

func TestCreateDirCreatesDirectory(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "newdir")

	err := CreateEntry(path, "dir")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("dir not created: %v", err)
	}
	if !info.IsDir() {
		t.Fatal("expected directory, got file")
	}
}

func TestDeleteEntryRemovesFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "doomed.txt")
	_ = os.WriteFile(path, []byte("bye"), 0644)

	err := DeleteEntry(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatal("file should have been deleted")
	}
}

func TestRenameEntryMovesFile(t *testing.T) {
	dir := t.TempDir()
	old := filepath.Join(dir, "old.txt")
	newPath := filepath.Join(dir, "new.txt")
	_ = os.WriteFile(old, []byte("data"), 0644)

	err := RenameEntry(old, newPath)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, err := os.Stat(old); !os.IsNotExist(err) {
		t.Fatal("old file should not exist")
	}
	data, _ := os.ReadFile(newPath)
	if string(data) != "data" {
		t.Fatalf("expected 'data', got %q", string(data))
	}
}

func TestCopyEntryCopiesFile(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "src.txt")
	dst := filepath.Join(dir, "dst.txt")
	_ = os.WriteFile(src, []byte("copy me"), 0644)

	err := CopyEntry(src, dst)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	srcData, _ := os.ReadFile(src)
	dstData, _ := os.ReadFile(dst)
	if string(srcData) != string(dstData) {
		t.Fatal("copy content mismatch")
	}
}
