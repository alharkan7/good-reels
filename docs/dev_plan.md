# Good Reels — Implementation Plan

> **Instagram Reels-style UI for exploring random, feel-good Wikipedia articles in Bahasa Indonesia.**

### Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | All lib, API routes, and types implemented |
| Phase 2: Core UI | ✅ Complete | Scroll-snap feed, Ken Burns, CSS filters, ReelCard |
| Phase 3: Interactions | ✅ Complete | Like, bookmark, share, AI chat (merged into comment button) |
| Phase 4: Prefetching & Polish | ✅ Complete | 100 preloaded articles, prefetch buffer, fallback music |
| Phase 5: Polish & Assets | ✅ Complete | Inline SVG icons, animations, expandable captions |
| Phase 6: Network Exploration | ✅ Complete | Changed from 3D to 2D graph; node labels scale with zoom |
| Phase 7: AI Q&A Chat | ✅ Complete | Full article context, Google Search grounding, markdown rendering |

### Deviations from Original Plan

| Original Plan | Actual Implementation | Reason |
|---------------|----------------------|--------|
| Gemini `gemini-2.0-flash-lite` | Gemini `gemini-2.5-flash` | Original model deprecated |
| Content moderation via Gemini | Skipped entirely | Faster loading; Wikipedia content is generally safe |
| 3D force-directed graph (`react-force-graph-3d`) | 2D graph (`react-force-graph-2d`) | Better label readability, simpler interaction |
| Separate AI sparkle button (✨) | AI chat merged into comment button with "AI" label | Cleaner UI, fewer buttons |
| Separate comment sheet + AI chat sheet | AI chat sheet only (replaces comment sheet) | Unified interaction |
| Full-resolution images | Thumbnail images | Faster loading |
| Music loaded from API before content | Bundled fallback tracks + async API fetch | Instant music availability |
| Mute button in action bar | Mute via tappable music chip at bottom | More intuitive UX |
| Fixed 50vh chat sheet | 78vh chat sheet | More conversation space |
| 100 preloaded articles | ✅ Added (not in original plan) | Instant first load, zero loading spinner |
| `CommentSheet` component | Removed (AI chat replaces it) | Simplified interaction model |
| `ReelOverlay` component | Inlined into `ReelCard` | Simpler component tree |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Data Layer — Wikipedia API](#5-data-layer--wikipedia-api)
6. [Content Moderation — Gemini API](#6-content-moderation--gemini-api)
7. [Background Music — Jamendo API](#7-background-music--jamendo-api)
8. [Core UI — Reels-style Vertical Feed](#8-core-ui--reels-style-vertical-feed)
9. [Ken Burns Image Motion & CSS Filters](#9-ken-burns-image-motion--css-filters)
10. [Variety Engine — No Two Adjacent Reels Feel the Same](#10-variety-engine--no-two-adjacent-reels-feel-the-same)
11. [3D Network Exploration Mode](#11-3d-network-exploration-mode)
12. [AI Q&A Chat — Ask About the Article](#12-ai-qa-chat--ask-about-the-article)
13. [Interaction Layer — Engagement Features](#13-interaction-layer--engagement-features)
14. [Pull-to-Refresh](#14-pull-to-refresh)
15. [Local Storage Persistence](#15-local-storage-persistence)
16. [Performance & Prefetching Strategy](#16-performance--prefetching-strategy)
17. [Vercel Deployment & Optimization](#17-vercel-deployment--optimization)
18. [File-by-File Implementation Checklist](#18-file-by-file-implementation-checklist)
19. [Design System & Visual Specs](#19-design-system--visual-specs)
20. [Edge Cases & Error Handling](#20-edge-cases--error-handling)
21. [API Keys Required](#21-api-keys-required)

---

## 1. Product Overview

### What it does

- Displays random Wikipedia articles (Bahasa Indonesia only) in a full-screen, vertically-scrollable feed — visually mimicking Instagram Reels / TikTok.
- Each "reel" shows the article's **main image** (full-bleed background), the **title**, and a short **text summary** overlay at the bottom.
- Each reel has a **Ken Burns / panning motion effect** on the background image and a **random CSS filter** (warm tone, cool tone, etc.) — making every reel feel visually unique.
- **Background music** plays on each reel — chill, good-vibes tracks streamed from Jamendo (free Creative Commons music). Each reel gets a different track.
- Users can **swipe/scroll down** endlessly for new content, or **scroll up** to revisit previous articles.
- A chip/button links out to the full Wikipedia article.
- Users can **like**, **bookmark**, **share**, and **comment** — all stored in **localStorage** (no auth, no database).
- Content is **filtered for positive/neutral vibes** using Gemini API before being shown to the user.
- At the very top (first reel), **pulling down** triggers a **pull-to-refresh** with a sticky elastic effect.
- A **variety engine** ensures no two adjacent reels share the same music, motion, or filter combination.
- A **layout toggle** at the top switches to a **3D network exploration mode** — visualizing the current article's Wikipedia hyperlinks as an interactive force-directed graph. Tapping a node opens that article as a reel.
- An **AI Q&A button** (✨) in the action bar opens a half-screen chat sheet where users can ask questions about the current article. Gemini answers with the article's full content pre-loaded as context. Each article gets its own chat session.

### Prototype Constraints

| Concern | Decision |
|---|---|
| Auth | None — anonymous usage |
| Database | None — browser localStorage only |
| Content source | Wikipedia Bahasa Indonesia REST API |
| Content filter | ~~Gemini `gemini-2.0-flash-lite`~~ → Skipped (direct Wikipedia fetch) |
| Background music | Jamendo API (Creative Commons, free `client_id`) |
| Deployment target | Vercel (optimized for Edge) |

---

## 2. Tech Stack & Dependencies

### Existing Boilerplate (already in repo)

- **Next.js 16.1.6** (App Router, React 19)
- **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)

### New Dependencies to Install

```bash
npm install @google/genai react-force-graph-3d three @types/three
```

| Package | Purpose |
|---------|---------|
| `@google/genai` | Official Google Generative AI SDK. Used for Gemini content moderation (TRUE/FALSE classification). |
| `react-force-graph-3d` | 3D force-directed graph visualization (wraps three.js). Powers the Network Exploration Mode. |
| `three` | 3D rendering engine — peer dependency of `react-force-graph-3d`. |
| `@types/three` | TypeScript types for three.js (dev dependency). |

> **Note:** Beyond the graph visualization, we keep dependencies minimal. CSS Scroll Snap + Intersection Observer + native touch events + CSS animations + CSS filters are sufficient for the Reels experience. Jamendo tracks stream via native `<audio>` elements.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Reels Feed  │  │   Content    │  │       localStorage         │ │
│  │  (CSS Scroll │  │   Buffer     │  │ (likes, bookmarks,         │ │
│  │   Snap)      │  │  (React      │  │  comments)                 │ │
│  │              │  │   State)     │  │                            │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────────┘ │
│         │                 │                                         │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌────────────────────────────┐ │
│  │ Intersection │  │ Pull-to-     │  │  Audio Manager             │ │
│  │ Observer     │  │ Refresh      │  │  (play/pause per reel,     │ │
│  │ (prefetch)   │  │ (touch)      │  │   crossfade on scroll)     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────────┘ │
│         │                 │                        │                │
│  ┌──────┴─────────────────┴────────────────────────┴──────────────┐ │
│  │  Variety Engine (assigns motion, filter, track per reel)      │ │
│  └───────────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (Vercel Edge)                       │
│                                                                     │
│  GET /api/articles?count=5          GET /api/tracks?count=10        │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐ │
│  │ Wikipedia Client  │─▶│ Gemini Moderator │  │ Jamendo Client    │ │
│  │ (fetch random    │  │ (TRUE/FALSE      │  │ (fetch chill      │ │
│  │  articles)       │  │  classification) │  │  music tracks)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌───────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ id.wikipedia.org  │ │ Gemini API          │ │ api.jamendo.com     │
│ REST API v1       │ │ gemini-2.0-flash-   │ │ v3.0 (Creative      │
│                   │ │ lite                │ │ Commons music)      │
└───────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### Key Design Decisions

1. **Server-side filtering**: Wikipedia fetch + Gemini moderation happens on the server (Next.js Route Handler) to protect the `GEMINI_API_KEY` and avoid CORS issues.
2. **Batch endpoint**: The API route returns multiple articles per request (`/api/articles?count=5`) so the client gets a batch to fill the buffer.
3. **Music endpoint**: A separate `/api/tracks` route fetches chill music from Jamendo, protecting the `JAMENDO_CLIENT_ID` server-side. Tracks are cached and rotated.
4. **Content buffer**: The client maintains a buffer of ~5 articles ahead of the current view to ensure buttery-smooth scrolling.
5. **CSS Scroll Snap**: Native browser scroll-snap for the "reel" snapping behavior — no JS animation library needed, best performance.
6. **CSS-only visual effects**: Ken Burns motion + image filters are pure CSS animations — zero JS overhead, GPU-accelerated.
7. **Variety engine**: Client-side algorithm ensures no two adjacent reels share the same motion preset, filter preset, or music track.
8. **3D network mode**: A separate `/api/links` route parses a full Wikipedia article and returns all internal hyperlinks, powering the interactive 3D graph view.
9. **AI Q&A chat**: A streaming `/api/chat` route sends the article's full extract as system context to Gemini, then streams the LLM response back to the client. Each article gets its own ephemeral chat session.
10. **Edge Runtime**: Lightweight routes (`/api/tracks`, `/api/links`) use Edge Runtime for low-latency.

---

## 4. Project Structure

```
good-reels/
├── app/
│   ├── api/
│   │   ├── articles/
│   │   │   └── route.ts              # GET /api/articles — fetch + filter articles
│   │   ├── tracks/
│   │   │   └── route.ts              # GET /api/tracks — fetch chill music from Jamendo
│   │   ├── links/
│   │   │   └── route.ts              # GET /api/links?title=... — extract article hyperlinks
│   │   └── chat/
│   │       └── route.ts              # POST /api/chat — streaming AI Q&A about current article
│   ├── components/
│   │   ├── ReelsFeed.tsx             # Main feed container (scroll-snap host)
│   │   ├── ReelCard.tsx              # Individual reel (full-screen article card)
│   │   ├── ReelOverlay.tsx           # Bottom overlay: title, summary, wiki chip
│   │   ├── ActionBar.tsx             # Right sidebar: like, comment, bookmark, share, AI chat
│   │   ├── CommentSheet.tsx          # Bottom sheet for comments
│   │   ├── AIChatSheet.tsx           # Bottom sheet for AI Q&A conversation
│   │   ├── PullToRefresh.tsx         # Pull-to-refresh indicator & logic
│   │   ├── MusicIndicator.tsx        # Spinning disc + track name (bottom-right)
│   │   ├── LoadingReel.tsx           # Skeleton/placeholder during load
│   │   ├── LayoutToggle.tsx          # Top toggle switch: Reels ↔ Network mode
│   │   ├── NetworkView.tsx           # 3D force-directed graph (react-force-graph-3d)
│   │   └── NetworkLoader.tsx         # Loading animation while graph data is being fetched
│   ├── hooks/
│   │   ├── useArticleBuffer.ts       # Buffer management + prefetching logic
│   │   ├── useBackgroundMusic.ts     # Audio playback, crossfade, mute toggle
│   │   ├── useNetworkGraph.ts        # Fetch links, build graph data, manage graph state
│   │   ├── useAIChat.ts              # Manage chat sessions, stream responses, per-article state
│   │   ├── useLocalInteractions.ts   # localStorage read/write for likes etc.
│   │   └── usePullToRefresh.ts       # Touch gesture handling for pull-to-refresh
│   ├── lib/
│   │   ├── wikipedia.ts              # Wikipedia API client functions
│   │   ├── gemini.ts                 # Gemini moderation + AI chat client
│   │   ├── jamendo.ts                # Jamendo music API client
│   │   ├── variety.ts                # Variety engine: assign motion, filter, music
│   │   └── types.ts                  # Shared TypeScript interfaces
│   ├── globals.css                   # Global styles + Tailwind + scroll-snap + Ken Burns keyframes
│   ├── layout.tsx                    # Root layout (viewport meta, fonts)
│   └── page.tsx                      # Main page — manages layout mode + renders feed or network
├── public/
│   └── icons/                        # SVG icons for like, comment, share, bookmark, toggle, sparkle
├── docs/
│   └── dev_plan.md                   # This file
├── .env.local                        # GEMINI_API_KEY, JAMENDO_CLIENT_ID (gitignored)
├── next.config.ts                    # Image domains, edge config
├── package.json
└── ...
```

---

## 5. Data Layer — Wikipedia API

### Endpoint

```
GET https://id.wikipedia.org/api/rest_v1/page/random/summary
```

### Response Structure (relevant fields)

```typescript
interface WikipediaSummary {
  type: string;                    // "standard" for normal articles
  title: string;                   // Article title
  displaytitle: string;            // HTML-formatted title
  description?: string;            // Short description
  extract: string;                 // Plain text summary (first paragraph)
  extract_html: string;            // HTML-formatted summary
  thumbnail?: {
    source: string;                // Thumbnail URL
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;                // Full-resolution image URL
    width: number;
    height: number;
  };
  content_urls: {
    desktop: { page: string; };    // Full article URL
    mobile: { page: string; };
  };
  lang: string;                    // "id" for Indonesian
  pageid: number;                  // Unique page ID
}
```

### Server-side Fetch Logic (`lib/wikipedia.ts`)

```typescript
const WIKI_API = 'https://id.wikipedia.org/api/rest_v1/page/random/summary';

export async function fetchRandomArticle(): Promise<WikipediaSummary | null> {
  const response = await fetch(WIKI_API, {
    headers: {
      'Api-User-Agent': 'GoodReels/1.0 (good-reels prototype)',
    },
    cache: 'no-store', // Always want random
  });

  if (!response.ok) return null;

  const data: WikipediaSummary = await response.json();

  // Skip articles without images (not suitable for Reels format)
  if (!data.thumbnail && !data.originalimage) return null;

  // Skip disambiguation and non-standard pages
  if (data.type !== 'standard') return null;

  return data;
}
```

### Key Rules

1. **Always include `Api-User-Agent` header** — Wikipedia requires identification.
2. **Skip imageless articles** — a Reel without image is useless.
3. **Skip non-standard pages** — disambiguation pages, redirects, etc.
4. Each call returns **one** random article; we call it multiple times in parallel for batching.

---

## 6. Content Moderation — Gemini API

### Model Choice

| Model | Why |
|-------|-----|
| `gemini-2.0-flash-lite` | ~~Cheapest, fastest Gemini model.~~ **Deprecated.** Replaced with `gemini-2.5-flash` in implementation. Content moderation skipped entirely for faster loading. |

### SDK: `@google/genai`

The official SDK (`@google/genai`) replaces the deprecated `@google/generative-ai`.

### Moderation Logic (`lib/gemini.ts`)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function isContentSafe(title: string, extract: string): Promise<boolean> {
  const prompt = `You are a content filter for a feel-good Wikipedia article viewer app.
Determine if the following Wikipedia article is suitable for a positive, uplifting browsing experience.

REJECT articles about:
- Wars, battles, massacres, genocide
- Serial killers, murderers, criminals
- Diseases, pandemics, epidemics
- Natural disasters with high death tolls
- Scandals, corruption
- Terrorism, extremism
- Torture, abuse
- Dark/disturbing historical events
- Controversial political figures known for violence/oppression

ACCEPT articles about:
- Nature, animals, plants
- Cities, geography, landmarks
- Culture, art, music, food
- Sports, athletes
- Science, technology, inventions
- Architecture, buildings
- Festivals, traditions
- Everyday objects, concepts
- Biographies of positive/neutral public figures

Article Title: ${title}
Article Summary: ${extract}

Respond with ONLY "TRUE" if the article is suitable, or "FALSE" if it should be rejected. Nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: prompt,
    });
    const text = response.text?.trim().toUpperCase();
    return text === 'TRUE';
  } catch (error) {
    // On error, default to rejecting (safety-first)
    console.error('Gemini moderation error:', error);
    return false;
  }
}
```

### Key Rules

1. **Prompt is kept short** — minimizes token usage and latency.
2. **Response is strictly `TRUE`/`FALSE`** — easy to parse.
3. **On API failure, reject the article** — safety-first default.
4. **API key is server-side only** — never exposed to client.

---

## 7. Background Music — Jamendo API

Each reel plays a **different background music track** — chill, relaxing, good-vibes music streamed from Jamendo's free Creative Commons catalog.

### Why Jamendo?

| Criteria | Jamendo |
|----------|----------|
| Cost | Free (Creative Commons licensed) |
| API key | Free `client_id` (register at devportal.jamendo.com) |
| Music quality | Curated by Jamendo music managers |
| Streaming | Direct MP3/OGG CDN URLs — no SDK needed |
| Genres | Has `relaxation`, `lounge`, `chillout`, `ambient`, `acoustic` tags |

### Endpoint

```
GET https://api.jamendo.com/v3.0/tracks/
    ?client_id=YOUR_CLIENT_ID
    &format=json
    &limit=50
    &tags=chillout+relaxation+lounge
    &featured=1
    &include=musicinfo
    &audioformat=mp32
```

### Response Structure (relevant fields)

```typescript
interface JamendoTrack {
  id: string;           // Track ID
  name: string;         // Track name
  artist_name: string;  // Artist name
  audio: string;        // MP3 streaming URL (96kbps, enough for background)
  audiodownload: string;// Higher quality download URL
  image: string;        // Album art URL
  duration: number;     // Duration in seconds
}
```

### Server-side Fetch Logic (`lib/jamendo.ts`)

```typescript
const JAMENDO_API = 'https://api.jamendo.com/v3.0/tracks';

export async function fetchChillTracks(limit = 50): Promise<JamendoTrack[]> {
  const params = new URLSearchParams({
    client_id: process.env.JAMENDO_CLIENT_ID!,
    format: 'json',
    limit: limit.toString(),
    tags: 'chillout+relaxation+lounge',
    featured: '1',
    include: 'musicinfo',
    audioformat: 'mp32',
    order: 'popularity_total',
  });

  const response = await fetch(`${JAMENDO_API}?${params}`);
  if (!response.ok) return [];

  const data = await response.json();
  return data.results || [];
}
```

### API Route (`/api/tracks`)

```typescript
// app/api/tracks/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const tracks = await fetchChillTracks(count);

  // Return just the fields the client needs
  const simplified = tracks.map(t => ({
    id: t.id,
    name: t.name,
    artist: t.artist_name,
    audioUrl: t.audio,
    duration: t.duration,
  }));

  return Response.json(simplified, {
    headers: {
      // Cache for 1 hour — track list doesn't change often
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
```

### Client-side Audio Playback (`useBackgroundMusic.ts`)

```typescript
export function useBackgroundMusic(currentIndex: number, tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const track = tracks[currentIndex % tracks.length];
    if (!track) return;

    // Create or reuse audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Background level
    }

    const audio = audioRef.current;
    audio.src = track.audioUrl;
    audio.muted = isMuted;
    audio.play().catch(() => {}); // Autoplay may be blocked

    return () => {
      audio.pause();
    };
  }, [currentIndex, tracks]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (audioRef.current) audioRef.current.muted = !isMuted;
  };

  return { isMuted, toggleMute };
}
```

### Key Rules

1. **Tracks are fetched once in a batch** (20-50 tracks) and cached. They rotate across reels via `currentIndex % tracks.length`.
2. **Audio starts at low volume** (0.3) — it's background music, not the main content.
3. **Autoplay is handled gracefully** — browsers block autoplay until user interaction. First tap/scroll unmutes.
4. **Mute toggle** in the UI (volume icon in ActionBar or overlay).
5. **Each reel gets a different track** — the variety engine ensures adjacent reels never share the same track.
6. `JAMENDO_CLIENT_ID` stays server-side — client only receives public CDN audio URLs.

---

## 8. Core UI — Reels-style Vertical Feed

### Scroll Snap Architecture

The feed uses **CSS Scroll Snap** for the native snapping behavior. This is the most performant approach — no JavaScript-driven animations.

```
┌──────────────────────────┐
│    ReelsFeed Container   │  height: 100dvh
│    scroll-snap-type:     │  overflow-y: scroll
│    y mandatory           │
│                          │
│  ┌────────────────────┐  │
│  │     ReelCard #1    │  │  height: 100dvh
│  │  scroll-snap-align: │  │  scroll-snap-align: start
│  │      start          │  │
│  ├────────────────────┤  │
│  │     ReelCard #2    │  │
│  │                    │  │
│  ├────────────────────┤  │
│  │     ReelCard #3    │  │  ← Current view
│  │                    │  │
│  ├────────────────────┤  │
│  │     ReelCard #4    │  │  ← Pre-loaded
│  │                    │  │
│  ├────────────────────┤  │
│  │     ReelCard #5    │  │  ← Pre-loaded
│  │                    │  │
│  ├────────────────────┤  │
│  │   LoadingReel      │  │  ← Intersection Observer trigger
│  └────────────────────┘  │
└──────────────────────────┘
```

### CSS Implementation (in `globals.css`)

```css
/* Scroll Snap Container */
.reels-feed {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: none;      /* Prevent browser pull-to-refresh */
  scrollbar-width: none;            /* Hide scrollbar (Firefox) */
}

.reels-feed::-webkit-scrollbar {
  display: none;                     /* Hide scrollbar (Chrome/Safari) */
}

/* Individual Reel */
.reel-card {
  height: 100dvh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;          /* Force stop on every card */
  position: relative;
  overflow: hidden;
}
```

### ReelCard Layout (visual spec)

```
┌─────────────────────────────────────┐
│                                     │
│   FULL-BLEED IMAGE                  │
│   (object-fit: cover)               │
│   + Ken Burns motion (CSS anim)     │
│   + CSS filter (warm/cool/vintage)  │
│                                     │
│                          ┌───┐      │
│                          │ ♡ │      │  ← ActionBar (right side)
│                          ├───┤      │
│                          │ 💬│      │
│                          ├───┤      │
│                          │ 🔖│      │
│                          ├───┤      │
│                          │ ↗ │      │
│                          ├───┤      │
│                          │🔇 │      │  ← Mute/unmute music
│                          └───┘      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📖 Article Title            │    │  ← ReelOverlay (bottom)
│  │ First paragraph of the      │    │
│  │ article summary text...     │    │
│  │                              │   │
│  │ [🔗 Baca di Wikipedia]      │    │  ← Wikipedia chip
│  │                              │   │
│  │ 🎵 Track Name — Artist   ⊙  │    │  ← MusicIndicator (spinning disc)
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Component Responsibilities

**`ReelCard.tsx`**
- Display article image as full-bleed background using `next/image` with `fill` and `object-fit: cover`
- Apply **Ken Burns CSS animation class** based on the reel's assigned motion preset
- Apply **CSS filter** based on the reel's assigned filter preset
- Gradient overlay at the bottom (transparent → semi-opaque black) for text legibility
- Render `<ReelOverlay>` for text content
- Render `<ActionBar>` for interaction buttons
- Render `<MusicIndicator>` with track name + spinning disc

**`ReelOverlay.tsx`**
- Article title (bold, white, text-shadow)
- Summary text (max 3 lines, with line-clamp)
- "Baca di Wikipedia" chip — opens `content_urls.mobile.page` in new tab
- Gradient background behind text

**`ActionBar.tsx`**
- Vertical stack of action buttons on the right side (like Instagram Reels)
- **Like** (heart icon) — toggles red fill on tap, shows count
- **Comment** (chat bubble icon) — opens `CommentSheet`
- **Bookmark** (bookmark icon) — toggles filled state
- **Share** (share icon) — uses Web Share API, falls back to clipboard copy
- **Mute/Unmute** (speaker icon) — toggles background music
- Each button: rounded circle, semi-transparent bg, white icon, subtle scale animation on tap

**`MusicIndicator.tsx`**
- Small spinning disc icon (mimics Instagram Reels album art spinner)
- Track name + artist name (scrolling marquee if text is long)
- Positioned at bottom-right, above the overlay
- Spins when audio is playing, stops when muted

**`CommentSheet.tsx`**
- Bottom sheet (slides up from bottom)
- Shows list of comments for current article (from localStorage)
- Input field at bottom to add a comment
- Each comment shows text + timestamp
- Close button / drag-down to dismiss

**`ReelsFeed.tsx`**
- Host the scroll-snap container
- Manage the `articles[]` state via `useArticleBuffer` hook
- Manage music state via `useBackgroundMusic` hook
- Render `<ReelCard>` for each article in the buffer (with motion/filter/track from variety engine)
- Render `<LoadingReel>` as the last child (Intersection Observer target)
- Integrate `<PullToRefresh>` for first-position refresh
- Track current visible reel index via Intersection Observer

---

## 9. Ken Burns Image Motion & CSS Filters

Each reel's background image has a **slow cinematic motion effect** (Ken Burns) and a **unique CSS filter** to make every reel feel visually distinct — like a curated photo story.

### Ken Burns Motion Presets

All motion is done via **CSS `@keyframes` animations** on the image element. The image is scaled slightly beyond the viewport (110-120%) and animated over 15-25 seconds. Since each reel is `overflow: hidden`, the extra scale is invisible.

```css
/* globals.css — Ken Burns keyframes */

@keyframes kb-zoom-in {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.15) translate(0, 0); }
}

@keyframes kb-zoom-out {
  from { transform: scale(1.2) translate(0, 0); }
  to   { transform: scale(1) translate(0, 0); }
}

@keyframes kb-pan-left {
  from { transform: scale(1.15) translate(5%, 0); }
  to   { transform: scale(1.15) translate(-5%, 0); }
}

@keyframes kb-pan-right {
  from { transform: scale(1.15) translate(-5%, 0); }
  to   { transform: scale(1.15) translate(5%, 0); }
}

@keyframes kb-pan-up {
  from { transform: scale(1.15) translate(0, 5%); }
  to   { transform: scale(1.15) translate(0, -3%); }
}

@keyframes kb-pan-down {
  from { transform: scale(1.15) translate(0, -3%); }
  to   { transform: scale(1.15) translate(0, 5%); }
}

@keyframes kb-diagonal-tl {
  from { transform: scale(1.2) translate(4%, 4%); }
  to   { transform: scale(1.1) translate(-4%, -4%); }
}

@keyframes kb-diagonal-br {
  from { transform: scale(1.1) translate(-4%, -4%); }
  to   { transform: scale(1.2) translate(4%, 4%); }
}
```

| Preset Index | Name | Animation | Duration |
|---|---|---|---|
| 0 | Zoom In | `kb-zoom-in` | 20s |
| 1 | Zoom Out | `kb-zoom-out` | 18s |
| 2 | Pan Left | `kb-pan-left` | 22s |
| 3 | Pan Right | `kb-pan-right` | 22s |
| 4 | Pan Up | `kb-pan-up` | 20s |
| 5 | Pan Down | `kb-pan-down` | 20s |
| 6 | Diagonal TL | `kb-diagonal-tl` | 25s |
| 7 | Diagonal BR | `kb-diagonal-br` | 25s |

### CSS Filter Presets

Filters add subtle color grading — think Instagram-style photo filters. Parameters are **constrained to look good** (never over-processed).

```typescript
// lib/variety.ts
const FILTER_PRESETS = [
  { name: 'natural',  css: 'brightness(1.05) contrast(1.05) saturate(1.1)' },
  { name: 'warm',     css: 'brightness(1.08) contrast(1.02) saturate(1.2) sepia(0.15)' },
  { name: 'cool',     css: 'brightness(1.05) contrast(1.08) saturate(0.9) hue-rotate(10deg)' },
  { name: 'vivid',    css: 'brightness(1.02) contrast(1.12) saturate(1.4)' },
  { name: 'muted',    css: 'brightness(1.1) contrast(0.95) saturate(0.7)' },
  { name: 'golden',   css: 'brightness(1.1) contrast(1.05) saturate(1.15) sepia(0.2) hue-rotate(-10deg)' },
  { name: 'dreamy',   css: 'brightness(1.12) contrast(0.98) saturate(1.05) blur(0.3px)' },
  { name: 'vintage',  css: 'brightness(0.95) contrast(1.1) saturate(0.85) sepia(0.25)' },
  { name: 'crisp',    css: 'brightness(1.02) contrast(1.15) saturate(1.05)' },
  { name: 'oceanic',  css: 'brightness(1.05) contrast(1.05) saturate(1.1) hue-rotate(15deg)' },
];
```

### How it's applied in `ReelCard.tsx`

```tsx
// Each reel receives motionPreset and filterPreset from the variety engine
<div className="reel-card">
  <div
    className="reel-image-container"
    style={{
      animation: `${MOTION_PRESETS[motionPreset].animation} ${MOTION_PRESETS[motionPreset].duration}s ease-in-out infinite alternate`,
      filter: FILTER_PRESETS[filterPreset].css,
    }}
  >
    <Image src={article.imageUrl} alt={article.title} fill style={{ objectFit: 'cover' }} />
  </div>
  {/* ... overlay, action bar, etc. */}
</div>
```

> **Performance note:** CSS `transform` and `filter` are GPU-composited — they don't trigger layout/paint, so they're extremely smooth even on mid-range phones.

---

## 10. Variety Engine — No Two Adjacent Reels Feel the Same

The variety engine is a **client-side algorithm** that assigns a unique combination of motion preset, filter preset, and music track to each reel. It guarantees that no two adjacent reels share any of the same presets.

### Algorithm (`lib/variety.ts`)

```typescript
interface ReelStyle {
  motionPreset: number;  // Index into MOTION_PRESETS (0-7)
  filterPreset: number;  // Index into FILTER_PRESETS (0-9)
  trackIndex: number;    // Index into the tracks array
}

const NUM_MOTIONS = 8;
const NUM_FILTERS = 10;

export function assignReelStyle(index: number, totalTracks: number, prevStyle?: ReelStyle): ReelStyle {
  // Use a seeded approach based on index, but ensure no collision with previous
  let motion = index % NUM_MOTIONS;
  let filter = (index * 3 + 1) % NUM_FILTERS;  // Stride of 3 for variety
  let track  = index % totalTracks;

  // If collision with previous reel, shift by 1
  if (prevStyle) {
    if (motion === prevStyle.motionPreset) motion = (motion + 1) % NUM_MOTIONS;
    if (filter === prevStyle.filterPreset) filter = (filter + 1) % NUM_FILTERS;
    if (track === prevStyle.trackIndex)    track  = (track + 1) % totalTracks;
  }

  return { motionPreset: motion, filterPreset: filter, trackIndex: track };
}
```

### Result

| Reel | Motion | Filter | Track |
|------|--------|--------|-------|
| #0 | Zoom In | Natural | Track A |
| #1 | Zoom Out | Warm | Track B |
| #2 | Pan Left | Cool | Track C |
| #3 | Pan Right | Vivid | Track D |
| ... | (cycles with stride) | (cycles with different stride) | (cycles independently) |

Since there are **8 motions × 10 filters × N tracks**, the combination space is huge — the user will scroll through dozens of reels before seeing a repeat, and even then the content/image is different.

---

## 11. 3D Network Exploration Mode

A **layout toggle** at the top of the screen switches the entire view from the Reels/TikTok vertical feed into an interactive **3D force-directed graph** that visualizes the hyperlink relationships within Wikipedia articles.

### Concept

```
                         ┌─────────────────────────────────────┐
                         │        NETWORK MODE                 │
                         │                                     │
                         │      ╭─── Linked Article B          │
                         │     ╱                               │
                         │    ╱   ╭─ Linked Article C          │
                         │   ╱   ╱                             │
   Current Article ──────╋──●───●── Linked Article D           │
   (center node)         │   ╲   ╲                             │
                         │    ╲   ╰─ Linked Article E          │
                         │     ╲                               │
                         │      ╰─── Linked Article F          │
                         │                                     │
                         │   (rotate, zoom, pan the 3D scene)  │
                         │                                     │
                         │   [ Tap any node → open as Reel ]   │
                         └─────────────────────────────────────┘
```

### How it works

1. User is viewing an article in the standard Reels layout.
2. User taps the **layout toggle** (top of screen) → switches to Network Mode.
3. A **loader** appears ("Memuat jaringan artikel...") while the backend fetches and parses the full article.
4. The API extracts all **internal Wikipedia hyperlinks** from the article.
5. The result is rendered as a **3D force-directed graph**:
   - **Center node** = the current article (larger, highlighted).
   - **Surrounding nodes** = all linked Wikipedia articles (smaller dots).
   - **Edges** = connections between the center and each linked article.
6. User can **rotate**, **zoom**, and **pan** the 3D scene (touch/mouse).
7. **Tapping a node** opens that article as the current reel:
   - The view switches back to Reels layout.
   - That article is shown as the first reel.
   - A few more random articles are pre-loaded below for continued scrolling.
8. User can toggle back to Network Mode at any time to explore the new article's links.

### Wikipedia Links API

Wikipedia's MediaWiki Action API provides an endpoint to extract all internal links from a page:

```
GET https://id.wikipedia.org/w/api.php
    ?action=query
    &titles={ARTICLE_TITLE}
    &prop=links
    &pllimit=max
    &plnamespace=0
    &format=json
```

This returns all links to other Wikipedia articles (namespace 0 = main articles only). We also fetch the summary for each linked article to display its title and description in the graph.

### API Route: `/api/links`

```typescript
// app/api/links/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  if (!title) return Response.json({ error: 'title required' }, { status: 400 });

  // Step 1: Get all internal links from the article
  const linksUrl = `https://id.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=links&pllimit=max&plnamespace=0&format=json`;
  const linksRes = await fetch(linksUrl, {
    headers: { 'Api-User-Agent': 'GoodReels/1.0' },
  });
  const linksData = await linksRes.json();

  // Extract link titles from response
  const pages = Object.values(linksData.query.pages) as any[];
  const links: string[] = pages[0]?.links?.map((l: any) => l.title) || [];

  // Step 2: Fetch summaries for linked articles (batch, max ~30 for performance)
  const limitedLinks = links.slice(0, 40);
  const summaries = await Promise.allSettled(
    limitedLinks.map(async (linkTitle) => {
      const res = await fetch(
        `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(linkTitle)}`,
        { headers: { 'Api-User-Agent': 'GoodReels/1.0' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        title: data.title,
        description: data.description || '',
        thumbnailUrl: data.thumbnail?.source || null,
        articleUrl: data.content_urls?.mobile?.page || '',
        pageid: data.pageid,
      };
    })
  );

  // Filter successful fetches
  const nodes = summaries
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<any>).value);

  return Response.json({
    center: title,
    links: nodes,
    totalLinksInArticle: links.length,
  });
}
```

### Graph Visualization: `NetworkView.tsx`

Uses `react-force-graph-3d` (built on three.js) for hardware-accelerated 3D rendering.

```typescript
// Simplified structure
import ForceGraph3D from 'react-force-graph-3d';

interface GraphData {
  nodes: { id: string; name: string; thumbnail?: string; isCenter: boolean }[];
  links: { source: string; target: string }[];
}

export function NetworkView({ articleTitle, onNodeClick }: Props) {
  const { graphData, isLoading } = useNetworkGraph(articleTitle);

  if (isLoading) return <NetworkLoader />;

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeLabel="name"
      nodeColor={node => node.isCenter ? '#FF6B35' : '#4ECDC4'}
      nodeRelSize={node => node.isCenter ? 12 : 6}
      linkColor={() => 'rgba(255,255,255,0.15)'}
      linkWidth={1}
      backgroundColor="#000000"
      onNodeClick={(node) => onNodeClick(node.id, node.name)}
      nodeThreeObject={(node) => {
        // Custom: render thumbnail as texture on sphere if available
        // Or fallback to colored sphere with text label
      }}
      enableNavigationControls={true}
      showNavInfo={false}
    />
  );
}
```

### Hook: `useNetworkGraph.ts`

```typescript
export function useNetworkGraph(articleTitle: string) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!articleTitle) return;
    setIsLoading(true);

    fetch(`/api/links?title=${encodeURIComponent(articleTitle)}`)
      .then(res => res.json())
      .then(data => {
        // Build graph data structure
        const nodes = [
          { id: articleTitle, name: articleTitle, isCenter: true },
          ...data.links.map((link: any) => ({
            id: link.title,
            name: link.title,
            thumbnail: link.thumbnailUrl,
            isCenter: false,
          })),
        ];

        const links = data.links.map((link: any) => ({
          source: articleTitle,
          target: link.title,
        }));

        setGraphData({ nodes, links });
      })
      .finally(() => setIsLoading(false));
  }, [articleTitle]);

  return { graphData, isLoading };
}
```

### Component: `LayoutToggle.tsx`

```
  ┌─────────────────────────────────────┐
  │  ┌──────┐  ┌──────┐                │
  │  │ ▦▦▦  │  │ ◉──◉ │                │
  │  │ Reels│  │Graph │                │
  │  └──────┘  └──────┘                │
  │  ↑ active                          │
  └─────────────────────────────────────┘
```

- **Positioned**: fixed at the top-center of the screen, overlaying the feed.
- **Two icons**: Reels icon (stacked rectangles) and Network icon (connected nodes).
- **Active state**: highlighted with accent color, subtle pill-shaped background.
- **Semi-transparent background** to not obstruct the content.
- **Animated transition**: smooth fade/scale when switching modes.
- On toggle:
  - **Reels → Network**: pauses music, shows `NetworkLoader`, then renders `NetworkView`.
  - **Network → Reels**: returns to the reel that was visible before the toggle.

### Component: `NetworkLoader.tsx`

- Full-screen dark overlay with animated loader.
- Pulsing network-graph icon or animated dots forming connections.
- Text: "Memuat jaringan artikel..." (Loading article network...).
- Shown during the `isLoading` state of `useNetworkGraph`.

### Flow: Node Click → Open as Reel

When a user taps a node in the 3D graph:

1. `onNodeClick(nodeTitle)` is called.
2. The app fetches the summary for that article (via `/api/articles` with a specific title, or `/api/links` can provide inline data).
3. Layout switches back to Reels mode.
4. The tapped article becomes **the first reel** in a fresh feed.
5. A few more random articles are prefetched and appended below for continued scrolling.
6. The user can scroll down as usual, or toggle back to Network to see the new article's links.

### Performance Considerations

- **Link limit**: Cap at ~40 linked articles per graph to keep rendering fast. Show a "+ N more" indicator if there are more.
- **Summary fetching**: Use `Promise.allSettled` for parallel fetching of linked article summaries. Tolerate individual failures.
- **Lazy 3D rendering**: `react-force-graph-3d` is only loaded when Network Mode is activated (dynamic import with `next/dynamic`).
- **Cache graph data**: If user toggles back and forth, cache the last graph data in state to avoid re-fetching.

```typescript
// Lazy load the heavy 3D component
import dynamic from 'next/dynamic';
const NetworkView = dynamic(() => import('./NetworkView'), {
  ssr: false,
  loading: () => <NetworkLoader />,
});
```

---

## 12. AI Q&A Chat — Ask About the Article

Each reel has a **sparkle button (✨)** in the action bar. Tapping it slides up a **half-screen chat sheet** — identical in feel to Instagram's comment sheet — where users can ask questions about the article they're viewing.

### Concept

```
┌─────────────────────────────────────┐
│                                     │
│   REEL CONTENT (dimmed)             │
│                                     │
├─────────────────────────────────────┤  ← 50% screen height
│  ✨ Tanya tentang artikel ini       │
│                                     │
│  ┌─ AI ───────────────────────────┐ │
│  │ Artikel ini membahas sejarah   │ │
│  │ Indonesia dari masa kerajaan   │ │
│  │ hingga kemerdekaan. Ada yang   │ │
│  │ ingin kamu ketahui?            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─ You ──────────────────────────┐ │
│  │ Siapa tokoh penting di masa    │ │
│  │ pergerakan nasional?           │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─ AI ───────────────────────────┐ │
│  │ Beberapa tokoh penting...      │ │
│  │ ▊ (streaming)                  │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────┐  [↑]  │
│  │ Ketik pertanyaan...      │      │
│  └─────────────────────────┘       │
└─────────────────────────────────────┘
```

### How it works

1. User taps the **✨ button** in the action bar while viewing a reel.
2. A **bottom sheet** slides up, covering ~50% of the screen (same animation as CommentSheet).
3. The sheet starts a **new chat session** tied to the current article.
4. The **article's full extract** (title + summary from Wikipedia) is pre-loaded into the Gemini system prompt on the backend — the LLM already knows what the user is looking at.
5. User types a question → sent to `POST /api/chat`.
6. The response **streams back** in real-time (Server-Sent Events / ReadableStream) — user sees the answer typing out word by word.
7. User can ask follow-up questions — the full conversation history is sent with each request to maintain context.
8. **Switching to a different reel automatically resets the chat** — each article gets its own conversation. Previous chats are discarded (ephemeral, not persisted).
9. Reopening the chat on the same reel resumes where the user left off (state held in React, not localStorage).

### Backend: `POST /api/chat`

```typescript
// app/api/chat/route.ts
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  const { articleTitle, articleExtract, messages } = await request.json();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Build the conversation for Gemini
  const systemPrompt = `You are a helpful, friendly, and enthusiastic assistant embedded in a Wikipedia article viewer app called "Good Reels". 

The user is currently viewing this Wikipedia article:

**Title:** ${articleTitle}

**Content:**
${articleExtract}

Your role:
- Answer questions about this article clearly and concisely.
- If the user asks something not covered in the article, say so honestly but try to provide helpful general knowledge.
- Respond in the same language the user uses (Bahasa Indonesia or English).
- Keep responses concise — this is a mobile chat, not an essay.
- Be engaging and curious — encourage the user to explore more.
- Use markdown formatting sparingly (bold for emphasis is fine, but avoid headers or long lists).`;

  // Convert chat messages to Gemini format
  const contents = messages.map((msg: { role: string; text: string }) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // Stream the response
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-lite',
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
    contents,
  });

  // Return as a ReadableStream (Server-Sent Events style)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.text || '';
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Frontend Hook: `useAIChat.ts`

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

export function useAIChat(articleId: string, articleTitle: string, articleExtract: string) {
  // Chat sessions are keyed by articleId — switching articles resets the chat
  const [sessions, setSessions] = useState<Record<string, ChatMessage[]>>({});
  const [isStreaming, setIsStreaming] = useState(false);

  const messages = sessions[articleId] || [];

  const sendMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
    };

    // Add user message to session
    const updatedMessages = [...messages, userMsg];
    setSessions(prev => ({ ...prev, [articleId]: updatedMessages }));

    // Create placeholder for AI response
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: '',
      isStreaming: true,
    };
    setSessions(prev => ({
      ...prev,
      [articleId]: [...updatedMessages, aiMsg],
    }));

    setIsStreaming(true);

    // Stream the response
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleTitle,
        articleExtract,
        messages: updatedMessages.map(m => ({ role: m.role, text: m.text })),
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        const parsed = JSON.parse(data);
        fullText += parsed.text;

        // Update the AI message in real-time
        setSessions(prev => ({
          ...prev,
          [articleId]: prev[articleId].map(m =>
            m.id === aiMsg.id ? { ...m, text: fullText } : m
          ),
        }));
      }
    }

    // Mark streaming as complete
    setSessions(prev => ({
      ...prev,
      [articleId]: prev[articleId].map(m =>
        m.id === aiMsg.id ? { ...m, isStreaming: false } : m
      ),
    }));
    setIsStreaming(false);
  };

  const clearSession = () => {
    setSessions(prev => {
      const next = { ...prev };
      delete next[articleId];
      return next;
    });
  };

  return { messages, sendMessage, isStreaming, clearSession };
}
```

### Component: `AIChatSheet.tsx`

```
┌─────────────────────────────────────┐
│  ✨ Tanya AI tentang artikel ini    │  ← Header with sparkle icon
│  ─────────────────────────────────  │  ← Drag handle
│                                     │
│  ┌─ AI ─────────────────────────┐   │  ← AI messages (left-aligned)
│  │ Welcome message...           │   │
│  └───────────────────────────────┘   │
│                                     │
│            ┌─ You ──────────────┐   │  ← User messages (right-aligned)
│            │ User question...   │   │
│            └────────────────────┘   │
│                                     │
│  ┌─ AI ─────────────────────────┐   │  ← Streaming response with cursor
│  │ Response streaming... ▊      │   │
│  └───────────────────────────────┘   │
│                                     │
│  ┌───────────────────────────┐ [↑]  │  ← Input field + send button
│  │ Ketik pertanyaan...       │      │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

**Key UI details:**

- Same slide-up animation as `CommentSheet` (translateY 100% → 0, spring easing).
- **Height**: 50vh (half the screen). Can be dragged to dismiss.
- **Header**: "✨ Tanya AI tentang artikel ini" with a close button.
- **Message bubbles**:
  - AI messages: left-aligned, dark bubble (`#1C1C1E`), white text.
  - User messages: right-aligned, accent-colored bubble (`#4ECDC4`), white text.
- **Streaming indicator**: pulsing cursor `▊` at the end of the AI message while streaming.
- **Input area**: fixed at the bottom of the sheet, with a text field and send button (arrow icon).
- **Auto-scroll**: chat scrolls to bottom as new content streams in.
- **Empty state**: when first opened, show a brief intro: "Tanya apa saja tentang artikel ini! 🤔" (Ask anything about this article!).

### Session Management

| Scenario | Behavior |
|----------|----------|
| User opens chat on Article A | New session created, empty chat |
| User asks questions, gets answers | Messages stored in React state, keyed by article ID |
| User closes chat sheet | Session preserved in state |
| User reopens chat on same Article A | Previous conversation restored |
| **User scrolls to Article B** | **Chat resets** — Article B gets a new, empty session |
| User scrolls back to Article A | Previous session for A is still in state (if not garbage-collected) |
| User force-refreshes page | All chat sessions lost (ephemeral, not persisted) |

### Why ephemeral sessions?

- Chat is contextual to the reel experience — users are browsing, not building long-term conversations.
- No localStorage overhead for potentially large chat histories.
- Keeps the privacy model simple (no stored data to clear).
- Each article's system prompt is different, so sessions are inherently scoped.

### Gemini Model Choice

Use `gemini-2.0-flash-lite` — same model used for content moderation — because:
- **Fast**: streaming response with low latency.
- **Cheap**: free tier supports the Q&A use case easily.
- **Context window**: 1M tokens — more than enough for a Wikipedia article extract + chat history.
- Same `GEMINI_API_KEY` — no additional keys needed.

---

## 13. Interaction Layer — Engagement Features

### Like

```typescript
// Toggle like for article
interface LikeData {
  [articleId: string]: boolean;
}
// localStorage key: 'goodreels_likes'
```

### Bookmark

```typescript
interface BookmarkData {
  [articleId: string]: boolean;
}
// localStorage key: 'goodreels_bookmarks'
```

### Comment

```typescript
interface Comment {
  id: string;        // Date.now().toString()
  text: string;
  timestamp: number;  // Date.now()
}

interface CommentData {
  [articleId: string]: Comment[];
}
// localStorage key: 'goodreels_comments'
```

### Share

Uses the Web Share API:

```typescript
async function shareArticle(title: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, url });
  } else {
    await navigator.clipboard.writeText(url);
    // Show "Link copied!" toast
  }
}
```

### AI Chat

- **Sparkle button (✨)** in the action bar — positioned after the standard buttons.
- Tapping opens `<AIChatSheet>` (half-screen bottom sheet).
- Badge indicator: glows subtly to hint at the feature on first use.
- See [§12 AI Q&A Chat](#12-ai-qa-chat--ask-about-the-article) for full details.

---

## 14. Pull-to-Refresh

### Behavior Spec

- Only active **when the user is on the first reel** and **scrolled to the top**.
- Pulling down shows a **sticky elastic effect** with a refresh indicator.
- Releasing past the threshold triggers a content refresh (replaces entire feed with fresh articles).
- Visual: a circle/spinner that grows as the user pulls, then animates on release.

### Implementation (`usePullToRefresh.ts`)

```typescript
// Simplified logic:
function usePullToRefresh(containerRef, onRefresh) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const THRESHOLD = 80; // px to trigger refresh

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120)); // 0.5 = rubber-band resistance
      e.preventDefault(); // Prevent native scroll
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > THRESHOLD) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  // Return: { pullDistance, isRefreshing, handlers }
}
```

### Visual: `PullToRefresh.tsx`

- A circular spinner/icon at the top of the feed
- Translates down proportionally to `pullDistance`
- Opacity ramps from 0 → 1 as user pulls
- Spins on `isRefreshing`
- Uses CSS `transform` and `transition` for smoothness

---

## 15. Local Storage Persistence

### Hook: `useLocalInteractions.ts`

```typescript
export function useLocalInteractions() {
  // Likes
  const isLiked = (articleId: string) => boolean;
  const toggleLike = (articleId: string) => void;
  const getLikeCount = (articleId: string) => number; // simulated: random 100-5000

  // Bookmarks
  const isBookmarked = (articleId: string) => boolean;
  const toggleBookmark = (articleId: string) => void;

  // Comments
  const getComments = (articleId: string) => Comment[];
  const addComment = (articleId: string, text: string) => void;

  return { isLiked, toggleLike, getLikeCount, isBookmarked, toggleBookmark, getComments, addComment };
}
```

### Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `goodreels_likes` | `Record<string, boolean>` | Liked article IDs |
| `goodreels_bookmarks` | `Record<string, boolean>` | Bookmarked article IDs |
| `goodreels_comments` | `Record<string, Comment[]>` | Comments per article |

### Notes

- Use `JSON.parse` / `JSON.stringify` for serialization.
- Wrap in `try/catch` for incognito mode / storage-full scenarios.
- Like counts are **simulated** (random number seeded by article ID) since there's no backend.

---

## 16. Performance & Prefetching Strategy

This is the **critical engineering challenge** — ensuring the scroll feels buttery smooth.

### Content Buffer Architecture

```
                     ┌──────────────────────────┐
                     │     CONTENT BUFFER        │
                     │                           │
  Already viewed →   │  [Article 0]  ←  ————┐   │
                     │  [Article 1]         │   │
  Current view  →    │  [Article 2]  ◄ HERE │   │
                     │  [Article 3]         │   │
                     │  [Article 4]         │   │   Min 3 ahead at
  Pre-loaded    →    │  [Article 5]  ←  ————┘   │   all times
                     │  [Article 6]             │
                     │  [Article 7]             │
                     │                           │
  Fetch trigger →    │  [IntersectionObserver]   │
                     └──────────────────────────┘
```

### Hook: `useArticleBuffer.ts`

```typescript
const INITIAL_BATCH = 5;      // Articles to fetch on first load
const PREFETCH_BATCH = 3;     // Articles to fetch when buffer runs low
const BUFFER_THRESHOLD = 3;   // Min articles ahead before triggering fetch

export function useArticleBuffer() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFetching = useRef(false);

  // Fetch a batch of articles from API
  const fetchBatch = async (count: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/articles?count=${count}`);
      const newArticles = await res.json();
      setArticles(prev => [...prev, ...newArticles]);
    } finally {
      isFetching.current = false;
    }
  };

  // Trigger prefetch when buffer runs low
  useEffect(() => {
    const remaining = articles.length - currentIndex - 1;
    if (remaining <= BUFFER_THRESHOLD && !isFetching.current) {
      fetchBatch(PREFETCH_BATCH);
    }
  }, [currentIndex, articles.length]);

  // Initial load
  useEffect(() => {
    fetchBatch(INITIAL_BATCH);
  }, []);

  return { articles, currentIndex, setCurrentIndex, isLoading, refresh };
}
```

### Prefetch Rules

1. On initial load: fetch **5 articles** from the API.
2. When the user scrolls and there are **≤ 3 articles** remaining below the viewport, trigger a prefetch of **3 more articles**.
3. Use `IntersectionObserver` on the **3rd-to-last card** to trigger the prefetch.
4. Prevent duplicate fetches with a `useRef` flag (`isFetching`).
5. Articles already scrolled past are **kept in the DOM** (user can scroll back up).

### API Route: Parallel Fetching with Retry

The `/api/articles` route fetches multiple articles in parallel, filters them through Gemini, and retries rejected ones:

```typescript
// Simplified logic for GET /api/articles?count=5
export async function GET(request: Request) {
  const count = parseInt(url.searchParams.get('count') || '5');
  const articles: Article[] = [];
  let attempts = 0;
  const MAX_ATTEMPTS = count * 4; // Retry up to 4x the requested count

  while (articles.length < count && attempts < MAX_ATTEMPTS) {
    // Fetch 3 candidates in parallel
    const candidates = await Promise.allSettled(
      Array.from({ length: 3 }, () => fetchRandomArticle())
    );

    // Filter successful fetches with images
    const valid = candidates
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<WikipediaSummary>).value);

    // Run Gemini moderation in parallel
    const moderated = await Promise.allSettled(
      valid.map(async article => {
        const safe = await isContentSafe(article.title, article.extract);
        return safe ? article : null;
      })
    );

    // Collect passing articles
    for (const result of moderated) {
      if (result.status === 'fulfilled' && result.value !== null) {
        if (articles.length < count) {
          articles.push(transformToArticle(result.value));
        }
      }
    }

    attempts += 3;
  }

  return Response.json(articles);
}
```

### Image Optimization

- Use `next/image` with `fill` prop for automatic optimization and lazy loading.
- Configure `next.config.ts` to allow Wikipedia image domains:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
};
```

