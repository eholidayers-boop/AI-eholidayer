# eHolidayer AI-Native Foundation — Design Spec

**Status:** Approved
**Date:** 2026-09-06
**Sub-project:** 1 of 5 (Foundation)
**Author:** Brainstorming session with the user

This spec defines the **foundation** sub-project for transforming eHolidayer from a traditional Joomla-based OTA into an AI-native travel platform. It covers system overview, AI orchestration, inventory access, conversation state, auth, hosting, design system, analytics, security, performance, SEO, implementation roadmap, testing, and acceptance criteria. Booking, recommendations, hotelier AI, and hardening are deliberately out of scope (handled in sub-projects 2–5).

---

## 1. Context & Goals

### 1.1 The transformation

**OLD OTA:** Search → Filters → Hundreds of choices → Confusion → Comparison → Booking

**eHOLIDAYER:** Tell us → We understand → We narrow it down → We explain → You decide → We help you book

### 1.2 Why now

eHolidayer currently runs on a legacy Joomla/Elxis stack (PHP, custom components, MySQL). It works as a classic OTA: destination → dates → guests → filters → list → hotel page → booking. The product vision in `eHolidayer_Prompt.md` calls for a fundamentally different product — an AI-native experience where a conversational travel assistant is the primary UI.

### 1.3 Scope of this spec

**In scope:** Next.js app, API gateway to legacy inventory, AI orchestration layer, design system, AI-native homepage, conversational search, 1–3 SEO-safe destination pages. **No booking yet.**

**Out of scope:** Booking flow (sub-project 3), match score + explanations (sub-project 2), hotelier AI (sub-project 4), my trips (sub-project 3), full SEO bridge (sub-project 5), payment integration (sub-project 3), multilingual UI (foundation ships English only).

### 1.4 Decomposition

The full transformation is too large for one spec. It is decomposed into 5 sub-projects:

| # | Sub-project | Depends on |
|---|---|---|
| 1 | Foundation (this spec) | — |
| 2 | Recommendations + Hotel Detail | Foundation |
| 3 | AI Booking Flow | Foundation |
| 4 | Hotelier AI | Foundation |
| 5 | Hardening + Migration | All above |

---

## 2. System Overview

### 2.1 Architecture diagram

```
Browser (User)
     │
     │ HTTPS
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│   Next.js 15 App (Vercel) — app.eholidayer.com                       │
│                                                                       │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  UI Layer (React Server + Client Components)                │    │
│   │   • AI-native homepage / hero conversational input          │    │
│   │   • AI Chat Panel (sticky, persistent across pages)         │    │
│   │   • Hotel card / Search results / Match score badge         │    │
│   │   • Destination landing pages (SEO-safe, prerendered)       │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  API Routes (Next.js Route Handlers)                         │    │
│   │   • POST /api/ai/converse      — main conversational loop   │    │
│   │   • POST /api/ai/tool/*        — tool callbacks             │    │
│   │   • GET  /api/hotels           — search / list               │    │
│   │   • GET  /api/hotels/[id]      — hotel detail                 │    │
│   │   • GET  /api/destinations     — destinations                 │    │
│   │   • POST /api/auth/*           — NextAuth handlers            │    │
│   │   • GET  /api/session/[id]     — conversation state           │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  AI Orchestration Layer                                      │    │
│   │   • AnthropicProvider | MockProvider  (env-flag swap)        │    │
│   │   • Intent extraction (Claude Sonnet 5)                       │    │
│   │   • Tool-use loop (max 5 tool calls per turn)                 │    │
│   │   • Prompt templates + system prompt builder                  │    │
│   │   • Response streaming (server-sent events)                   │    │
│   │   • Tool handler registry (typed schemas)                     │    │
│   └────────────────────────────────────────────────────────────┘    │
└───────────────────┬──────────────────────────┬───────────────────────┘
                    │                          │
                    ▼                          ▼
       ┌────────────────────────┐  ┌────────────────────────────┐
       │ Vercel KV (Redis)       │  │ Vercel KV (cache)           │
       │ • conversation sessions │  │ • hotel list cache          │
       │ • user preferences       │  │ • destination cache         │
       │ • search context        │  │ • reviews cache             │
       └────────────────────────┘  └────────────────────────────┘
                    │
                    ▼
       ┌────────────────────────────────────────────────────────────┐
       │  Internal API Client (typed, timeouts, retries)              │
       │    Calls legacy REST shim over HTTPS                          │
       └────────────────────────┬────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│   Legacy Joomla/Elxis (eholidayer.com)                                │
│                                                                       │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  New component: com_api  (REST endpoints)                    │    │
│   │   • GET  /api/v1/hotels                list + filters        │    │
│   │   • GET  /api/v1/hotels/{id}           hotel detail           │    │
│   │   • GET  /api/v1/hotels/{id}/rooms     room options           │    │
│   │   • GET  /api/v1/availability          availability search    │    │
│   │   • GET  /api/v1/reviews               reviews list           │    │
│   │   • GET  /api/v1/destinations          destinations list      │    │
│   │   • POST /api/v1/auth/login            JWT issue              │    │
│   └────────────────────────┬───────────────────────────────────────┘
│                            ▼
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  Existing com_search, com_reservations, com_user (read-only)  │    │
│   └────────────────────────┬───────────────────────────────────────┘
└────────────────────────────┼──────────────────────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │  MySQL  (u877005002_eh...)    │
              │   elx_res_hotels              │
              │   elx_res_rooms               │
              │   elx_res_reservations        │
              │   elx_res_reviews             │
              │   elx_users                   │
              └──────────────────────────────┘
```

