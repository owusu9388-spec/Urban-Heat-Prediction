# UrbanHeat Accra â Phase 2: UI/UX Architecture & Google Stitch Design Package

**Traces to:** Section 4 (FR1âFR7), Section 5.3 (UC1âUC5), Section 8.6 (UI Wireframe), Section 8.7 (Tech Stack) of `Project_Documentation.md`

---

## 1. Design Principles (derived from NFR2, NFR7)

| Principle | Why | Applied As |
|---|---|---|
| Non-technical clarity | NFR2 â usable by a planner with no ML background | Plain-language labels ("High risk" not "Class 2"), no raw model internals shown by default |
| Explainability-first | NFR7 â every prediction needs a human-readable reason | Every score is *never* shown without its top-3 driving factors visible alongside it |
| Low cognitive load | Solo 48h build, MVP scope | One primary action per screen; map + detail panel pattern (not a dozen menus) |
| Comparative framing | Core value prop is "what if" | Before/after is always shown side-by-side, never as a silent overwrite |

**Visual direction reference:** the Firecheck dashboard you shared is a good tonal match â light neutral background, a single accent colour reserved for primary actions/status, rounded cards, a fixed left sidebar, KPI cards up top, and a data table below. UrbanHeat Accra should follow the same skeleton, with the accent colour swapped to a heat-appropriate palette (see Â§5).

---

## 2. Information Architecture (Sitemap)

```
UrbanHeat Accra
âââ Map Dashboard (Home)                 â FR1, FR2, FR7 | UC1, UC2
â   âââ Location Detail Panel (drawer)   â FR2, FR3        | UC2, UC3
â   â   âââ Mitigation Simulator (tab)   â FR4              | UC4
âââ Data Explorer                        â FR6              | UC5
âââ API Status / About (footer link)     â NFR1, NFR8
```

Only **2 primary destinations** (Map Dashboard, Data Explorer) â deliberately flat, matching the 48-hour MVP scope. No auth, no settings, no admin shell (FR9 descoped).

---

## 3. User Flows

Each flow below is written for web/desktop first, with a ð± **Mobile** callout showing where the pattern changes at <600px â not just shrinks. Full breakpoint-by-breakpoint detail (including tablet) is in Â§6.

### Flow A â View risk map & drill into a location (UC1 â UC2 â UC3)
```
Land on Map Dashboard
   â Map renders all locations as colour-coded pins (green/amber/red)
   â User clicks a pin  OR  types a location into the search box
   â Detail panel slides in from the right
       â Shows: location name, Heat Risk Score (0-100, large number),
                 category badge, top-3 contributing factors as a horizontal bar chart
   â [End state: user understands *why* this location is risky]
```
ð± **Mobile (<600px):** same trigger (tap pin or type in search), but the panel does not slide in from the right â a **bottom sheet** rises from the bottom edge to ~70% viewport height, drag handle at top-center, swipe-down to dismiss. Rationale: a 380px side drawer would occlude the entire map on a 375px-wide screen; the sheet keeps the map/pin visible above it for spatial context. Search collapses to an icon in the top bar that expands to a full-width field on tap, rather than sitting persistently in the top bar as on web.

### Flow B â Filter the map (UC1, FR7)
```
Map Dashboard
   â User opens "Filter by risk" dropdown/segmented control (Low / Moderate / High / All)
   â Map pins re-render to matching subset; count badge updates ("18 of 42 shown")
```
ð± **Mobile (<600px):** the segmented control doesn't fit the narrow top bar at a usable tap-target size, so it collapses to a single **filter icon button**; tapping it opens a small action sheet with the same 4 options (radio-style selection). Same underlying re-render and count-badge behaviour once a filter is chosen.

### Flow C â Run a mitigation simulation (UC4 â the signature feature)
```
Detail panel open on a location
   â User switches to "Simulate" tab within the same panel (no navigation away)
   â Two buttons: "+10% vegetation"  |  "+20% vegetation"  (custom slider optional if time permits)
   â User clicks +10%
       â Loading state on the score number only (~<1s per NFR1)
       â Panel now shows BEFORE/AFTER side-by-side:
            Before: 78  (High)      After: 64  (Moderate)     Î -14
       â Factor bar chart updates to reflect the new NDVI-driven contribution
       â A small caption: "Simulation uses a simplified NDVI adjustment â indicative, not a physical model"
         (honesty per Section 16 limitations â build trust, avoid overclaiming)
   â User can click "Reset" to return to the original score, or try +20%
```
ð± **Mobile (<600px):** this flow runs inside the bottom sheet from Flow A rather than the side drawer, and two layout changes follow from the narrower width:
- The two preset buttons stack **full-width, one above the other** instead of sitting side by side â keeps them thumb-reachable near the bottom of the sheet and comfortably â¥44px tall.
- The before/after comparison stacks vertically ("Before" number, then a centered delta badge, then "After" number) instead of two large numbers side by side â two large numbers in a ~340px-wide column would crowd and shrink unreadably.
Everything else (loading state on the score only, the "indicative, not physical model" caption, Reset) behaves identically to web.