- Images use `priority` loading for the current and next reel, `lazy` for others.

---

## 17. Vercel Deployment & Optimization

### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | How to get it |
|----------|-------|---------------|
| `GEMINI_API_KEY` | Your Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |
| `JAMENDO_CLIENT_ID` | Your Jamendo app client ID | [Jamendo Developer Portal](https://devportal.jamendo.com/) — create free app |

Also create `.env.local` for local development (already gitignored).

### `next.config.ts` — Full Config

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
};

export default nextConfig;
```

### Route Handler — Runtime

We use **Node.js runtime** (not Edge) for API routes because the `@google/genai` SDK may need Node.js APIs and Edge functions have a 30s max execution limit which could be tight for batch fetching + moderation. Node.js serverless functions support up to 60s on Vercel Hobby and 300s on Pro.

```typescript
// app/api/articles/route.ts
export const maxDuration = 30; // Allow up to 30s for retries
```

```typescript
// app/api/tracks/route.ts
export const runtime = 'edge'; // Tracks are simple fetch+cache, perfect for Edge
```

```typescript
// app/api/links/route.ts
export const runtime = 'edge'; // Links are fetch+parse, perfect for Edge
```

> **Note:** `/api/tracks` and `/api/links` can safely use Edge Runtime since they're simple fetch-and-cache operations. The `/api/articles` route uses Node.js runtime because it involves multiple sequential retries and Gemini SDK calls.

### Build Optimizations

- **Static pages**: The main `page.tsx` renders a client component (`ReelsFeed`) so it's effectively a single-page app — fast initial HTML delivery.
- **Image optimization**: `next/image` auto-serves WebP/AVIF in optimal sizes.
- **No SSR for feed data**: Feed content is fetched client-side after initial load — avoids server-side waterfall.

### Vercel-specific Notes

- The app is largely client-side rendering with one API route — simple deployment topology.
- No database connections to manage.
- Edge Runtime for the API route means global low-latency.
- Vercel's built-in CDN handles static assets (CSS, JS, fonts).

---

## 18. File-by-File Implementation Checklist

### Phase 1: Foundation

| # | File | Task | Status |
|---|------|------|--------|
| 1 | `.env.local` | Create with `GEMINI_API_KEY` and `JAMENDO_CLIENT_ID` | ✅ Done (gitignored, see `env.example`) |
| 2 | `next.config.ts` | Add `images.remotePatterns` for `upload.wikimedia.org` | ✅ Done |
| 3 | `app/lib/types.ts` | Define shared interfaces | ✅ Done |
| 4 | `app/lib/wikipedia.ts` | Implement `fetchRandomArticle()` | ✅ Done |
| 5 | `app/lib/gemini.ts` | Implement `isContentSafe()` | ✅ Done (but moderation skipped in production for speed) |
| 6 | `app/lib/jamendo.ts` | Implement `fetchChillTracks()` | ✅ Done |
| 7 | `app/lib/variety.ts` | Implement `assignReelStyle()` | ✅ Done |
| 8 | `app/api/articles/route.ts` | GET handler — parallel fetch (no moderation) | ✅ Done |
| 9 | `app/api/tracks/route.ts` | GET handler — Jamendo tracks | ✅ Done |
| 10 | `app/api/links/route.ts` | GET handler — Wikipedia hyperlinks | ✅ Done |
| 11 | `app/api/chat/route.ts` | POST handler — Gemini streaming + Google Search grounding | ✅ Done |
| — | `app/lib/preloaded-articles.json` | 100 pre-scraped articles for instant load | ✅ Added (not in original plan) |
| — | `app/lib/fallback-tracks.ts` | Bundled fallback music tracks | ✅ Added (not in original plan) |
| — | `scripts/scrape-articles.mjs` | Scraper script to regenerate preloaded articles | ✅ Added (not in original plan) |

### Phase 2: Core UI

| # | File | Task | Status |
|---|------|------|--------|
| 12 | `app/globals.css` | Scroll-snap, Ken Burns keyframes, dark theme, animations | ✅ Done |
| 13 | `app/layout.tsx` | Metadata, viewport, Indonesian lang, Geist fonts | ✅ Done |
| 14 | `app/components/LoadingReel.tsx` | Skeleton placeholder | ✅ Done |
| 15 | `app/components/ReelCard.tsx` | Full-screen card + expandable caption + Ken Burns + CSS filter | ✅ Done |
| 16 | `app/components/ReelOverlay.tsx` | Bottom text overlay | ✅ Inlined into ReelCard (component still exists but unused) |
| 17 | `app/components/MusicIndicator.tsx` | Tappable music chip — mute/unmute with speaker icon | ✅ Done |
| 18 | `app/components/ReelsFeed.tsx` | Feed container + IntersectionObserver + preloaded buffer | ✅ Done |
| 19 | `app/page.tsx` | Layout mode orchestration (Reels always-mounted + Graph) | ✅ Done |

### Phase 3: Interactions

| # | File | Task | Status |
|---|------|------|--------|
| 20 | `app/hooks/useLocalInteractions.ts` | localStorage for likes, bookmarks (useSyncExternalStore) | ✅ Done |
| 21 | `app/components/ActionBar.tsx` | Like, AI chat (with "AI" label in icon), bookmark, share | ✅ Done (mute button removed — moved to music chip) |
| 22 | `app/components/CommentSheet.tsx` | Bottom sheet for comments | ❌ Removed (replaced by AI chat sheet) |

### Phase 4: Prefetching & Polish

| # | File | Task | Status |
|---|------|------|--------|
| 23 | `app/hooks/useArticleBuffer.ts` | Preloaded buffer + live prefetch + stall fallback | ✅ Done |
| 24 | `app/hooks/useBackgroundMusic.ts` | Audio playback per reel, mute toggle | ✅ Done |
| 25 | `app/hooks/usePullToRefresh.ts` | Touch gesture handling | ✅ Done |
| 26 | `app/components/PullToRefresh.tsx` | Visual pull indicator | ✅ Done |

### Phase 5: Polish & Assets

| # | File | Task | Status |
|---|------|------|--------|
| 27 | `public/icons/` | SVG icons | ✅ Done (inline SVGs in components, no separate icon files) |
| 28 | All components | Animations, transitions | ✅ Done |
| 29 | All components | Error states, fallback handling | ✅ Partial (loading skeletons, fallback content, try/catch) |

### Phase 6: Network Exploration Mode (changed from 3D to 2D)

| # | File | Task | Status |
|---|------|------|--------|
| 30 | `app/components/LayoutToggle.tsx` | Reels ↔ Graph toggle (z-50 to float above graph) | ✅ Done |
| 31 | `app/components/NetworkLoader.tsx` | Loading animation | ✅ Done |
| 32 | `app/components/NetworkView.tsx` | **2D** force-directed graph with labeled nodes | ✅ Done (changed from 3D) |
| 33 | `app/hooks/useNetworkGraph.ts` | Fetch + cache graph data | ✅ Done |
| 34 | `app/page.tsx` | Layout mode + node-click → inject article into feed | ✅ Done |

### Phase 7: AI Q&A Chat

| # | File | Task | Status |
|---|------|------|--------|
| 35 | `app/api/chat/route.ts` | Streaming Gemini response + Google Search grounding | ✅ Done |
| 36 | `app/hooks/useAIChat.ts` | Per-article sessions + background full-article fetch | ✅ Done |
| 37 | `app/components/AIChatSheet.tsx` | 78vh bottom sheet + markdown rendering (bullets, bold, lists) | ✅ Done |
| 38 | `app/components/ActionBar.tsx` | AI chat opened via comment button (merged, no sparkle button) | ✅ Done |

---

## 19. Design System & Visual Specs

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#000000` | Feed background, network background |
| `--text-primary` | `#FFFFFF` | Titles, primary text |
| `--text-secondary` | `rgba(255,255,255,0.7)` | Summary text |
| `--accent-like` | `#FF3040` | Active like (heart) |
| `--accent-chip` | `rgba(255,255,255,0.15)` | Wiki chip background |
| `--accent-chip-hover` | `rgba(255,255,255,0.25)` | Wiki chip hover |
| `--overlay-gradient` | `linear-gradient(transparent, rgba(0,0,0,0.8))` | Bottom text overlay |
| `--action-bg` | `rgba(255,255,255,0.1)` | Action button background |
| `--sheet-bg` | `#1C1C1E` | Comment sheet background |
| `--node-center` | `#FF6B35` | Center node in network graph |
| `--node-linked` | `#4ECDC4` | Linked article nodes in network graph |
| `--node-hover` | `#FFE66D` | Node hover state in network graph |
| `--edge-default` | `rgba(255,255,255,0.15)` | Graph edge color |
| `--toggle-active` | `#4ECDC4` | Active toggle background |
| `--ai-bubble` | `#1C1C1E` | AI chat message bubble background |
| `--user-bubble` | `#4ECDC4` | User chat message bubble background |
| `--ai-sparkle` | `#FFD700` | Sparkle button glow / accent |
| `--ai-streaming` | `rgba(255,215,0,0.6)` | Streaming cursor color |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Article title | Geist Sans | 20px | 700 (bold) |
| Summary text | Geist Sans | 14px | 400 (regular) |
| Action count | Geist Sans | 12px | 600 (semibold) |
| Comment text | Geist Sans | 14px | 400 |
| Wiki chip | Geist Sans | 13px | 500 (medium) |
| AI chat message | Geist Sans | 14px | 400 (regular) |
| AI chat header | Geist Sans | 16px | 600 (semibold) |
| AI chat input | Geist Sans | 14px | 400 |

### Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Ken Burns motion | varies per preset (see §9) | 18-25s | ease-in-out, infinite alternate |
| Like heart | Scale 1 → 1.3 → 1 | 300ms | ease-out |
| Like double-tap | Large heart overlay, fade+scale | 800ms | ease-out |
| Action button press | Scale 0.9 → 1 | 150ms | ease-out |
| Comment sheet open | translateY(100%) → 0 | 300ms | cubic-bezier(0.32, 0.72, 0, 1) |
| Pull-to-refresh spinner | rotate 360° | 1000ms | linear (infinite) |
| Music disc spin | rotate 360° | 3s | linear (infinite) |
| Reel card enter | opacity 0 → 1 | 200ms | ease-in |
| Skeleton shimmer | translateX(-100% → 100%) | 1.5s | linear (infinite) |
| Layout mode transition | fade crossfade between Reels ↔ Network | 400ms | ease-in-out |
| Network loader dots | pulsing connected dots animation | 1.5s | ease-in-out, infinite |
| Node hover glow | scale 1 → 1.3 + bloom | 200ms | ease-out |
| AI chat sheet open | translateY(100%) → 0 (same as CommentSheet) | 300ms | cubic-bezier(0.32, 0.72, 0, 1) |
| AI streaming cursor | pulsing `▊` opacity 0.3 → 1 | 800ms | ease-in-out, infinite |
| AI sparkle button | subtle golden glow pulse | 2s | ease-in-out, infinite |
| AI message appear | fadeIn + translateY(8px → 0) | 200ms | ease-out |

