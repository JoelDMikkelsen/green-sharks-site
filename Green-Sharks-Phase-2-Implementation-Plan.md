# Green Sharks Website --- Phase 2 Implementation Plan (All Suggested Upgrades)

Repo baseline: current Green Sharks static site (multi-page,
Netlify-ready). Goal: make the site feel *alive* (active, credible,
authoritative) with minimal complexity.

------------------------------------------------------------------------

## 0) Preferred Workflow: One Upfront Asset + Data Drop

### 0.1 Create/confirm these folders

Ensure these directories exist (create if missing):

-   /assets/images/og/
-   /assets/images/how-to/
-   /assets/images/servers/ (optional: server/game icons)
-   /data/

------------------------------------------------------------------------

### 0.2 Drop these files in one go (your "asset bundle")

You (or an agent) should source/create and place:

#### Social share images (OG / Twitter)

Place into: /assets/images/og/

-   og-default.jpg (1200x630)
-   og-home.jpg (1200x630) --- optional but ideal
-   og-operations.jpg (1200x630) --- optional
-   og-media.jpg (1200x630) --- optional
-   og-gallery.jpg (1200x630) --- optional

If you only want ONE image: use og-default.jpg and reference it on all
pages.

------------------------------------------------------------------------

#### How-to-join screenshots (from Discord guide)

Place into: /assets/images/how-to/

Recommended minimum set: - direct-connect-01.jpg (Launcher "Direct
Connect" screen) - direct-connect-02.jpg (Typing IP:PORT) -
recent-tab-01.jpg (Recent tab showing server) - mods-required-01.jpg
(Required mods screen) - mods-optional-01.jpg (Optional/unsupported mods
screen) - import-preset-01.jpg (Import preset in mods tab)

Prioritize: direct connect + required mods + import preset.

------------------------------------------------------------------------

#### Data files (drive the site from JSON)

Place into: /data/

-   servers.json
-   operations.json
-   community.json
-   partners.json (optional)
-   faq.json (optional)

------------------------------------------------------------------------

## 1) Data Definitions (Templates)

### 1.1 /data/servers.json

{ "updated": "2026-02-28", "clusters": \[ { "label": "AU Cluster ---
Arma 3", "region": "AU", "items": \[ { "name": "GREEN SHARKS \| VIETNAM
MIKE FORCE \| CAS & S.O.G. Nickel Steel", "game": "Arma 3", "mode":
"Vietnam Mike Force", "typeBadge": "PvE", "ip": "139.99.160.201",
"port": "2487", "battlemetricsUrl": "" }, { "name": "Vietnam Mike Force
\| Joint Operations --- GS & TFS \| CAS", "game": "Arma 3", "mode":
"Joint Operations", "typeBadge": "Joint Ops", "ip": "162.220.13.77",
"port": "2302", "battlemetricsUrl": "" }, { "name": "GREEN SHARKS \| WW2
MIKE FORCE \| SPEARHEAD 1944", "game": "Arma 3", "mode": "PvE WW2",
"typeBadge": "PvE", "ip": "67.211.208.155", "port": "2487",
"battlemetricsUrl": "" } \] } \] }

------------------------------------------------------------------------

### 1.2 /data/operations.json

{ "updated": "2026-02-28", "nextOperation": { "title": "Zeus Op / Mike
Force Night", "game": "Arma 3", "server": "AU Vietnam Mike Force",
"region": "AU", "startUtc": "2026-03-07T09:00:00Z", "durationMinutes":
150, "brief": "New player-friendly run. RTO + CAS doctrine in effect.",
"joinUrl": "https://discord.gg/YOUR_INVITE" } }

------------------------------------------------------------------------

### 1.3 /data/community.json

{ "updated": "2026-02-28", "founded": "2023", "clusters": "AU + US",
"modes": 4, "costToJoin": "\$0", "headlineStats": \[ { "label":
"Members", "value": "238+" }, { "label": "Online", "value": "69" } \] }

------------------------------------------------------------------------

## 2) Website Changes

-   Render server cards dynamically from servers.json
-   Add Next Operation panel to home + operations page
-   Add timezone conversion block
-   Add BattleMetrics buttons per server
-   Add OG meta tags to all pages
-   Add canonical tags
-   Add robots.txt and sitemap.xml
-   Optionally enable Discord live widget

------------------------------------------------------------------------

## 3) Required From You

1)  Discord invite URL
2)  Confirm US cluster servers
3)  Confirm next operation info
4)  Confirm stats to display
5)  Provide screenshots (or placeholders)

------------------------------------------------------------------------

END OF IMPLEMENTATION PLAN