### Flow D â Inspect underlying data (UC5, FR6, Should-priority)
```
Nav â Data Explorer
   â Read-only table: all locations + their raw features (lst, ndvi, ndbi, densities, score)
   â Sortable columns, simple text search
   â No edit capability (matches FR9 being out of scope)
```
ð± **Mobile (<600px):** the 9-column table is replaced with a **card-list view** â one card per location, showing name, coloured risk-category dot, and score as a large number â rather than a horizontally-scrolled table, which degrades badly below ~5 visible columns. Search stays as a persistent field above the list. Tapping a card opens the same detail bottom sheet as Flow A (not a separate screen), keeping the drill-down pattern consistent across entry points.

---

## 4. Screen-by-Screen Wireframe Specs

### Screen 1 â Map Dashboard (Home)
**Layout:** Fixed left sidebar (nav, minimal: Map / Data / About) Â· Top bar (title, search box, filter control) Â· Full-bleed map fills remaining space Â· Detail panel is an overlay drawer from the right (~380px), not a permanent split, so the map stays large on smaller screens.

**Components:**
- KPI strip above the map (optional, Should-priority): "Locations analysed: 42" Â· "High risk: 9" Â· "Avg. risk score: 54"
- Map: Leaflet.js, pins colour-coded green (<40) / amber (40â69) / red (â¥70)
- Filter control: segmented buttons (All / Low / Moderate / High)
- Search box: type-ahead by location name

### Screen 2 â Location Detail Panel (drawer, on top of Screen 1)
**Tabs within panel:** `Overview` | `Simulate`

**Overview tab:**
- Location name + coordinates (small, muted)
- Large Heat Risk Score (0â100) with coloured category badge
- Horizontal bar chart: top 3 contributing factors, ranked, with signed contribution (e.g. "Low vegetation cover +18", "High built-up density +12", "Elevated LST +9")
- Plain-language one-line summary generated from the top factor (e.g. "Risk is driven mainly by low vegetation cover in this area.")

**Simulate tab:**
- Two preset buttons (+10% / +20% vegetation)
- Before/after score comparison (two large numbers + delta, colour-coded green for improvement)
- Updated factor bar chart
- Disclaimer caption (see Flow C)
- "Reset simulation" text link

### Screen 3 â Data Explorer
- Simple table, sticky header, sortable columns matching Section 8.5 schema (id, name, lat/lon, lst, ndvi, ndbi, densities, score)
- Search input filtering by name
- No pagination needed at 150â300 rows if using virtual scroll; otherwise simple pagination

### Screen 4 â Empty/Loading/Error states (often skipped, but graders notice)
- Map loading: skeleton pins or spinner over map area
- API error (e.g. `/predict` fails): inline toast â "Couldn't reach the prediction service. Retry." â never a blank crash, per NFR6
- No search results: "No locations match [query]"

---

## 5. Visual System (for consistency, and to paste into Stitch's style controls)

| Token | Value | Notes |
|---|---|---|
| Background | Warm off-white `#F7F5F1` | Matches the calm, non-alarmist tone needed for a public-sector tool |
| Primary accent | Deep amber/terracotta `#D9622B` | Used for primary buttons and the "High risk" marker â heat-appropriate, not garish red |
| Risk: Low | `#2FA96C` (green) | |
| Risk: Moderate | `#E0A030` (amber) | |
| Risk: High | `#C4432B` (red-terracotta) | |
| Text primary | `#1F1B16` | |
| Card surface | White, 12â16px radius, soft shadow | Mirrors the Firecheck card style |
| Font | Inter or system-ui, 14â16px body, 28â32px score display | Legible, non-technical, no display/serif fonts |

---

## 6. Responsive Behaviour â Web vs Mobile

Same information architecture and flows across breakpoints; the *pattern* changes, not the content. (See the ð± callouts inline in Â§3 for how this plays out step-by-step within each flow.)