### 2.2 Five guiding principles

1. **AI never touches the database directly.** All inventory reads go through the typed internal client → Joomla REST shim → existing Joomla components. This is the security boundary from prompt section 33.
2. **AI queries are tool calls, not free-text.** The LLM only emits structured tool calls (`search_hotels(args)`) — it never sees raw SQL, never invents prices, never fabricates availability.
3. **Conversations are server-side, stateful.** Stateless Next.js, stateful Vercel KV. Every conversation is resumable across devices and pages.
4. **Legacy is the system of record for everything transactional.** Bookings, payments, auth — all stay in Joomla/MySQL. We add the REST shim; we don't replace the storage layer.
5. **Mock provider is a first-class citizen.** Same interface as Anthropic. Tests, offline demos, and CI use the mock; production uses Anthropic. Switch via env var.

---

## 3. AI Orchestration Layer

### 3.1 Provider abstraction

```ts
// lib/ai/provider.ts
export interface AIProvider {
  chat(params: ChatParams): AsyncIterable<StreamChunk>;
  extractIntent(message: string, ctx: ConversationContext): Promise<Intent>;
  rank(hotels: Hotel[], prefs: Preferences): Promise<RankedHotel[]>;
  explain(hotel: Hotel, prefs: Preferences): Promise<string>;
  summarizeReviews(reviews: Review[]): Promise<string>;
}

export type ChatParams = {
  systemPrompt: string;
  messages: Message[];
  tools: ToolDefinition[];
  toolResults?: ToolResult[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
};
```

Two implementations:

- **`AnthropicProvider`** — calls `@anthropic-ai/sdk`. Uses `claude-sonnet-5` for chat, intent extraction, explanations. Uses `claude-haiku-4-5` for ranking and review summarization (cheaper, faster).
- **`MockProvider`** — deterministic regex/heuristic intent extraction, scripted chat responses keyed by message content, deterministic ranking. Used for tests, offline demos, CI.

Selected by env var `AI_PROVIDER=anthropic|mock`.

### 3.2 Tool-use architecture

LLM emits structured tool calls; tool handlers execute them; results feed back into the next turn. **Max 5 tool calls per conversation turn** (prevents runaway cost and loops).

```ts
// lib/ai/tools/index.ts
export const tools: ToolDefinition[] = [
  searchHotels,        // { destination?, dates?, guests?, budget?, category?, softPrefs }
  getHotelDetails,     // { hotelId }
  getRoomOptions,      // { hotelId, dates?, guests? }
  getRates,            // { hotelId, checkIn, checkOut, guests }
  getAvailability,     // { destination, checkIn, checkOut, guests }
  getDestinationInfo,  // { destinationId }
  getUserProfile,      // (no args — uses session)
];
```

Each tool has a **Zod schema** (input validation), a **typed handler**, and an **AI-readable description** that the LLM sees as part of its tool surface.

The handler calls the internal API client → legacy REST shim → Joomla component → MySQL. AI never sees raw DB results; we map them to a clean, stable shape before returning.

### 3.3 Intent extraction

Each user message goes through `extractIntent()` first — a separate structured LLM call (Haiku 4.5, cheaper):

```ts
type Intent = {
  destination?: string;        // normalized to destination ID
  dates?: { checkIn: string; checkOut: string };
  guests?: { adults: number; children: number; rooms: number };
  budget?: { amount: number; currency: string };
  category?: number;           // star rating
  amenities?: string[];
  softPreferences?: {
    beach?: number;            // 0-1 importance
    cleanliness?: number;
    food?: number;
    luxury?: number;
    romantic?: number;
    quietness?: number;
    nightlife?: number;
    familyFriendly?: number;
    business?: number;
  };
  context?: 'family' | 'couple' | 'business' | 'solo' | 'group';
  refinementType?: 'cheaper' | 'upgrade' | 'different' | 'moreOfX' | 'lessOfX';
  needsMoreInfo?: string[];    // e.g. ['dates', 'budget']
};
```

