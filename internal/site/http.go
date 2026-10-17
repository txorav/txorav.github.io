package site

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

func (s *Site) Handler() http.Handler {
	mux := http.NewServeMux()
	assets := s.Path("assets/")
	mux.Handle(assets, http.StripPrefix(assets, http.FileServer(http.Dir(filepath.Join(s.Root, "src/assets")))))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		respond := func(status int, body []byte, contentType string) {
			w.Header().Set("Content-Type", contentType)
			w.WriteHeader(status)
			if r.Method != http.MethodHead {
				_, _ = w.Write(body)
			}
		}
		render := func(status int, page Page) {
			body, err := s.Render(page)
			if err != nil {
				log.Printf("render: %v", err)
				http.Error(w, "Unable to render this page.", http.StatusInternalServerError)
				return
			}
			respond(status, body, "text/html; charset=utf-8")
		}
		redirect := func(target string) {
			if r.URL.RawQuery != "" {
				target += "?" + r.URL.RawQuery
			}
			http.Redirect(w, r, target, http.StatusPermanentRedirect)
		}
		base := s.baseURL.Path
		if base != "/" && r.URL.Path == strings.TrimSuffix(base, "/") {
			redirect(s.BasePath)
			return
		}
		if !strings.HasPrefix(r.URL.Path, base) {
			render(http.StatusNotFound, s.NotFound)
			return
		}
		path := strings.TrimPrefix(r.URL.Path, base)
		if page, ok := s.byPath[path]; ok {
			render(http.StatusOK, page)
			return
		}
		if page, ok := s.byPath[path+"/"]; ok {
			redirect(s.Path(page.Path))
			return
		}
		if strings.HasSuffix(path, "index.html") {
			if page, ok := s.byPath[strings.TrimSuffix(path, "index.html")]; ok {
				redirect(s.Path(page.Path))
				return
			}
		}
		var body []byte
		var err error
		switch path {
		case routes["rss"]:
			body, err = s.RSS()
			if err == nil {
				respond(http.StatusOK, body, "application/rss+xml; charset=utf-8")
				return
			}
		case "sitemap.xml":
			body, err = s.Sitemap()
			if err == nil {
				respond(http.StatusOK, body, "application/xml; charset=utf-8")
				return
			}
		case "robots.txt":
			respond(http.StatusOK, s.Robots(), "text/plain; charset=utf-8")
			return
		default:
			render(http.StatusNotFound, s.NotFound)
			return
		}
		log.Printf("publish: %v", err)
		http.Error(w, "Unable to generate this resource.", http.StatusInternalServerError)
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Cache-Control", "no-store")
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, fmt.Sprintf("Method %s is not allowed.", r.Method), http.StatusMethodNotAllowed)
			return
		}
		mux.ServeHTTP(w, r)
	})
}
