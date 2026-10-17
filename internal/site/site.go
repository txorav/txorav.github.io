package site

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/mail"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

type Config struct {
	Name        string `json:"name"`
	Author      string `json:"author"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Email       string `json:"email"`
	Language    string `json:"language"`
	License     string `json:"license"`
}

type Service struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Summary      string   `json:"summary"`
	Price        string   `json:"price"`
	Deliverables []string `json:"deliverables"`
}

type Project struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Category    string      `json:"category"`
	Description string      `json:"description"`
	Body        string      `json:"body"`
	Tags        []string    `json:"tags"`
	Image       string      `json:"image"`
	Metrics     [][2]string `json:"metrics"`
	URL         string      `json:"url"`
}

type Post struct {
	Title          string        `json:"title"`
	Description    string        `json:"description"`
	Date           string        `json:"date"`
	Tags           []string      `json:"tags"`
	Draft          bool          `json:"draft"`
	Slug           string        `json:"-"`
	Published      time.Time     `json:"-"`
	Content        template.HTML `json:"-"`
	ReadingMinutes int           `json:"-"`
}

type NavItem struct{ Key, Label, Path string }
type Crumb struct {
	Label, Path string
	Current     bool
}
type Page struct {
	Site                                       *Site
	Template, Path, Title, Description, Active string
	Styles, Scripts, Filters                   []string
	Crumbs                                     []Crumb
	Projects                                   []Project
	Posts                                      []*Post
	Service                                    *Service
	Project                                    *Project
	Post, Newer, Older                         *Post
	Schema                                     template.JS
}

type Site struct {
	Root       string
	Config     Config
	BasePath   string
	Services   []Service
	Workflow   [][2]string
	Projects   []Project
	Posts      []*Post
	Navigation []NavItem
	Pages      []Page
	NotFound   Page
	baseURL    *url.URL
	templates  map[string]*template.Template
	byPath     map[string]Page
	now        time.Time
}

var routes = map[string]string{"home": "", "about": "#about", "services": "services/", "projects": "projects/", "contact": "contact/", "blog": "blog/", "rss": "rss.xml"}
var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
var htmlTags = regexp.MustCompile(`<[^>]*>`)

func readJSON(path string, target any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	return nil
}

func Load(root string) (*Site, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	s := &Site{Root: root, now: time.Now().UTC()}
	if err := readJSON(filepath.Join(root, "src/data/site.json"), &s.Config); err != nil {
		return nil, err
	}
	if value := os.Getenv("SITE_URL"); value != "" {
		s.Config.URL = value
	}
	if value, ok := os.LookupEnv("CONTACT_EMAIL"); ok {
		s.Config.Email = value
	}
	u, err := url.Parse(s.Config.URL)
	if err != nil {
		return nil, fmt.Errorf("site URL: %w", err)
	}
	if (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		return nil, fmt.Errorf("site URL must be an absolute HTTP(S) URL without credentials, query, or fragment")
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/"
	u.RawPath = ""
	s.baseURL, s.BasePath, s.Config.URL = u, u.EscapedPath(), u.String()
	s.Config.Email = strings.TrimSpace(s.Config.Email)
	if s.Config.Email != "" {
		address, err := mail.ParseAddress(s.Config.Email)
		if err != nil || address.Address != s.Config.Email {
			return nil, fmt.Errorf("configure a plain, valid contact email address")
		}
	}
	if s.Config.Name == "" || s.Config.Author == "" || s.Config.Language == "" {
		return nil, fmt.Errorf("site name, author, and language are required")
	}
	var catalog struct {
		Services []Service   `json:"services"`
		Workflow [][2]string `json:"workflow"`
	}
	if err := readJSON(filepath.Join(root, "src/data/services.json"), &catalog); err != nil {
		return nil, err
	}
	s.Services, s.Workflow = catalog.Services, catalog.Workflow
	if err := readJSON(filepath.Join(root, "src/data/projects.json"), &s.Projects); err != nil {
		return nil, err
	}
	ids := map[string]bool{}
	for _, item := range s.Services {
		if !slugPattern.MatchString(item.ID) || ids[item.ID] {
			return nil, fmt.Errorf("invalid or duplicate service id: %s", item.ID)
		}
		ids[item.ID] = true
	}
	ids = map[string]bool{}
	for _, item := range s.Projects {
		if !slugPattern.MatchString(item.ID) || ids[item.ID] {
			return nil, fmt.Errorf("invalid or duplicate project id: %s", item.ID)
		}
		ids[item.ID] = true
		if item.URL != "" {
			link, err := url.Parse(item.URL)
			if err != nil || (link.Scheme != "http" && link.Scheme != "https") || link.Host == "" {
				return nil, fmt.Errorf("project %s: use a public HTTP(S) URL", item.ID)
			}
		}
	}
	if err := s.loadPosts(); err != nil {
		return nil, err
	}
	s.Navigation = []NavItem{{"home", "About Me", routes["about"]}, {"services", "Services", routes["services"]}, {"projects", "Projects", routes["projects"]}, {"blog", "Blog", routes["blog"]}, {"contact", "Contact Me", routes["contact"]}}
	if err := s.preparePages(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Site) loadPosts() error {
	dir := filepath.Join(s.Root, "src/content/posts")
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		slug := strings.TrimSuffix(entry.Name(), ".json")
		if !slugPattern.MatchString(slug) {
			return fmt.Errorf("invalid article filename: %s", entry.Name())
		}
		post := &Post{Slug: slug}
		if err := readJSON(filepath.Join(dir, entry.Name()), post); err != nil {
			return err
		}
		post.Title, post.Description = strings.TrimSpace(post.Title), strings.TrimSpace(post.Description)
		published, err := time.Parse(time.DateOnly, post.Date)
		if err != nil || post.Title == "" || post.Description == "" {
			return fmt.Errorf("%s: title, description, and a valid YYYY-MM-DD date are required", entry.Name())
		}
		post.Published = published
		for i, tag := range post.Tags {
			post.Tags[i] = strings.TrimSpace(tag)
			if post.Tags[i] == "" || post.Tags[i] == "All" {
				return fmt.Errorf("%s: tags must be nonempty; All is reserved", entry.Name())
			}
		}
		post.Tags = unique(post.Tags)
		if post.Draft || post.Date > s.now.Format(time.DateOnly) {
			continue
		}
		body, err := os.ReadFile(filepath.Join(dir, slug+".html"))
		if err != nil {
			return err
		}
		if strings.TrimSpace(string(body)) == "" {
			return fmt.Errorf("%s.html is empty", slug)
		}
		// Only checked-in, author-written article HTML is trusted; metadata stays escaped.
		post.Content = template.HTML(body)
		post.ReadingMinutes = max(1, (len(strings.Fields(htmlTags.ReplaceAllString(string(body), " ")))+199)/200)
		s.Posts = append(s.Posts, post)
	}
	sort.Slice(s.Posts, func(i, j int) bool {
		if s.Posts[i].Date == s.Posts[j].Date {
			return s.Posts[i].Slug < s.Posts[j].Slug
		}
		return s.Posts[i].Date > s.Posts[j].Date
	})
	return nil
}

func unique(values []string) []string {
	seen := map[string]bool{}
	result := []string{}
	for _, value := range values {
		if !seen[value] {
			seen[value] = true
			result = append(result, value)
		}
	}
	return result
}

func (s *Site) Path(path string) string { return s.BasePath + strings.TrimLeft(path, "/") }
func (s *Site) Absolute(path string) string {
	reference, err := url.Parse(strings.TrimLeft(path, "/"))
	if err != nil {
		return ""
	}
	return s.baseURL.ResolveReference(reference).String()
}
func servicePath(id string) string   { return routes["services"] + id + "/" }
func projectPath(id string) string   { return routes["projects"] + id + "/" }
func articlePath(slug string) string { return routes["blog"] + slug + "/" }
