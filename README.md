# Good Reels

> Instagram Reels-style UI for exploring random Wikipedia articles in Bahasa Indonesia and English.

Swipe through full-screen article cards with cinematic Ken Burns image effects, background music, and AI-powered Q&A — all in a mobile-first vertical feed. You can toggle seamlessly between Indonesian and English content.

## Features

- **Vertical scroll feed** — CSS Scroll Snap for native reel-snapping, each card is 100dvh
- **Bilingual Experience** — Toggle seamlessly between Bahasa Indonesia and English. Content is dynamically re-fetched or hot-swapped via Wikipedia's language linking.
- **Instant load** — 100 preloaded articles bundled as JSON (for both ID and EN); shown in random order on first open with zero wait time
- **Ken Burns motion** — 8 cinematic pan/zoom presets applied via CSS animations on each reel's background image
- **CSS filters** — 10 color-grading presets (warm, cool, vivid, vintage, etc.) for visual variety
- **Variety engine** — guarantees no two adjacent reels share the same motion, filter, or music track
- **Background music** — chill tracks from Jamendo API with bundled fallback; tap the music chip to mute/unmute
- **AI Q&A chat** — ask questions about any article; powered by Gemini 2.5 Flash with full article context, Google Search grounding, and streaming responses; markdown rendering in chat bubbles
- **2D network graph** — visualize Wikipedia hyperlinks as an interactive force-directed graph; tap a node to open that article as a reel
- **Expandable captions** — tap truncated summary to expand full text (Instagram-style); tap again to collapse
- **Engagement** — like, bookmark, and share; all persisted in localStorage
- **Pull-to-refresh** — elastic pull gesture at the top of the feed
- **State preservation** — scroll position and article buffer persist when switching between Reels and Graph views

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Gemini 2.5 Flash via `@google/genai` |
| Graph | `react-force-graph-2d` |
| Music | Jamendo API (Creative Commons) |
| Content | Wikipedia Bahasa Indonesia REST API |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- API keys for Gemini and Jamendo (see below)

### Install & Run

```bash
npm install
cp env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API Keys

| Key | Where to get it |
|-----|-----------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) (free tier available) |
| `JAMENDO_CLIENT_ID` | [Jamendo Developer Portal](https://devportal.jamendo.com/) (free) |

Wikipedia API requires no key — just an `Api-User-Agent` header.

### Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
node scripts/scrape-articles.mjs   # Re-scrape 100 preloaded Indonesian articles
node scripts/translate-preloaded.mjs # Cross-reference and generate English counterparts
```

## Project Structure

```
app/
├── api/
│   ├── articles/route.ts    # Fetch random Wikipedia articles
│   ├── tracks/route.ts      # Fetch Jamendo music tracks
│   ├── links/route.ts       # Extract Wikipedia article hyperlinks
│   └── chat/route.ts        # Gemini streaming AI chat
├── components/
│   ├── ReelsFeed.tsx         # Main feed container (scroll-snap host)
│   ├── ReelCard.tsx          # Full-screen article card with expandable caption
│   ├── ActionBar.tsx         # Right-side action buttons (like, AI chat, bookmark, share)
│   ├── AIChatSheet.tsx       # AI chat bottom sheet with markdown rendering
│   ├── MusicIndicator.tsx    # Tappable music chip (mute/unmute)
│   ├── NetworkView.tsx       # 2D force-directed graph
│   ├── LayoutToggle.tsx      # Reels / Graph mode toggle
│   ├── PullToRefresh.tsx     # Pull-to-refresh indicator
│   ├── LoadingReel.tsx       # Skeleton loading placeholder
│   └── NetworkLoader.tsx     # Graph loading animation
├── hooks/
│   ├── useArticleBuffer.ts   # Preloaded + live article buffer with prefetch
│   ├── useBackgroundMusic.ts # Audio playback per reel
│   ├── useAIChat.ts          # Chat sessions with background full-article fetch
│   ├── useLocalInteractions.ts # localStorage for likes, bookmarks
│   ├── useNetworkGraph.ts    # Graph data fetch + cache
│   └── usePullToRefresh.ts   # Touch gesture handling
├── lib/
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── wikipedia.ts          # Wikipedia API client
│   ├── gemini.ts             # Gemini moderation client
│   ├── jamendo.ts            # Jamendo API client
│   ├── variety.ts            # Motion/filter/track assignment engine
│   ├── fallback-tracks.ts    # Bundled fallback music tracks
│   ├── preloaded-articles.json # 100 pre-scraped Indonesian articles
│   └── preloaded-articles-en.json # 100 pre-scraped English counterparts
├── globals.css               # Scroll-snap, Ken Burns keyframes, animations
├── layout.tsx                # Root layout
└── page.tsx                  # Main page (Reels + Graph mode orchestration)
```

## Architecture Decisions

- **Preloaded content** — 100 articles bundled at build time for instant first load for both ID and EN languages; live Wikipedia articles fetched in the background and appended seamlessly
- **Bilingual State Synchronization** — Uses cross-referenced ID mapping from `preloaded-articles-en.json` to accomplish sub-millisecond hot-swapping between preloaded Indonesian and English articles instantly. Dynamic Wikipedia items gracefully fallback to recursive individual API translation requests on the fly.
- **No content moderation** — Gemini moderation skipped for faster load times; articles are served directly from Wikipedia
- **Thumbnail images** — low-res thumbnails used instead of full-resolution originals for faster rendering
- **CSS-only visual effects** — Ken Burns motion and image filters are pure CSS animations (GPU-composited, zero JS overhead)
- **Always-mounted Reels** — `ReelsFeed` stays mounted (hidden via CSS) when switching to Graph view, preserving scroll position and state
- **Background article fetch for AI** — `useAIChat` eagerly fetches the full Wikipedia article text via MediaWiki API and caches it; user can type immediately while fetch completes
- **2D graph** — switched from 3D to 2D (`react-force-graph-2d`) for better label readability and simpler interaction

## Documentation

See [`docs/dev_plan.md`](docs/dev_plan.md) for the full implementation plan with status annotations.