### Responsive Design

This is a **mobile-first** app. The layout is designed for phones.

| Breakpoint | Behavior |
|---|---|
| < 768px (phones) | Full-width, full-height — the primary experience |
| ≥ 768px (tablet/desktop) | Center the feed in a max-width container (430px) with dark side margins — mimics phone frame |

```css
/* Desktop: centered phone-width column */
@media (min-width: 768px) {
  .reels-feed {
    max-width: 430px;
    margin: 0 auto;
    border-left: 1px solid rgba(255,255,255,0.1);
    border-right: 1px solid rgba(255,255,255,0.1);
  }
}
```

---

## 20. Edge Cases & Error Handling

### Wikipedia API

| Scenario | Handling |
|----------|----------|
| API returns 429 (rate limit) | Retry with exponential backoff (1s → 2s → 4s) |
| Article has no image | Skip, fetch another (already handled in `fetchRandomArticle`) |
| Article is disambiguation page | Skip (`type !== 'standard'`) |
| API is completely down | Show error state: "Wikipedia sedang tidak tersedia" with retry button |
| Image URL fails to load | Show a dark gradient placeholder with article title only |

### Gemini API

| Scenario | Handling |
|----------|----------|
| API returns error | Default to `false` (reject article — safety-first) |
| API is down | Fallback: skip moderation, show all articles with images (degrade gracefully) |
| API rate limit | Queue requests, add delay between batches |
| Response is not "TRUE"/"FALSE" | Treat as `false` (reject) |