| Element | Web (â¥1024px) | Tablet (600â1023px) | Mobile (<600px) |
|---|---|---|---|
| Navigation | Fixed left sidebar, icon + label | Collapsed sidebar (icons only, expand on tap) | Bottom tab bar, 3 items: Map / Data / About |
| Map | Fills remaining space beside sidebar | Full width, nav collapses on top | Full width, full height minus bottom bar |
| Location detail | Right-side overlay drawer, ~380px, map stays visible behind it | Right-side drawer, ~340px, slightly narrower | **Bottom sheet**, slides up from bottom, ~70% viewport height, swipeable to dismiss â not a side drawer (no room) |
| Simulate tab controls | Two buttons side by side | Two buttons side by side | Two buttons stacked full-width, thumb-reachable near the bottom of the sheet |
| Before/after comparison | Two numbers side by side with a horizontal delta badge between them | Same as web | Stacked: "Before" above "After", delta badge centered below both â avoids cramming two large numbers into a narrow column |
| Filter control | Segmented control in top bar | Segmented control in top bar | Filter icon button opens a small action sheet with the same 4 options |
| Search | Persistent search box in top bar | Persistent search box in top bar | Search icon in top bar, expands to full-width input on tap |
| Data explorer table | Full table, all columns visible | Horizontal scroll on table | Card-list view instead of a table â one card per location showing name, score, and category; tap opens detail sheet (a raw 9-column table is unusable at 375px width) |
| KPI strip | 3 cards in a row above the map | 3 cards in a row, smaller | Horizontally scrollable card row (swipe), or collapse to a single "42 locations Â· 9 high risk" summary line |

**Key mobile-specific decisions worth flagging in your report** (good for demonstrating design reasoning, not just visuals):
- The detail panel changes pattern (drawer â bottom sheet) rather than just shrinking, because a 380px-wide drawer would cover the entire mobile map underneath it â a sheet preserves context.
- The Data Explorer table becomes cards on mobile because tables don't degrade gracefully below ~5 visible columns; this is a deliberate content-pattern change, not just a CSS breakpoint.
- Touch targets on mobile (simulate buttons, filter chips) should be â¥44px tall per standard mobile accessibility guidance.

---

## 7. Google Stitch Prompts (paste each directly into Stitch)

**Prompt â Screen 1 (Map Dashboard):**
> "Design a clean, light-themed web dashboard for an urban heat-risk monitoring tool called 'UrbanHeat Accra'. Layout: fixed left sidebar with icon+label nav items (Map, Data, About) and a logo at top. Top bar with a page title 'Heat Risk Map', a search input, and a segmented filter control (All / Low / Moderate / High). Main area is a full-width map of a city with circular pins colour-coded green, amber, and terracotta-red for risk levels, and a small floating legend bottom-left. Include a KPI row above the map with 3 small stat cards: 'Locations analysed', 'High risk count', 'Average risk score'. Warm off-white background (#F7F5F1), terracotta accent (#D9622B), white rounded cards with soft shadows, Inter font. Minimal, calm, public-sector tool aesthetic â not alarmist."

**Prompt â Screen 2 (Detail Drawer, Overview tab):**
> "Design a right-side slide-in detail panel (380px wide) for a heat-risk dashboard, overlaying a map. Panel shows: location name and coordinates at top; a large risk score number (e.g. '78') with a coloured category pill badge ('High Risk') beside it; below, a horizontal bar chart titled 'Top contributing factors' with 3 bars labelled 'Low vegetation cover', 'High built-up density', 'Elevated surface temperature', each with a numeric contribution value; a one-line plain-language summary sentence at the bottom; two tabs at the top of the panel labelled 'Overview' and 'Simulate', Overview active. Same warm off-white/terracotta palette as the main dashboard, rounded white card sections."

**Prompt â Screen 2 (Simulate tab):**
> "Design the 'Simulate' tab of the same right-side detail panel. Show two pill buttons: '+10% vegetation' and '+20% vegetation'. Below, a before/after comparison: two large numbers side by side labelled 'Before' and 'After' with a small down-arrow delta badge in green between them (e.g. '78 â 64, -14'). Below that, an updated horizontal bar chart. At the bottom, small muted italic caption text: 'Simulated using a simplified vegetation model â indicative only.' Include a 'Reset simulation' text link. Same palette as before."

