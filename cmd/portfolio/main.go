package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/txorav/txorav.github.io/internal/site"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	command := "serve"
	args := os.Args[1:]
	if len(args) > 0 && args[0][0] != '-' {
		command, args = args[0], args[1:]
	}
	if command != "build" && command != "serve" {
		return fmt.Errorf("usage: portfolio [build|serve] [-root .] [-out dist] [-addr 127.0.0.1:8000]")
	}
	flags := flag.NewFlagSet(command, flag.ContinueOnError)
	root := flags.String("root", ".", "repository directory")
	out := flags.String("out", "dist", "generated static site directory")
	defaultAddr := "127.0.0.1:8000"
	if port := os.Getenv("PORT"); port != "" {
		defaultAddr = "127.0.0.1:" + port
	}
	addr := flags.String("addr", defaultAddr, "development server listen address")
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("unexpected arguments: %v", flags.Args())
	}
	app, err := site.Load(*root)
	if err != nil {
		return err
	}
	if command == "build" {
		if err := app.Build(*out); err != nil {
			return err
		}
		fmt.Printf("Generated %d pages, RSS, and sitemap in %s/.\n", len(app.Pages), *out)
		return nil
	}
	server := &http.Server{Addr: *addr, Handler: app.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdown); err != nil {
			log.Printf("shutdown: %v", err)
			_ = server.Close()
		}
	}()
	fmt.Printf("Serving at http://%s%s (restart after source edits).\n", *addr, app.BasePath)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
