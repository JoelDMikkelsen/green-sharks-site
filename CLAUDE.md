# Green Sharks Website Agent Brief (Repo Instructions)

You are an AI coding agent working inside the Green Sharks static website repo.

## Project Goal
Evolve the site from "static but polished" to "alive and authoritative" without introducing heavy frameworks or backend complexity.

This repo is a static multi-page site (Netlify-ready). Prefer simple HTML/CSS/vanilla JS and data-driven rendering from JSON files in /data.

## Non-Negotiables
- Keep it static-first (no React/Next/etc).
- Keep changes minimal, surgical, and easy to review.
- Avoid over-engineering. Prefer small, composable functions.
- No build step required.
- Maintain existing design system in /assets/css/main.css.
- No breaking of existing pages: index.html, operations.html, media.html, gallery.html.

## Current Architecture (assumed)
- HTML pages in repo root
- /assets/css/main.css
- /assets/js/*.js
- /data/*.json (to be added/used)

## Phase 2 Deliverables (do these in order)
1) Add JSON data files:
   - /data/servers.json
   - /data/operations.json
   - /data/community.json
   - (optional) /data/partners.json, /data/faq.json

2) Render Servers section from /data/servers.json
   - Replace hard-coded server cards with a container + JS renderer.
   - Each card supports optional BattleMetrics link.
   - Include region + game badges.

3) Add “Alive” panels:
   - Home page: Next Operation + Live Stats
   - Operations page: Next Operation + Timezone conversion block
   - Use Intl.DateTimeFormat for timezone conversion from operations.json startUtc
   - Graceful fallback if startUtc missing or marked TBA.

4) Add SEO/Trust layer across ALL pages:
   - OG + Twitter meta tags
   - canonical tags
   - add /robots.txt and /sitemap.xml

5) Optional Phase 2.5:
   - Discord widget JSON fetch if enabled (fallback to community.json if it fails)

## Implementation Rules
- Always inspect existing code before changing patterns.
- Keep new JS in /assets/js/ (e.g. /assets/js/data.js or /assets/js/servers.js).
- Avoid inline scripts unless the repo already uses them.
- Keep IDs/classes consistent with existing CSS. Prefer adding small new CSS blocks rather than rewriting.
- When creating new HTML containers, add clear comments.

## Working Style
- Make one small change per commit chunk.
- After edits, sanity-check:
  - page loads without console errors
  - JSON fetch works via local static server (CORS note)
  - mobile nav still works

## What to Ask the Human (only if required)
- Discord invite URL (final)
- US server list (names + ip/port + BattleMetrics)
- Next operation info if unknown

Otherwise, proceed with placeholders that do not break layout.
