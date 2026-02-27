# Green Sharks Website

Tactical PvE Operations. AU & US. No Fees.

Static site for the Green Sharks Arma community. Ready for **Netlify**: connect the repo and deploy with no build step.

## Structure

```
├── index.html          # Home + Servers, Join, Mods, Rules, Community, Partners, FAQ (single-page)
├── operations.html     # Operations page (AU & US sections, doctrine)
├── gallery.html        # Screenshot gallery
├── media.html          # YouTube feed + submit link (preview in-page, copy for Discord)
├── assets/
│   ├── css/main.css    # Shared styles
│   └── js/
│       ├── main.js     # Nav, FAQ, mods tabs
│       └── media.js    # YouTube URL parsing, embed, feed from data/videos.json
├── data/
│   └── videos.json     # Curated video IDs for the media feed (edit to add)
├── netlify.toml        # Publish current directory
├── .env.example        # Template for API keys (copy to .env if needed)
└── .gitignore
```

## Mods

Mod links on the site point to **Steam Workshop** (subscribe pages). Required and optional lists are in **Mods & Setup** on the home page and match `Green Shark mods.md`.

## Media / YouTube

- **Feed**: Edit `data/videos.json` and add `{ "id": "VIDEO_ID", "title": "Title" }` entries. Video ID is taken from any normal YouTube URL.
- **Submit**: Players paste a YouTube link on the Media page → “Preview in-page” shows the embed without leaving the site; “Copy link for Discord” copies the URL to submit in Discord. No LLM needed for normal URLs; parsing is client-side. Optional: use an LLM or serverless function later for messy pastes (see `.env.example` for API key placeholders).

## Deploy (Netlify)

1. Push to GitHub/GitLab and connect the repo in Netlify.
2. Build settings: **Publish directory** = `.` (or leave default); no build command required.
3. Optional: add env vars in Netlify (e.g. for future serverless/LLM) — same names as in `.env.example`.

## Local

Open `index.html` in a browser or run a static server (e.g. `npx serve .`). For the media feed, `data/videos.json` is loaded via `fetch`, so use a local server to avoid CORS when testing.
