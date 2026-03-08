package config

import (
	"errors"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	BasicAuthUsername string
	BasicAuthPassword string
}

func LoadFromEnv() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		Port:              strings.TrimSpace(os.Getenv("PORT")),
		BasicAuthUsername: os.Getenv("BASIC_AUTH_USERNAME"),
		BasicAuthPassword: os.Getenv("BASIC_AUTH_PASSWORD"),
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	if strings.TrimSpace(cfg.BasicAuthUsername) == "" || strings.TrimSpace(cfg.BasicAuthPassword) == "" {
		return Config{}, errors.New("BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD are required")
	}

	return cfg, nil
}
