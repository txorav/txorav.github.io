package site

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func crumbs(items ...Crumb) []Crumb {
	result := append([]Crumb{{Label: "Home"}}, items...)
	result[len(result)-1].Current = true
	return result
}

func (s *Site) preparePages() error {
	functions := template.FuncMap{
		"path": s.Path,
		"asset": func(path string) string {
			return fmt.Sprintf("%s?v=%d", s.Path(path), s.now.UnixNano())
		},
		"absolute": s.Absolute,
		"route": func(name string) (string, error) {
			value, ok := routes[name]
			if !ok {
				return "", fmt.Errorf("unknown route %q", name)
			}
			return s.Path(value), nil
		},
		"serviceURL":     func(id string) string { return s.Path(servicePath(id)) },
		"projectURL":     func(id string) string { return s.Path(projectPath(id)) },
		"articleURL":     func(slug string) string { return s.Path(articlePath(slug)) },
		"topicURL":       func(tag string) string { return s.Path(routes["blog"] + "?tag=" + url.QueryEscape(tag)) },
		"serviceInquiry": func(id string) string { return s.Path(routes["contact"] + "?service=" + url.QueryEscape(id)) },
		"projectInquiry": func(title string) string { return s.Path(routes["contact"] + "?project=" + url.QueryEscape(title)) },
		"join":           strings.Join,
		"list":           func(value string) []string { return []string{value} },
		"json":           func(value any) (string, error) { data, err := json.Marshal(value); return string(data), err },
		"date": func(value string) string {
			date, _ := time.Parse(time.DateOnly, value)
			return date.Format("January 2, 2006")
		},
		"inc": func(value int) int { return value + 1 },
		"dict": func(values ...any) (map[string]any, error) {
			if len(values)%2 != 0 {
				return nil, fmt.Errorf("dict requires key/value pairs")
			}
			result := map[string]any{}
			for i := 0; i < len(values); i += 2 {
				key, ok := values[i].(string)
				if !ok {
					return nil, fmt.Errorf("dict keys must be strings")
				}
				result[key] = values[i+1]
			}
			return result, nil
		},
	}
	fs := os.DirFS(filepath.Join(s.Root, "src/templates"))
	base, err := template.New("site").Funcs(functions).ParseFS(fs, "layout.gohtml", "partials/*.gohtml")
	if err != nil {
		return fmt.Errorf("shared templates: %w", err)
	}
	s.templates = map[string]*template.Template{}
	for _, name := range []string{"home", "services", "service", "projects", "project", "blog", "article", "contact", "notfound"} {
		t, err := base.Clone()
		if err != nil {
			return err
		}
		if _, err = t.ParseFS(fs, "pages/"+name+".gohtml"); err != nil {
			return fmt.Errorf("%s template: %w", name, err)
		}
		s.templates[name] = t
	}
	s.Pages = []Page{
		{Template: "home", Title: "Developer & Scientist Portfolio", Active: "home", Styles: []string{"home", "blog"}, Projects: s.Projects[:min(3, len(s.Projects))], Posts: s.Posts[:min(1, len(s.Posts))]},
		{Template: "services", Path: routes["services"], Title: "Services & Solutions", Active: "services", Styles: []string{"catalog"}, Crumbs: crumbs(Crumb{Label: "Services"})},
		{Template: "projects", Path: routes["projects"], Title: "Projects", Active: "projects", Styles: []string{"catalog"}, Scripts: []string{"filters"}, Projects: s.Projects, Crumbs: crumbs(Crumb{Label: "Projects"})},
		{Template: "contact", Path: routes["contact"], Title: "Contact", Active: "contact", Styles: []string{"contact"}, Scripts: []string{"contact"}, Crumbs: crumbs(Crumb{Label: "Contact"})},
		{Template: "blog", Path: routes["blog"], Title: "Blog", Description: "Notes on software engineering, design, and automation from TXO R.", Active: "blog", Styles: []string{"blog", "catalog"}, Scripts: []string{"filters"}, Posts: s.Posts, Crumbs: crumbs(Crumb{Label: "Blog"})},
	}
	var categories, tags []string
	for _, project := range s.Projects {
		categories = append(categories, project.Category)
	}
	for _, post := range s.Posts {
		tags = append(tags, post.Tags...)
	}
	s.Pages[2].Filters = unique(categories)
	s.Pages[4].Filters = unique(tags)
	for i := range s.Services {
		item := &s.Services[i]
		s.Pages = append(s.Pages, Page{Template: "service", Path: servicePath(item.ID), Title: item.Name, Description: item.Summary, Active: "services", Styles: []string{"catalog"}, Service: item, Crumbs: crumbs(Crumb{Label: "Services", Path: routes["services"]}, Crumb{Label: item.Name})})
	}
	for i := range s.Projects {
		item := &s.Projects[i]
		s.Pages = append(s.Pages, Page{Template: "project", Path: projectPath(item.ID), Title: item.Title, Description: item.Description, Active: "projects", Styles: []string{"catalog"}, Project: item, Crumbs: crumbs(Crumb{Label: "Projects", Path: routes["projects"]}, Crumb{Label: item.Title})})
	}
	for i, post := range s.Posts {
		page := Page{Template: "article", Path: articlePath(post.Slug), Title: post.Title, Description: post.Description, Active: "blog", Styles: []string{"blog"}, Post: post, Crumbs: crumbs(Crumb{Label: "Blog", Path: routes["blog"]}, Crumb{Label: post.Title})}
		if i > 0 {
			page.Newer = s.Posts[i-1]
		}
		if i+1 < len(s.Posts) {
			page.Older = s.Posts[i+1]
		}
		schema, err := json.Marshal(map[string]any{"@context": "https://schema.org", "@type": "BlogPosting", "headline": post.Title, "description": post.Description, "datePublished": post.Date, "author": map[string]string{"@type": "Person", "name": s.Config.Author}, "mainEntityOfPage": s.Absolute(page.Path)})
		if err != nil {
			return err
		}
		// encoding/json escapes HTML-sensitive characters before insertion into this script.
		page.Schema = template.JS(schema)
		s.Pages = append(s.Pages, page)
	}
	s.byPath = map[string]Page{}
	for i := range s.Pages {
		page := &s.Pages[i]
		page.Site = s
		if page.Description == "" {
			page.Description = s.Config.Description
		}
		if _, exists := s.byPath[page.Path]; exists {
			return fmt.Errorf("duplicate route: %s", page.Path)
		}
		s.byPath[page.Path] = *page
	}
	s.NotFound = Page{Site: s, Template: "notfound", Path: "404.html", Title: "Page not found", Description: s.Config.Description}
	return nil
}

func (s *Site) Render(page Page) ([]byte, error) {
	var buffer bytes.Buffer
	if err := s.templates[page.Template].ExecuteTemplate(&buffer, "layout", page); err != nil {
		return nil, fmt.Errorf("render %s: %w", page.Path, err)
	}
	return buffer.Bytes(), nil
}
