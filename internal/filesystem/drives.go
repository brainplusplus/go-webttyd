package filesystem

import (
	"os"
	"runtime"
)

func ListDrives() []string {
	if runtime.GOOS != "windows" {
		return []string{"/"}
	}

	var drives []string
	for letter := 'A'; letter <= 'Z'; letter++ {
		root := string(letter) + `:\`
		if dirExists(root) {
			drives = append(drives, root)
		}
	}
	return drives
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}
