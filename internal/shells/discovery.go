package shells

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

type Profile struct {
	ID      string   `json:"id"`
	Label   string   `json:"label"`
	Command string   `json:"command"`
	Args    []string `json:"args"`
}

type resolver struct {
	lookPath func(string) (string, error)
	stat     func(string) error
	readFile func(string) ([]byte, error)
	getenv   func(string) string
	osName   string
}

func Discover() []Profile {
	return resolverDiscover(resolver{
		lookPath: exec.LookPath,
		stat: func(path string) error {
			_, err := os.Stat(path)
			return err
		},
		readFile: os.ReadFile,
		getenv:   os.Getenv,
		osName:   runtime.GOOS,
	})
}

func resolverDiscover(r resolver) []Profile {
	if r.osName == "windows" {
		return discoverWindows(r)
	}
	return discoverUnix(r)
}

func discoverWindows(r resolver) []Profile {
	profiles := make([]Profile, 0, 5)

	if path, ok := lookupExisting(r, "pwsh"); ok {
		profiles = append(profiles, Profile{ID: "pwsh", Label: "PowerShell 7", Command: path})
	}

	if path, ok := lookupExisting(r, "powershell"); ok {
		profiles = append(profiles, Profile{ID: "powershell", Label: "Windows PowerShell", Command: path})
	}

	cmdPath := strings.TrimSpace(r.getenv("ComSpec"))
	if cmdPath == "" {
		if path, ok := lookupExisting(r, "cmd.exe"); ok {
			cmdPath = path
		}
	}
	if cmdPath != "" {
		profiles = append(profiles, Profile{ID: "cmd", Label: "Command Prompt", Command: cmdPath})
	}

	if path, ok := lookupGitBash(r); ok {
		profiles = append(profiles, Profile{ID: "git-bash", Label: "Git Bash", Command: path, Args: []string{"--login", "-i"}})
	}

	if path, ok := lookupExisting(r, "wsl.exe"); ok {
		profiles = append(profiles, Profile{ID: "wsl", Label: "WSL", Command: path})
	}

	return dedupeProfiles(profiles)
}

func discoverUnix(r resolver) []Profile {
	candidates := make([]string, 0, 8)
	shellEnv := strings.TrimSpace(r.getenv("SHELL"))
	if shellEnv != "" {
		candidates = append(candidates, filepath.Base(shellEnv))
	}

	if data, err := r.readFile("/etc/shells"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			trimmed := strings.TrimSpace(line)
			if trimmed == "" || strings.HasPrefix(trimmed, "#") {
				continue
			}
			candidates = append(candidates, filepath.Base(trimmed))
		}
	}

	candidates = append(candidates, "bash", "zsh", "sh", "fish")

	profiles := make([]Profile, 0, len(candidates))
	for _, name := range candidates {
		path, ok := lookupExisting(r, name)
		if !ok {
			continue
		}
		profiles = append(profiles, Profile{ID: profileID(name), Label: profileLabel(name), Command: path})
	}

	return dedupeProfiles(profiles)
}

func dedupeProfiles(profiles []Profile) []Profile {
	seen := make(map[string]struct{}, len(profiles))
	deduped := make([]Profile, 0, len(profiles))
	for _, profile := range profiles {
		if _, ok := seen[profile.ID]; ok {
			continue
		}
		seen[profile.ID] = struct{}{}
		deduped = append(deduped, profile)
	}
	return deduped
}

func lookupExisting(r resolver, name string) (string, bool) {
	path, err := r.lookPath(name)
	if err != nil {
		return "", false
	}
	return path, true
}

func lookupGitBash(r resolver) (string, bool) {
	if path, ok := lookupExisting(r, "bash.exe"); ok && strings.Contains(strings.ToLower(path), "git") {
		return path, true
	}

	candidates := []string{
		`C:\Program Files\Git\bin\bash.exe`,
		`C:\Program Files (x86)\Git\bin\bash.exe`,
	}

	for _, candidate := range candidates {
		if err := r.stat(candidate); err == nil {
			return candidate, true
		}
	}

	return "", false
}

func profileID(name string) string {
	switch name {
	case "bash":
		return "bash"
	case "zsh":
		return "zsh"
	case "sh":
		return "sh"
	case "fish":
		return "fish"
	default:
		return strings.ReplaceAll(strings.ToLower(name), " ", "-")
	}
}

func profileLabel(name string) string {
	switch name {
	case "bash":
		return "Bash"
	case "zsh":
		return "Zsh"
	case "sh":
		return "Sh"
	case "fish":
		return "Fish"
	default:
		return name
	}
}

type notFoundError string

func (e notFoundError) Error() string {
	return string(e)
}

func errNotFound(name string) error {
	return notFoundError(name)
}

func IsNotFound(err error) bool {
	var target notFoundError
	return errors.As(err, &target) || errors.Is(err, os.ErrNotExist)
}