### Client-side

| Scenario | Handling |
|----------|----------|
| No articles available yet | Show `<LoadingReel>` skeleton |
| All fetched articles were rejected | Show "Mencari konten..." loading with auto-retry |
| localStorage full | Show warning toast, continue without saving |
| Incognito mode | Wrap localStorage calls in try/catch, degrade gracefully |
| Slow network | Show skeleton loading, don't block scroll for already-loaded articles |
| User scrolls very fast | Buffer ensures 3+ articles ahead; if exhausted, show loading skeleton at bottom |

### Jamendo API

| Scenario | Handling |
|----------|----------|
| API returns error | Return empty tracks array; reels work without music |
| API rate limit | Cache track list aggressively (1 hour server-side) |
| Audio fails to play (autoplay blocked) | Show "Tap to play music" prompt; resume on first interaction |
| Track URL 404 | Skip to next track in the list |
| All tracks exhausted | Loop back to beginning of track list |

### Audio Playback

| Scenario | Handling |
|----------|----------|
| Browser blocks autoplay | Set audio as muted initially; play on first user interaction; show visual hint |
| User scrolls while music playing | Pause current track, start new track for new reel |
| User scrolls back to previous reel | Resume that reel's track from where it left off (if still in memory) |
| User toggles mute | Persist mute state in localStorage; respect across scroll |

