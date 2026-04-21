package filesystem

import (
	"fmt"
	"path/filepath"
	"strings"
)

// ValidatePath ensures the given path is within the allowed root.
// If root is empty, all paths are allowed (full filesystem access).
func ValidatePath(root string, requestedPath string) (string, error) {
	cleaned := filepath.Clean(requestedPath)

	if root == "" {
		abs, err := filepath.Abs(cleaned)
		if err != nil {
			return "", fmt.Errorf("invalid path: %w", err)
		}
		return abs, nil
	}

	absRoot, err := filepath.Abs(root)
	if err != nil {
		return "", fmt.Errorf("invalid root path: %w", err)
	}

	absPath, err := filepath.Abs(cleaned)
	if err != nil {
		return "", fmt.Errorf("invalid path: %w", err)
	}

	if !strings.HasPrefix(absPath, absRoot) {
		return "", fmt.Errorf("path %q is outside workspace root %q", requestedPath, root)
	}

	return absPath, nil
}