Intent merges into the conversation's running `extractedPreferences` (never loses info).

### 3.4 Conversation state

Stored in Vercel KV, keyed by `sessionId` (UUID, 30-day TTL):

```ts
type ConversationState = {
  sessionId: string;
  userId?: string;
  messages: Message[];
  extractedPreferences: Intent;
  searchContext: {
    lastQuery: Intent;
    lastResults: RankedHotel[];
    viewedHotels: string[];
    comparedHotels: string[];
  };
  createdAt: string;
  updatedAt: string;
};
```

The AI's system prompt is rebuilt from this state every turn — it has full memory of the conversation, the user's extracted preferences, and previous results.

### 3.5 Response streaming

`/api/ai/converse` returns a **server-sent events** stream:

1. `thinking` — AI processing
2. `tool_call` — tool invocation
3. `tool_result` — what came back
4. `text` — AI's spoken response chunks
5. `hotels` — rendered hotel cards (UI-layer data, not AI text)
6. `followup` — suggested next question
7. `done` — turn complete

The UI renders AI text in the chat panel and hotel cards inline in the same view (matches prompt section 27: conversation + visual decision-making, not chat window + links).

### 3.6 Prompt engineering

System prompt is composed dynamically:

```
You are eHolidayer AI, a personal travel advisor...

## User preferences extracted from this conversation:
{extractedPreferences}

## Current search context:
{lastQuery}, {lastResults.length} hotels found, top: {topHotel.name} ({topHotel.matchScore}%)

## Conversation history:
{messages}

## Tool guide:
{tools as AI-readable descriptions}

## Style guide:
- Be concise, confident, conversational
- Never invent prices, availability, or hotel facts
- Always cite specific hotel names, ratings, and numbers
- If you recommend a hotel, explain why in 3-5 short bullets
- Never exceed 3 sentences per turn unless explaining a recommendation
- If info is missing, ask only one question at a time
```

### 3.7 Cost guardrails

- Max 5 tool calls per turn.
- Max ~1500 input tokens per turn (system + history compression).
- Per-session token budget (configurable; default 50k tokens/day).
- Conversation summarization when history exceeds 30 messages (older messages compressed by Haiku 4.5).
- All AI calls logged with token counts for cost tracking.

---

## 4. Inventory Access & Legacy REST Shim

### 4.1 New component: `com_api` (lives in legacy Joomla)

Sits inside the existing Joomla app at `components/com_api/`. Exposes ~7 read endpoints under `/api/v1/*`. JWT-protected via a shared `API_TOKEN` env (Next.js → legacy; legacy never calls Next.js).

**Endpoints:**

| Endpoint | Purpose | Returns |
|---|---|---|
| `GET /api/v1/hotels` | List/search hotels with filters | `{ hotels: Hotel[], total: number, page: number }` |
| `GET /api/v1/hotels/{id}` | Hotel detail | `{ hotel: HotelDetail }` |
| `GET /api/v1/hotels/{id}/rooms` | Room options for hotel | `{ rooms: RoomOption[] }` |
| `GET /api/v1/availability` | Availability + rates for dates | `{ hotels: AvailabilityResult[] }` |
| `GET /api/v1/reviews` | Reviews (filter by hotel, dest, rating) | `{ reviews: Review[] }` |
| `GET /api/v1/destinations` | All destinations/cities | `{ destinations: Destination[] }` |
| `POST /api/v1/auth/login` | Validate user, issue legacy session token | `{ token: string, user: User }` |

Each handler:
1. Reads from `elx_res_*` tables via existing Joomla DB layer (preserves currency conversion, multilingual text, permissions).
2. Maps to a **stable JSON shape** (`Hotel`, `HotelDetail`, `RoomOption`, `AvailabilityResult`, `Review`, `Destination`, `User`).
3. Returns clean JSON. No HTML, no Joomla conventions leaked.

### 4.2 Stable data shapes

```ts
type Hotel = {
  id: string;
  slug: string;
  name: string;
  destination: { id: string; name: string; country: string };
  category: number;              // star rating
  rating: number;                // 0-10 aggregate score
  reviewCount: number;
  priceFrom: { amount: number; currency: string };
  thumbnail: string;             // CDN URL
  amenities: string[];
  beachDistance?: number;        // meters
};

type HotelDetail extends Hotel {
  description: string;           // plain text, sanitized
  photos: string[];
  rooms: RoomOption[];
  reviews: { rating: number; count: number; recent: Review[] };
  location: { lat: number; lng: number; address: string };
  policies: { cancellation: string; checkIn: string; checkOut: string };
};

type RoomOption = {
  id: string;
  name: string;
  capacity: { adults: number; children: number };
  boardType: 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  refundable: boolean;
  cancellationDeadline?: string;
  price: { amount: number; currency: string };
};
```

