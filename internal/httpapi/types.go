package httpapi

import "go-webttyd/internal/terminal"

type createSessionRequest struct {
	ShellID string `json:"shellId"`
}

type createSessionResponse struct {
	ID      string                `json:"id"`
	Profile terminal.ShellProfile `json:"profile"`
}

type wsInboundMessage struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
	Cols uint16 `json:"cols,omitempty"`
	Rows uint16 `json:"rows,omitempty"`
}

type wsOutboundMessage struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
}
