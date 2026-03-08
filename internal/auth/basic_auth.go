package auth

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
)

const sessionCookieName = "web_terminal_auth"

func Middleware(username string, password string) func(http.Handler) http.Handler {
	userBytes := []byte(username)
	passBytes := []byte(password)
	expectedCookieValue := sessionCookieValue(username, password)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if cookie, err := r.Cookie(sessionCookieName); err == nil {
				if subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(expectedCookieValue)) == 1 {
					next.ServeHTTP(w, r)
					return
				}
			}

			user, pass, ok := r.BasicAuth()
			if !ok || subtle.ConstantTimeCompare([]byte(user), userBytes) != 1 || subtle.ConstantTimeCompare([]byte(pass), passBytes) != 1 {
				w.Header().Set("WWW-Authenticate", `Basic realm="web-terminal"`)
				http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
				return
			}

			http.SetCookie(w, newSessionCookie(username, password))

			next.ServeHTTP(w, r)
		})
	}
}

func newSessionCookie(username string, password string) *http.Cookie {
	return &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionCookieValue(username, password),
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
}

func sessionCookieValue(username string, password string) string {
	sum := sha256.Sum256([]byte(username + "\x00" + password))
	return hex.EncodeToString(sum[:])
}