**Prompt â Screen 3 (Data Explorer):**
> "Design a data table page for a dashboard, titled 'Location Dataset'. Sticky table header with sortable column icons, columns: Name, Latitude, Longitude, LST (Â°C), NDVI, NDBI, Building Density, Population Density, Heat Risk Score (score column has small coloured dot indicators matching risk level). Search input above the table. Same left sidebar and warm off-white/terracotta palette as the main dashboard, clean minimal rows with subtle dividers, no heavy borders."

**Prompt â Empty/Error state:**
> "Design a small inline toast/banner component for a dashboard error state, warm off-white background, terracotta left border accent, icon + text: 'Couldn't reach the prediction service. Retry.' with a small 'Retry' text button, rounded corners, soft shadow, sits top-right of the screen."

### Mobile variants (generate these alongside the web screens above, same palette)

**Prompt â Mobile Screen 1 (Map Dashboard, 375px width):**
> "Design a mobile app screen (375px wide, iOS-style) for a heat-risk monitoring tool. Top bar: app title 'UrbanHeat Accra' and a search icon. Below it, a horizontally scrollable row of 3 small KPI chips: 'Locations 42', 'High risk 9', 'Avg score 54'. Below that, a filter icon button (opens options). Main area: a full-width, full-height map with colour-coded pins (green/amber/red) filling the rest of the screen. Bottom: a fixed tab bar with 3 icons and labels â Map, Data, About â Map active. Warm off-white background, terracotta accent, rounded elements, Inter font, native mobile feel."

**Prompt â Mobile Screen 2 (Location detail as a bottom sheet):**
> "Design a mobile bottom sheet component (375px wide) sliding up over a map, covering about 70% of screen height, rounded top corners, drag handle at top center. Content: location name and coordinates, a large risk score number with a coloured category pill badge, a horizontal bar chart titled 'Top contributing factors' with 3 labelled bars, a one-line plain-language summary sentence, and two tab buttons at the top of the sheet content: 'Overview' (active) and 'Simulate'. Warm off-white background, terracotta accent, soft shadow above the sheet, Inter font."

**Prompt â Mobile Screen 2 (Simulate tab, mobile):**
> "Design the 'Simulate' tab content of the same mobile bottom sheet. Two full-width stacked pill buttons: '+10% vegetation' and '+20% vegetation', comfortably tall for thumb tapping. Below, a stacked before/after comparison: 'Before' label with a large number, then a small centered green down-arrow delta badge ('-14'), then 'After' label with a large number underneath. Below that, an updated horizontal bar chart. Small muted italic caption at the bottom: 'Simulated using a simplified vegetation model â indicative only.' 'Reset simulation' text link at the very bottom. Same warm off-white/terracotta palette."

**Prompt â Mobile Screen 3 (Data Explorer as cards):**
> "Design a mobile screen (375px wide) titled 'Location Dataset' with a search bar at top. Below, a vertically scrolling list of cards, one per location: each card shows the location name in bold, a small coloured dot + risk category label, and the heat risk score as a large number on the right side of the card. Cards have generous padding, rounded corners, subtle dividers between them, tapping a card would open the detail bottom sheet. Warm off-white background, terracotta accents on the score numbers, Inter font, bottom tab bar with Map/Data/About, Data active."

**Note on using these in Stitch:** generate the web set first to lock the visual system (colours, type, card style), then generate the mobile set in the same Stitch project/session so it inherits the same design tokens rather than drifting to a different look.

---

## 8. Requirements Traceability Check

| Requirement | Covered by |
|---|---|
| FR1 (map, colour-coded) | Screen 1 |
| FR2 (query/select location + score) | Screen 1 â Screen 2 Overview |
| FR3 (top contributing factors) | Screen 2 Overview |
| FR4 (vegetation what-if simulation) | Screen 2 Simulate tab, Flow C |
| FR5 (REST API) | Not a UI concern â backend, unaffected by this package |
| FR6 (admin/data view) | Screen 3 |
| FR7 (filter map by category) | Screen 1 filter control, Flow B |
| NFR1 (<1s prediction) | Loading state limited to score number only, not full panel reload |
| NFR2 (usable by non-technical planner) | Â§1 design principles, plain-language summary line |
| NFR7 (explainability) | Factor bar chart always co-located with the score, never shown separately |

---

## 9. Next Step Options

1. I can build a **working HTML/CSS/JS interactive prototype** of Screen 1 + the detail drawer right now in this chat (clickable pins, simulated before/after), so you have a real artifact to demo or screenshot into the report â not just a spec.
2. Or, take the Stitch prompts above straight into Stitch for polished visual mockups, then come back and I'll help you translate those into the actual FastAPI + Leaflet.js frontend code from Section 9.
