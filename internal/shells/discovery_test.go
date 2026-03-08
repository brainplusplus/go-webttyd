package shells

import (
	"reflect"
	"testing"
)

func TestDiscoverWindowsProfilesIncludesOnlyAvailableEntries(t *testing.T) {
	resolver := resolver{
		lookPath: func(file string) (string, error) {
			available := map[string]string{
				"pwsh":    `C:\Program Files\PowerShell\7\pwsh.exe`,
				"cmd.exe": `C:\Windows\System32\cmd.exe`,
				"wsl.exe": `C:\Windows\System32\wsl.exe`,
			}
			path, ok := available[file]
			if !ok {
				return "", errNotFound(file)
			}
			return path, nil
		},
		stat: func(path string) error {
			if path == `C:\Program Files\Git\bin\bash.exe` {
				return nil
			}
			return errNotFound(path)
		},
		getenv: func(key string) string {
			if key == "ComSpec" {
				return `C:\Windows\System32\cmd.exe`
			}
			return ""
		},
		osName: "windows",
	}

	profiles := resolverDiscover(resolver)
	ids := profileIDs(profiles)

	expected := []string{"pwsh", "cmd", "git-bash", "wsl"}
	if !reflect.DeepEqual(ids, expected) {
		t.Fatalf("expected ids %v, got %v", expected, ids)
	}
}

func TestDiscoverUnixProfilesDeduplicatesAndFiltersMissingShells(t *testing.T) {
	resolver := resolver{
		lookPath: func(file string) (string, error) {
			available := map[string]string{
				"bash": "/usr/bin/bash",
				"zsh":  "/usr/bin/zsh",
			}
			path, ok := available[file]
			if !ok {
				return "", errNotFound(file)
			}
			return path, nil
		},
		readFile: func(path string) ([]byte, error) {
			if path != "/etc/shells" {
				return nil, errNotFound(path)
			}
			return []byte("/bin/bash\n/usr/bin/zsh\n/usr/local/bin/fish\n"), nil
		},
		getenv: func(key string) string {
			if key == "SHELL" {
				return "/bin/bash"
			}
			return ""
		},
		osName: "linux",
	}

	profiles := resolverDiscover(resolver)
	ids := profileIDs(profiles)

	expected := []string{"bash", "zsh"}
	if !reflect.DeepEqual(ids, expected) {
		t.Fatalf("expected ids %v, got %v", expected, ids)
	}
}

func profileIDs(profiles []Profile) []string {
	ids := make([]string, 0, len(profiles))
	for _, profile := range profiles {
		ids = append(ids, profile.ID)
	}
	return ids
}
