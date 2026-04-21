package terminal

import (
	"errors"
	"sync"

	"github.com/google/uuid"
)

type ShellProfile struct {
	ID      string   `json:"id"`
	Label   string   `json:"label"`
	Command string   `json:"command"`
	Args    []string `json:"args"`
	CWD     string   `json:"cwd,omitempty"`
}

type PtySession interface {
	ID() string
	Profile() ShellProfile
	Read([]byte) (int, error)
	Write([]byte) (int, error)
	Resize(cols uint16, rows uint16) error
	Close() error
}

type SpawnFunc func(profile ShellProfile) (PtySession, error)

type ManagedSession struct {
	ID      string       `json:"id"`
	Profile ShellProfile `json:"profile"`
	pty     PtySession
}

func (s *ManagedSession) Read(p []byte) (int, error) {
	return s.pty.Read(p)
}

func (s *ManagedSession) Write(p []byte) (int, error) {
	return s.pty.Write(p)
}

func (s *ManagedSession) Resize(cols uint16, rows uint16) error {
	return s.pty.Resize(cols, rows)
}

func (s *ManagedSession) Close() error {
	return s.pty.Close()
}

type Manager struct {
	mu       sync.RWMutex
	sessions map[string]*ManagedSession
	spawn    SpawnFunc
}

func NewManager(spawn SpawnFunc) *Manager {
	return &Manager{
		sessions: make(map[string]*ManagedSession),
		spawn:    spawn,
	}
}

func (m *Manager) Create(profile ShellProfile) (*ManagedSession, error) {
	if m.spawn == nil {
		return nil, errors.New("spawn function is required")
	}

	ptySession, err := m.spawn(profile)
	if err != nil {
		return nil, err
	}

	id := ptySession.ID()
	if id == "" {
		id = uuid.NewString()
	}

	session := &ManagedSession{
		ID:      id,
		Profile: ptySession.Profile(),
		pty:     ptySession,
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[id] = session

	return session, nil
}

func (m *Manager) Get(id string) (*ManagedSession, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	session, ok := m.sessions[id]
	return session, ok
}

func (m *Manager) Remove(id string) error {
	m.mu.Lock()
	session, ok := m.sessions[id]
	if ok {
		delete(m.sessions, id)
	}
	m.mu.Unlock()

	if !ok {
		return nil
	}

	return session.Close()
}