### Network Mode

| Scenario | Handling |
|----------|----------|
| Article has 0 internal links | Show message: "Artikel ini tidak memiliki tautan" with button to go back to Reels |
| Article has 200+ links | Cap at 40 nodes for performance; show "+ 160 more" indicator |
| Links API returns error | Show error state with retry button; allow fallback to Reels |
| Node clicked but summary fetch fails | Open the article's Wikipedia URL in a new tab as fallback |
| 3D rendering too slow on device | Detect low frame rate; suggest switching back to Reels mode |
| User rapidly toggles layout | Debounce the toggle (300ms) to prevent flickering |
| User toggles to Network with no article loaded | Disabled state — toggle only active when an article is visible |

### AI Q&A Chat

| Scenario | Handling |
|----------|----------|
| Gemini returns error | Show inline error message: "Gagal mendapat jawaban. Coba lagi." + retry button |
| Gemini rate limit | Queue request, show "Mohon tunggu sebentar..." |
| Streaming interrupted mid-response | Show partial response + "(terputus)" indicator + retry button |
| User sends empty message | Disable send button when input is empty |
| User sends very long message | Truncate to 500 characters with character counter |
| System prompt too large (very long article) | Truncate article extract to first 4000 characters for system prompt |
| User opens chat before article loads | Sparkle button disabled/hidden until article data is available |
| User rapid-fires messages | Disable input while streaming; re-enable when response complete |
| User scrolls to new article while chat is open | Auto-close the chat sheet, start fresh session on next open |
| Conversation gets very long (20+ messages) | Trim oldest messages from the context window, keep last 10 |

