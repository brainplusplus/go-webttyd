package main

import (
	"log"

	"go-webttyd/internal/config"
	"go-webttyd/internal/server"
)

func main() {
	cfg, err := config.LoadFromEnv()
	if err != nil {
		log.Fatal(err)
	}

	srv := server.New(cfg)
	log.Printf("listening on http://localhost:%s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