### 4.3 Internal API client (Next.js side)

```ts
// lib/inventory/client.ts
export class InventoryClient {
  constructor(private baseUrl: string, private apiToken: string) {}

  async searchHotels(query: SearchQuery): Promise<{ hotels: Hotel[]; total: number }>;
  async getHotelDetails(hotelId: string): Promise<HotelDetail>;
  async getRoomOptions(hotelId: string, dates?: DateRange, guests?: Guests): Promise<RoomOption[]>;
  async getAvailability(query: AvailabilityQuery): Promise<AvailabilityResult[]>;
  async getReviews(filter: ReviewFilter): Promise<Review[]>;
  async getDestinations(): Promise<Destination[]>;
  async login(email: string, password: string): Promise<{ token: string; user: User }>;
}
```

- **Timeout:** 3s for searches, 2s for detail/reviews
- **Retries:** 2 with exponential backoff for transient 5xx
- **Caching:** Hotel list 5min, hotel detail 10min, destinations 1h (Vercel KV)
- **Rate limit:** Per-IP via Vercel middleware

### 4.4 What we DON'T do in v1

- **No write endpoints in `com_api`** — bookings stay in Joomla's existing reservation flow. Booking write API is Phase 3 work.
- **No direct DB reads from Next.js** — even at the cost of one extra hop.
- **No shimming legacy auth** — `POST /api/v1/auth/login` returns a token Next.js can use, but the legacy session cookie still exists. We're adding, not replacing.

---

## 5. Conversation State, Auth, Hosting

### 5.1 Conversation state (Vercel KV)

- **Key:** `session:{sessionId}`
- **Value:** JSON-encoded `ConversationState` (see §3.4)
- **TTL:** 30 days (configurable)
- **Compression:** When `messages.length > 30`, summarize older messages into a single `summary` field via Haiku 4.5. Recent 30 kept verbatim.
- **Cleanup:** Sessions auto-expire (TTL). Inactive sessions (no activity for 7 days) flagged for archival — summary kept, message history dropped.

**State transitions per turn:**
1. Load `ConversationState` from KV by `sessionId`
2. Append user message
3. Run `extractIntent()` (Haiku 4.5)
4. Merge into `extractedPreferences`
5. Build system prompt from state
6. Run main chat turn (Sonnet 5) — may invoke tools
7. Append AI response
8. Save updated state

**Session creation:**
- New visitor → anonymous UUID session, stored in HTTP-only cookie `eh_session`
- Logged-in user → `sessionId` bound to `userId`; same `sessionId` can resume from any device

### 5.2 Authentication bridge

NextAuth.js (Auth.js v5) with credentials provider.

```
User → Next.js login form → NextAuth credentials provider │
                              ▼ POST /api/v1/auth/login (legacy shim)
                              │
                              ▼
                Validates email/password against elx_users
                              │
                              ▼
                Returns { token, user }
                              │
                              ▼
                NextAuth issues JWT (1h TTL, httpOnly cookie)
```

