# Tamir Schwarts · Photography

Static bilingual (Hebrew / English) portfolio site. No build step.

- `index.html`, `assets/` — the site
- `content/site.json` — all works, texts and general copy
- `photos/` — images (`<id>.jpg` full size, `<id>-s.jpg` small)
- `admin/` — browser interface for adding photos and texts; it commits to this repository through the GitHub API

## Editing content

Open `/admin/` on the published site and connect with a fine-grained personal access token that has
**Contents: Read and write** on this repository only. The token is kept in that browser's local storage.

## Local preview

```bash
python3 -m http.server 8000
```
