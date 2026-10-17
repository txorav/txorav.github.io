package site

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"html"
	"io/fs"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

type rssDocument struct {
	XMLName xml.Name   `xml:"rss"`
	Version string     `xml:"version,attr"`
	Atom    string     `xml:"xmlns:atom,attr"`
	Content string     `xml:"xmlns:content,attr"`
	Channel rssChannel `xml:"channel"`
}
type rssChannel struct {
	Title       string    `xml:"title"`
	Link        string    `xml:"link"`
	Description string    `xml:"description"`
	Language    string    `xml:"language"`
	Copyright   string    `xml:"copyright"`
	Updated     string    `xml:"lastBuildDate"`
	Self        rssLink   `xml:"atom:link"`
	Items       []rssItem `xml:"item"`
}
type rssLink struct {
	Href string `xml:"href,attr"`
	Rel  string `xml:"rel,attr"`
	Type string `xml:"type,attr"`
}
type rssGUID struct {
	Permanent bool   `xml:"isPermaLink,attr"`
	Value     string `xml:",chardata"`
}
type rssContent struct {
	Value string `xml:",cdata"`
}
type rssItem struct {
	Title       string     `xml:"title"`
	Link        string     `xml:"link"`
	GUID        rssGUID    `xml:"guid"`
	Description string     `xml:"description"`
	Date        string     `xml:"pubDate"`
	Categories  []string   `xml:"category"`
	Content     rssContent `xml:"content:encoded"`
}
type sitemap struct {
	XMLName   xml.Name     `xml:"urlset"`
	Namespace string       `xml:"xmlns,attr"`
	URLs      []sitemapURL `xml:"url"`
}
type sitemapURL struct {
	Location string `xml:"loc"`
	Modified string `xml:"lastmod,omitempty"`
}

var linkAttribute = regexp.MustCompile(`(?i)\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')`)

func marshalXML(value any) ([]byte, error) {
	body, err := xml.MarshalIndent(value, "", "  ")
	if err != nil {
		return nil, err
	}
	return append([]byte(xml.Header), append(body, '\n')...), nil
}

func (s *Site) RSS() ([]byte, error) {
	channel := rssChannel{Title: s.Config.Name + " Blog", Link: s.Absolute(routes["blog"]), Description: "Notes on software, design, and automation from " + s.Config.Name + ".", Language: s.Config.Language, Copyright: s.Config.License, Updated: s.now.Format(time.RFC1123Z), Self: rssLink{s.Absolute(routes["rss"]), "self", "application/rss+xml"}}
	for _, post := range s.Posts {
		link := s.Absolute(articlePath(post.Slug))
		base, err := url.Parse(link)
		if err != nil {
			return nil, err
		}
		body := linkAttribute.ReplaceAllStringFunc(string(post.Content), func(attribute string) string {
			parts := linkAttribute.FindStringSubmatch(attribute)
			value := parts[2]
			if value == "" {
				value = parts[3]
			}
			reference, err := url.Parse(html.UnescapeString(value))
			if err != nil || reference.IsAbs() {
				return attribute
			}
			return parts[1] + `="` + html.EscapeString(base.ResolveReference(reference).String()) + `"`
		})
		channel.Items = append(channel.Items, rssItem{Title: post.Title, Link: link, GUID: rssGUID{true, link}, Description: post.Description, Date: post.Published.Format(time.RFC1123Z), Categories: post.Tags, Content: rssContent{body}})
	}
	return marshalXML(rssDocument{Version: "2.0", Atom: "http://www.w3.org/2005/Atom", Content: "http://purl.org/rss/1.0/modules/content/", Channel: channel})
}

func (s *Site) Sitemap() ([]byte, error) {
	result := sitemap{Namespace: "http://www.sitemaps.org/schemas/sitemap/0.9"}
	for _, page := range s.Pages {
		item := sitemapURL{Location: s.Absolute(page.Path)}
		if page.Post != nil {
			item.Modified = page.Post.Date
		}
		result.URLs = append(result.URLs, item)
	}
	return marshalXML(result)
}
func (s *Site) Robots() []byte {
	return []byte("User-agent: *\nAllow: /\nSitemap: " + s.Absolute("sitemap.xml") + "\n")
}

func (s *Site) Build(output string) error {
	if !filepath.IsAbs(output) {
		output = filepath.Join(s.Root, output)
	}
	output = filepath.Clean(output)
	source := filepath.Join(s.Root, "src")
	if output == s.Root || strings.HasPrefix(s.Root, output+string(filepath.Separator)) || output == source || strings.HasPrefix(output, source+string(filepath.Separator)) {
		return fmt.Errorf("output must not overwrite the repository or its source")
	}
	files := map[string][]byte{}
	for _, page := range s.Pages {
		body, err := s.Render(page)
		if err != nil {
			return err
		}
		files[page.Path+"index.html"] = body
	}
	notFound, err := s.Render(s.NotFound)
	if err != nil {
		return err
	}
	files["404.html"] = notFound
	feed, err := s.RSS()
	if err != nil {
		return err
	}
	files[routes["rss"]] = feed
	index, err := s.Sitemap()
	if err != nil {
		return err
	}
	files["sitemap.xml"] = index
	files["robots.txt"], files[".nojekyll"] = s.Robots(), []byte{}
	if cname, err := os.ReadFile(filepath.Join(s.Root, "CNAME")); err == nil {
		files["CNAME"] = cname
	} else if !os.IsNotExist(err) {
		return err
	}
	assets := filepath.Join(s.Root, "src/assets")
	if err := filepath.WalkDir(assets, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("asset symlinks are not published: %s", path)
		}
		if entry.IsDir() {
			return nil
		}
		relative, err := filepath.Rel(assets, path)
		if err != nil {
			return err
		}
		body, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		files["assets/"+filepath.ToSlash(relative)] = body
		return nil
	}); err != nil {
		return err
	}
	manifest := filepath.Join(output, ".generated-files.json")
	var previous []string
	if body, err := os.ReadFile(manifest); err == nil {
		if err := json.Unmarshal(body, &previous); err != nil {
			return fmt.Errorf("invalid generated manifest: %w", err)
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	for _, name := range previous {
		clean := filepath.Clean(filepath.FromSlash(name))
		if name == "" || clean == "." || filepath.IsAbs(clean) || clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) || strings.Contains(name, "\\") {
			return fmt.Errorf("unsafe generated manifest path: %q", name)
		}
	}
	var names []string
	for name, body := range files {
		target := filepath.Join(output, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}
		if err := os.WriteFile(target, body, 0644); err != nil {
			return err
		}
		names = append(names, name)
	}
	// Only remove stale files recorded by a previous build, never unrelated user files.
	for _, name := range previous {
		if _, exists := files[name]; !exists {
			if err := os.Remove(filepath.Join(output, filepath.FromSlash(name))); err != nil && !os.IsNotExist(err) {
				return err
			}
		}
	}
	sort.Strings(names)
	body, err := json.MarshalIndent(names, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(manifest, append(body, '\n'), 0644)
}