JWT contains:
- `userId`
- `email`
- `role` (user / hotelier / admin — derived from `elx_users` table)
- `legacyToken` (used by Next.js API routes to call back into legacy on user's behalf)

**Guest mode:** Default for new visitors. No login required for browsing/searching. Login only required for booking, My Trips, saving preferences.

**Logout:** Clears NextAuth cookie + invalidates legacy session via existing Joomla logout endpoint.

### 5.3 Hosting

```
┌─────────────────────────────┐    ┌───────────────────────────┐
│  Vercel (app.eholidayer.com) │    │  Existing shared host (eholidayer.com) │
│  • Next.js 15 (App Router)   │    │  • Joomla / Elxis                │
│  • Route handlers            │    │  • MySQL                        │
│  • Edge middleware           │    │  • Existing user-facing site    │
│  • Vercel KV (Redis)         │    │                               │
│  • Vercel Analytics          │    │                               │
└─────────────────────────────┘    └───────────────────────────┘
```

**DNS plan:**
- `www.eholidayer.com` → existing legacy site (unchanged in Phase 1)
- `app.eholidayer.com` (or `ai.eholidayer.com`) → new Next.js app
- Future Phase 5: gradually move SEO pages over (destination pages first; homepage last)

**Cross-origin:** Next.js calls legacy via `https://www.eholidayer.com/api/v1/*` with the `API_TOKEN` header. Legacy doesn't call Next.js. Simple, one-way.

**CORS allowlist** on the legacy shim: only `https://app.eholidayer.com` (and Vercel preview URLs for staging).

**Secrets (all in Vercel env vars, server-side only):**
- `ANTHROPIC_API_KEY`
- `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`
- `LEGACY_API_BASE_URL`, `LEGACY_API_TOKEN`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### 5.4 Edge cases

| Case | Behavior |
|---|---|
| Session expired mid-conversation | Re-prompt user to start new session; preserve user message context |
| Legacy shim unavailable | Graceful fallback to cached results + "limited mode" indicator in chat |
| Anthropic API rate limit | Queue user message, show "AI is busy, hold on" state, retry with backoff |
| Tool handler throws | Log error, return safe message to AI ("Hotel details temporarily unavailable, here are other results"), continue conversation |
| Mock provider in prod | Refused at startup unless `ALLOW_MOCK_PROVIDER=true` (safety rail) |

---

## 6. Design System & AI-Native Homepage

### 6.1 Brand direction

Refined editorial travel aesthetic. **AI + Travel + Trust + Premium.**

Avoid generic AI tropes: no neon gradients, no excessive glassmorphism, no glowing borders, no robot imagery.

**Tone cues:**
- Strong typography (serif for display, sans for UI)
- Generous whitespace
- Excellent hotel photography (hero is the photo, not the chrome)
- Subtle motion only (one thing animates at a time)
- Restrained accent color
- Feels expensive, intelligent, calm

### 6.2 Color tokens

Light theme:
```
--color-bg:           #FBFAF7     /* warm off-white, travel-magazine ground */
--color-bg-subtle:    #F4F1EA
--color-fg:           #1A1814     /* near-black, warm */
--color-fg-muted:     #5C574D
--color-border:       #E5E0D6
--color-accent:       #2F5D50     /* deep teal — premium, calm */
--color-accent-soft:  #E8F0ED
--color-warn:         #C97A3D
--color-error:        #B0413E
--color-success:      #3F7D5C
```

Dark theme:
```
--color-bg:           #15130F
--color-bg-subtle:    #1F1C16
--color-fg:           #F4F1EA
--color-fg-muted:     #9A938A
--color-border:       #2D2924
--color-accent:       #5FA08C
--color-accent-soft:  #1E2E29
--color-warn:         #D88B4E
--color-error:        #D6625F
--color-success:      #5FA07C
```

Theme tokens layered so light/dark + user toggle + system preference all read correctly.

### 6.3 Typography

```
Display:  Fraunces (variable serif, optical sizing)        /* headlines */
UI:       Inter (variable sans, all weights)                /* body, UI */
Mono:     JetBrains Mono                                   /* prices, codes */
Sizes:    12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64
Line heights: tight (1.15) for display, comfortable (1.55) for body
```

### 6.4 Spacing & layout

- 4px base unit (Tailwind default)
- Page max-width: 1200px for content, 1400px for hero
- Mobile-first; breakpoints at 640/768/1024/1280

### 6.5 Primitives (`components/ui/`)

| Component | Variants | Notes |
|---|---|---|
| `Button` | primary \| secondary \| ghost \| destructive; sizes sm/md/lg | States: default/hover/active/disabled/loading |
| `Input` | default \| search \| chat (auto-grow) | leadingIcon, trailingIcon, error, hint |
| `Card` | elevated \| bordered \| filled | — |
| `Badge` | matchScore \| status \| category; sm/md | — |
| `Sheet` | right-side slide-over (desktop), bottom sheet (mobile) | — |
| `Dialog` | modal | trap focus, escape closes |
| `Tabs` | accessible (arrow-key nav, roving tabindex) | — |
| `Avatar` | user / hotelier | — |
| `Skeleton` | loading placeholders | — |
| `Toast` | success/error | — |

### 6.6 Composites (`components/composite/`)

| Component | Purpose |
|---|---|
| `AIChatPanel` | Persistent right-side panel (desktop) / bottom sheet (mobile); message stream, tool-call indicators, inline hotel cards, suggested follow-ups; states minimized/expanded/fullscreen |
| `AIHeroInput` | Large conversational input for homepage hero; auto-grow, placeholder rotation (3 examples), animated submit arrow, loading pulse |
| `HotelCard` | Hotel result card; hero photo, name + destination, match score badge (sub-project 2), short AI summary (sub-project 2), price from, "Why this one?" expand, primary CTA |
| `MatchScoreBadge` | "94% Match" with subtle color (green 80+, amber 60–79, neutral <60); tooltip explains factors |
| `PriceBreakdown` | Itemized: rate, taxes, fees, total; expandable, accessible |
| `EmptyState` | No-results: friendly typography, AI-suggested refinement, "Search traditionally" fallback |
| `ConversationHistory` | Sidebar showing past sessions; "Continue previous trip" |

### 6.7 Homepage structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                                       │
│   eHolidayer logo            Explore  My Trips  Login  EN/USD │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  HERO (full-bleed, photo background, dark overlay)            │
│                                                               │
│      Tell me what kind of stay you're looking for.            │
│                                                               │
│      I'll find the hotels that fit you best.                  │
│                                                               │
│      ┌───────────────────────────────────────────────────┐    │
│      │  I'm going to Hurghada for 4 nights with...       │    │
│      │                                          [ Find →] │    │
│      └───────────────────────────────────────────────────┘    │
│                                                               │
│      Quick suggestions:                                       │
│      • "Romantic hotel in Paris"                              │
│      • "Family resort in Hurghada"                            │
│      • "Luxury in Dubai under $500"                           │
│      • "Quiet beach hotel"                                    │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  TRUST LAYER (4 small tiles)                                  │
│  Personalized recommendations · Transparent prices ·         │
│  Real hotel availability · Human support when you need it     │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  INSPIRATION (after AI submitted)                             │
│   Personalized hotels for you, based on your conversation    │
│   (3-6 hotel cards, AI-ranked)                                │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  SECONDARY CTA                                                │
│  "Prefer to search the traditional way?  [ Search hotels →]" │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  FOOTER (minimal: brand, legal, support, language)            │
└──────────────────────────────────────────────────────────────┘

         <AIChatPanel> (sticky right side, desktop)
                       (bottom sheet, mobile)
```

### 6.8 Responsive behavior

- **Desktop (≥1024px):** AI chat panel is a sticky right-side sheet (collapsible). Hero input centered, max-width 720px.
- **Tablet (768–1023px):** AI chat panel becomes bottom-anchored slide-up. Hero input full-width with side padding.
- **Mobile (<768px):** AI chat panel is a bottom sheet (default collapsed, swipe up to expand). Hero input sticky at top after scroll. Hotel cards stack. Match score badge top-right of card. Pricing inline below name.

### 6.9 Motion

- AI typing indicator: 3-dot pulse, 1s loop
- New chat message: subtle slide-up + fade-in (180ms)
- Hotel card hover: subtle image zoom (scale 1.03, 400ms ease-out)
- Page transitions: cross-fade (150ms)
- Match score reveal: count-up animation (800ms) — sub-project 2

All motion respects `prefers-reduced-motion: reduce`.

### 6.10 Accessibility

- Semantic HTML (`<header>`, `<main>`, `<nav>`, `<article>`, `<button>` not `<div>`)
- All interactive elements keyboard-navigable; visible focus rings (2px outline, accent color)
- Chat messages have `aria-live="polite"` for new AI responses
- Color contrast ≥4.5:1 for body text, ≥3:1 for large text
- Form inputs have associated `<label>`s; errors have `aria-describedby`
- Skip-to-content link for keyboard users
- Dialogs trap focus, restore on close
- Modal close button always visible

---

## 7. Analytics, Security, Performance

### 7.1 Analytics

**Client (Vercel Analytics + custom events):**
- AI conversation started
- Search intent captured (with extracted destination/dates/etc.)
- Search completed (tool calls made)
- Recommendations displayed
- Recommendation clicked
- Hotel details viewed
- Booking started (sub-project 3)
- Booking completed (sub-project 3)
- AI-assisted conversion rate (vs traditional search)
- Drop-off by step (sub-project 3)
- AI question frequency
- Search refinement frequency

**Server (Vercel Logs + KV):**
- Per-tool-call latency, success rate, error rate
- Per-`sessionId` token usage
- Anthropic API rate limit hits
- Legacy shim availability, latency, error rate
- Cache hit rate

**AI-specific (custom events):**
- `ai.intent.extracted` — log extracted Intent fields (anonymized)
- `ai.tool_invoked` — log tool name + duration
- `ai.provider_used` — log anthropic vs mock
- `ai.cost_estimate` — log input/output tokens per turn

All events PII-stripped. No chat content logged.

### 7.2 Security

**Threat model:**
- LLM producing harmful or misleading content
- LLM being tricked into bypassing booking validation (sub-project 3 risk)
- User injecting prompts to read other users' data
- Cross-site scripting in AI-generated text
- SSRF via AI-generated URLs
- Secrets leaked via prompt logs

**Controls:**

| Threat | Control |
|---|---|
| LLM hallucination | AI can only call typed tools; tools return validated data; never trust LLM-asserted prices |
| LLM bypassing validation | Booking writes (sub-project 3) happen via legacy endpoints with server-side re-validation; LLM never touches DB |
| Prompt injection | System prompt hardened against injection; tool args validated with Zod schemas; user-supplied strings never concatenated into system prompt |
| XSS | All AI text rendered with `DOMPurify`; React escapes by default; `dangerouslySetInnerHTML` only on sanitized content |
| SSRF | Legacy shim URL hardcoded in env var; LLM never sees URLs; no user-controlled URL fetching |
| Secret leakage | Prompts logged with secrets redacted; Vercel env vars server-side only; no client exposure |
| Auth bypass | Booking endpoints require valid JWT; legacy session validated on every privileged action |
| Cost DoS | Max 5 tool calls/turn, max tokens/turn, daily session budget; rate-limited at edge |

**Compliance:**
- GDPR: chat history deletable via `DELETE /api/session`
- Cookie consent: `eh_session` is functional (not analytics); consent banner shown for analytics
- Payment credentials (sub-project 3): never sent to AI; payment happens in iframe or hosted page

### 7.3 Performance

**Targets:** LCP < 1.5s, INP < 200ms, CLS < 0.1, TTFB < 600ms on cached pages.

**Strategies:**
- **Server Components by default** — only AI Chat Panel + Hero Input ship client JS
- **Streaming responses** — AI responses stream via SSE so perceived latency is low
- **Image optimization** — Next.js Image + Vercel CDN; lazy-load below-fold; AVIF/WebP fallback
- **Edge caching** — destination pages prerendered at build; ISR every 6h
- **Progressive loading** — homepage hero renders instantly; hotels load as AI returns them
- **Bundle splitting** — AI orchestration code stays on server; chat UI uses dynamic imports
- **KV caching** — hotel list 5min, hotel detail 10min, destinations 1h
- **Critical CSS** — minimal first-paint CSS; Fraunces + Inter preloaded

**Performance budget:**
- First-load JS for homepage: < 80KB gzipped
- LCP element: hero image or hero text, not chat panel
- Search-to-first-results latency: < 1.5s p50, < 3s p95

### 7.4 Monitoring & observability

- **Logs:** Vercel Logs (structured JSON)
- **Errors:** Sentry (sub-project 2+)
- **Uptime:** Vercel status + tiny `/api/health` endpoint that checks Vercel KV and legacy shim reachability
- **Cost dashboard:** Custom page showing per-day AI spend (from token logs)

### 7.5 SEO (foundation scope)

- 1–3 destination pages prerendered (e.g. `/destinations/hurghada`, `/destinations/dubai`, `/destinations/paris`)
- Schema.org `Hotel`, `BreadcrumbList`, `FAQPage` where appropriate
- Meta tags + Open Graph for social sharing
- `robots.txt`, `robots` meta on AI-generated chat pages (noindex)
- `sitemap.xml` generated from legacy + new content
- Canonical URLs pointing back to `www.eholidayer.com` for SEO equity in Phase 1
- Sub-project 5: full SEO bridge with redirects

---

## 8. Implementation Roadmap

Six milestones, each independently shippable to a preview URL.

### 8.1 M1 — Scaffold + design system (3 days)

- Next.js 15 + TypeScript + Tailwind + App Router scaffold
- Color tokens, typography, spacing, dark/light theme
- Primitives: `Button`, `Input`, `Card`, `Badge`, `Sheet`, `Skeleton`
- Empty homepage with header + hero (static, no AI yet)
- Vercel preview deploy

### 8.2 M2 — Legacy REST shim `com_api` (4 days)

- New Joomla component at `components/com_api/`
- 7 read endpoints implemented
- Stable TypeScript shapes (`Hotel`, `HotelDetail`, `RoomOption`, `Review`, `Destination`, `User`)
- Shared `API_TOKEN` auth between shim and Next.js
- Unit tests on PHP handlers
- `GET /api/v1/health` for Vercel monitoring

### 8.3 M3 — Internal API client + inventory pages (3 days)

- `lib/inventory/client.ts` typed client
- Caching (Vercel KV) for hotel list/detail/destinations
- 1 destination page prerendered (`/destinations/hurghada`) pulling real hotel data
- 1 hotel detail page (`/hotels/[slug]`) pulling real rooms + reviews
- Validates end-to-end legacy → Next.js data flow

### 8.4 M4 — AI orchestration layer (5 days)

- Provider abstraction (`AIProvider` interface)
- `AnthropicProvider` using `@anthropic-ai/sdk`
- `MockProvider` with deterministic scripted behavior
- Tool-use loop (max 5 calls/turn)
- 7 tools implemented with Zod schemas + handlers
- Intent extraction (Haiku 4.5)
- Conversation state in Vercel KV
- SSE streaming (`/api/ai/converse`)
- Unit + integration tests for the orchestration loop

### 8.5 M5 — AI-native homepage (4 days)

- Hero conversational input (`AIHeroInput`)
- AI Chat Panel (`AIChatPanel`) with sticky desktop + bottom-sheet mobile
- `HotelCard` composite, integrated with real hotel data
- Streaming UI: AI text, inline cards, suggested follow-ups
- `EmptyState` for no results
- Trust layer tiles
- "Search traditionally" fallback CTA
- Traditional search page (`/search`) with conventional filters

### 8.6 M6 — Auth + polish + launch (3 days)

- NextAuth.js wired to legacy `auth/login`
- Guest mode default
- Analytics events wired (client + server)
- `/api/health` checks (KV + legacy shim)
- Error boundaries, fallbacks
- Security review of prompt templates + tool args
- Accessibility audit pass (keyboard nav, focus, contrast, screen reader)
- Performance budget verification (Lighthouse on preview URL)
- 1–2 additional destination pages prerendered

**Total: ~22 working days = ~4-5 weeks.**

---

## 9. Testing Strategy

### 9.1 Unit tests (Vitest)

- Tool handler schemas (Zod validation)
- Intent extraction (against fixture messages)
- Mock provider responses match fixture scripts
- Inventory client mapping functions
- Conversation state compression

### 9.2 Integration tests (Vitest + msw)

- `/api/ai/converse` end-to-end with mock provider
- Tool-use loop with stub handlers
- SSE event ordering
- Error handling (legacy shim down, Anthropic rate limit, malformed tool args)

### 9.3 End-to-end tests (Playwright)

- Homepage hero → first AI response with hotels rendered
- Conversation flow: ask → refine → ask again → state preserved
- Empty state appears when no results
- Theme toggle works on all pages
- Keyboard-only navigation through chat panel
- Mobile breakpoint behavior

### 9.4 Manual checks (in M6)

- Lighthouse score ≥ 90 on homepage
- axe-core accessibility audit clean
- Real Anthropic API call completes in < 2s p50
- Cross-browser: Chrome, Safari, Firefox, Edge (latest 2)
- Real device test: iPhone Safari, Android Chrome

---

## 10. Acceptance Criteria

Foundation = "Done" when:

### 10.1 Functional

- User can open homepage, type natural language, get back real hotels
- Conversation refines (e.g. "cheaper" produces different results)
- Click a hotel card → see real hotel detail with rooms, reviews, photos
- Destination pages render with real data + SEO meta
- Mock provider works offline; Anthropic provider works online
- All 5 design system composite components are live on homepage or hotel detail

### 10.2 Quality

- LCP < 1.5s, INP < 200ms, CLS < 0.1 on Vercel preview
- Lighthouse ≥ 90 (performance, accessibility, best practices, SEO)
- axe-core clean
- No console errors on homepage or hotel detail

### 10.3 Security

- No secrets in client bundle
- Tool handlers validate with Zod
- XSS sanitization in place for AI text
- Legacy shim rejects requests without `API_TOKEN`

### 10.4 Documentation

- README with setup, env vars, dev workflow
- This spec committed to `docs/superpowers/specs/`
- Architecture diagram in repo

---

## 11. Out of Scope (deferred to later sub-projects)

- Booking flow (sub-project 3)
- Match score & explanation (sub-project 2) — Foundation shows results, not match %
- Hotelier AI (sub-project 4)
- My Trips page (sub-project 3)
- Full SEO bridge (sub-project 5)
- Payment integration (sub-project 3)
- Multilingual UI (Foundation ships English only; legacy still serves multilingual content)
- Multilingual chat (sub-project 2+)

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Legacy shared hosting can't handle REST shim traffic | Low | High | Test with realistic load early in M2; add Vercel KV caching aggressively |
| Anthropic API rate limits hit during demo | Medium | Medium | Mock provider for demos; production usage has daily budget guards |
| Joomla `com_api` security misconfig | Low | High | Token auth + CORS allowlist + read-only endpoints + security review in M6 |
| `elx_res_*` schema doesn't have fields AI needs (e.g. soft preference scores) | High | Medium | v1 uses heuristics on existing fields (amenities, descriptions); new fields added in sub-project 2 |
| Next.js app can't reach legacy shim (network/CORS) | Medium | High | Local docker compose for dev; clear runbook in README; `/api/health` catches it |
| Legacy image URLs are slow / not CDN | High | Low | Use Next.js Image with loader config; add `next.config.js` remote pattern; document |

---

## 13. Open Questions

None at this stage. Locked decisions: Next.js + legacy data, real Anthropic API with tool-use, foundation + AI homepage + conversational search, split deployment (Vercel + legacy host).

Future sub-projects will have their own spec → plan → implementation cycles and may surface new questions (e.g. payment provider choice in sub-project 3).