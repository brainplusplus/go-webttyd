package filesystem

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type SearchResult struct {
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Column  int    `json:"column"`
	Preview string `json:"preview"`
}

func Search(root string, query string, useRegex bool, maxResults int) ([]SearchResult, error) {
	var pattern *regexp.Regexp
	if useRegex {
		var err error
		pattern, err = regexp.Compile(query)
		if err != nil {
			return nil, err
		}
	}

	var results []SearchResult

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return err
		}

		if len(results) >= maxResults {
			return filepath.SkipAll
		}

		if info.Size() > 1024*1024 {
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return nil
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		lineNum := 0
		for scanner.Scan() {
			lineNum++
			line := scanner.Text()

			var col int
			var matched bool

			if pattern != nil {
				loc := pattern.FindStringIndex(line)
				if loc != nil {
					matched = true
					col = loc[0] + 1
				}
			} else {
				idx := strings.Index(line, query)
				if idx >= 0 {
					matched = true
					col = idx + 1
				}
			}

			if matched {
				relPath, _ := filepath.Rel(root, path)
				preview := line
				if len(preview) > 200 {
					preview = preview[:200]
				}

				results = append(results, SearchResult{
					Path:    relPath,
					Line:    lineNum,
					Column:  col,
					Preview: preview,
				})

				if len(results) >= maxResults {
					return filepath.SkipAll
				}
			}
		}

		return nil
	})

	return results, err
}