---

## 21. API Keys Required

Here is a summary of all API keys needed to run this project:

| Key | Required? | Cost | Where to get it | What it does |
|-----|-----------|------|-----------------|---------------|
| `GEMINI_API_KEY` | ✅ Yes | Free tier available (15 RPM, 1M tokens/day) | [Google AI Studio](https://aistudio.google.com/apikey) | AI Q&A chat only (uses `gemini-2.5-flash`; content moderation skipped) |
| `JAMENDO_CLIENT_ID` | ✅ Yes | Free | [Jamendo Developer Portal](https://devportal.jamendo.com/) — sign up → create app → get client ID | Background music — streams chill Creative Commons tracks |

**Not required:**
- Wikipedia API — **no key needed** (just requires `Api-User-Agent` header)
- No database credentials
- No auth provider keys

### `.env.local` file

```bash
# Content moderation (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Background music (Jamendo)
JAMENDO_CLIENT_ID=your_jamendo_client_id_here
```

### Vercel Environment Variables

Set these same two variables in **Vercel Dashboard → Project Settings → Environment Variables** before deploying.

---

> **Implementation order recommendation:** Start with Phase 1 (foundation) and Phase 2 (core UI) to get the basic feed working. Then add interactions (Phase 3) and prefetching polish (Phase 4) incrementally. This way you'll have a working prototype at each phase.

> **Implementation note:** All 7 phases have been completed. See the status tables above for per-file completion status and the deviations table at the top for differences between the original plan and the actual implementation.

---

*Last updated: 2026-03-11*
