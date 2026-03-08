package terminal

import (
	"errors"
	"os"
	"sync"

	ptylib "github.com/aymanbagabas/go-pty"
	"github.com/google/uuid"
)

type liveSession struct {
	id      string
	profile ShellProfile
	pty     ptylib.Pty
	cmd     *ptylib.Cmd
	closeMu sync.Once
}

func NewPTYSpawnFunc() SpawnFunc {
	return func(profile ShellProfile) (PtySession, error) {
		if profile.Command == "" {
			return nil, errors.New("shell command is required")
		}

		pseudo, err := ptylib.New()
		if err != nil {
			return nil, err
		}

		cmd := pseudo.Command(profile.Command, profile.Args...)
		cmd.Dir = currentWorkingDirectory()
		cmd.Env = os.Environ()
		if err := cmd.Start(); err != nil {
			_ = pseudo.Close()
			return nil, err
		}

		session := &liveSession{
			id:      uuid.NewString(),
			profile: profile,
			pty:     pseudo,
			cmd:     cmd,
		}

		go func() {
			_ = cmd.Wait()
			_ = session.Close()
		}()

		return session, nil
	}
}

func (s *liveSession) ID() string {
	return s.id
}

func (s *liveSession) Profile() ShellProfile {
	return s.profile
}

func (s *liveSession) Read(p []byte) (int, error) {
	return s.pty.Read(p)
}

func (s *liveSession) Write(p []byte) (int, error) {
	return s.pty.Write(p)
}

func (s *liveSession) Resize(cols uint16, rows uint16) error {
	return s.pty.Resize(int(cols), int(rows))
}

func (s *liveSession) Close() error {
	var closeErr error
	s.closeMu.Do(func() {
		if s.cmd != nil && s.cmd.Process != nil {
			_ = s.cmd.Process.Kill()
		}
		if s.pty != nil {
			closeErr = s.pty.Close()
		}
	})
	return closeErr
}

func currentWorkingDirectory() string {
	dir, err := os.Getwd()
	if err != nil {
		return ""
	}
	return dir
}
