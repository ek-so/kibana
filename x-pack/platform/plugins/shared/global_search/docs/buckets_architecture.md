# Global Search — Bucket architecture

> **Status:** In progress (Navigate + Recent implemented in globalSearchBar)  
> **Owner:** `@elastic/appex-sharedux`  
> **Last updated:** 2026-05-27  
> **Related:** [RFC 0011](../../../../legacy_rfcs/text/0011_global_search.md), [GlobalSearch README](../README.md)

This document describes the planned infrastructure for organizing global search results into **buckets** (e.g. Suggested, Recent, Actions, Search results). It is the source of truth for implementation; update this file when the design changes.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | Initial architecture plan |
| 2026-05-27 | **Navigate** and **Recent** buckets shipped in `globalSearchBar`; `organizeGlobalSearchResults` in `@kbn/global-search-plugin` |

---

## Goals

1. **Group results by intent**, not only by score — show different content when the query is empty, partial, filtered, or command-like.
2. **Compose buckets dynamically** — filter, merge, cap, and derive buckets from shared item pools at query time.
3. **Stay backward compatible** — existing `registerResultProvider` APIs keep working via adapters.
4. **Keep UI dumb** — `globalSearchBar` renders bucket output; ranking/bucketing logic lives in the search layer.
5. **Allow extension** — plugins can register bucket definitions, item sources, and pipeline stages.

## Non-goals (for initial phases)

- Replacing saved-object or application provider implementations.
- Full command-palette / VS Code–style action DSL (may come later under the `actions` bucket).
- Server-side persistence of “recent” across devices (client-local first).
- Searching arbitrary in-app page state (still app/deep-link/SO/provider driven).

---

## Current state (baseline)

Today global search is a **flat, federated list**:

| Layer | Behavior |
|-------|----------|
| `@kbn/global-search-plugin` | Merges client + server **result providers**; emits flat `GlobalSearchResult[]` batches. |
| `globalSearchProviders` | Default providers: applications (client), saved objects (server). |
| `globalSearchBar` | Debounced `find()`; merges **syntax suggestions** (`getSuggestions`) ahead of results; sorts by score or title; special-cases empty query → applications only. |

Bucket-like behavior already exists **only in the UI hook** (`use_search_state`), not as a first-class API:

```ts
// Empty query → applications only, sort by title
// Non-empty → all types, sort by score
// Suggestions prepended with type === '__suggestion__'
```

Problems this plan addresses:

- Bucket rules are hard-coded in `globalSearchBar`, not reusable or extensible.
- No stable place for **Recent** or **Actions**.
- Items cannot belong to multiple logical groups without duplicating provider logic.
- Composing “show X when query is empty, Y when typing” requires UI changes each time.

---

## Concepts

| Term | Definition |
|------|------------|
| **Item** | A single navigable/searchable entry (title, url, icon, score, type, meta). Extends today’s `GlobalSearchProviderResult` / `GlobalSearchResult`. |
| **Bucket** | A labeled section of items shown together (e.g. `recent`, `suggested`, `actions`, `results`). Has display metadata and visibility rules. |
| **Source** | Produces **candidate items** for a request (may tag items with preferred bucket(s)). Maps to today’s result providers + new sources (recent store, static actions). |
| **Pipeline** | Ordered stages that transform `GlobalSearchRequest` → `GlobalSearchResponse` (buckets + items). |
| **Query context** | Normalized view of user input: raw term, parsed filters (`type:`, `tag:`), **phase** (see below), capabilities. |

### Query phases

Phases drive which buckets are eligible. Initial set:

| Phase | When | Typical buckets |
|-------|------|-----------------|
| `idle` | Modal open, input empty | `suggested`, `recent`, `actions` (optional) |
| `typing` | Non-empty term, no committed search yet | `suggested`, `recent` (narrow), `syntax` |
| `searching` | Debounced find in flight or complete | `results`, `actions` (if term matches commands) |
| `filtered` | Explicit `type:` / `tag:` filters in query | `results` (scoped), fewer suggestions |

Phases are computed in the pipeline from `GlobalSearchFindParams` + input metadata — not set by the UI ad hoc.

---

## Target architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ globalSearchBar (presentation)                                   │
│  - Renders GlobalSearchBucketSection[]                           │
│  - Keyboard nav across sections                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ subscribe
┌────────────────────────────▼────────────────────────────────────┐
│ GlobalSearchPipeline (public API)                                │
│  find(params) → Observable<GlobalSearchResponse>                 │
│  - build QueryContext                                            │
│  - run registered sources (parallel, aborted$)                     │
│  - run stages: normalize → dedupe → assign → rank → cap → compose│
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
   ┌─────────▼─────────┐           ┌─────────▼─────────┐
   │ Item sources       │           │ Bucket registry    │
   │ (providers, recent,│           │ (definitions,      │
   │  actions, …)       │           │  visibility rules) │
   └────────────────────┘           └────────────────────┘
```

### Package / plugin boundaries

| Location | Responsibility |
|----------|----------------|
| `@kbn/global-search-plugin` `common/` | Types: `GlobalSearchItem`, `GlobalSearchBucket`, `GlobalSearchResponse`, pipeline interfaces. |
| `@kbn/global-search-plugin` `public/` | Pipeline service, `find` API (bucket-aware), source/bucket registration, legacy provider adapter. |
| `@kbn/global-search-plugin` `server/` | Server-side sources + route returns bucketed or flat response (TBD: Phase 1 flat adapter). |
| `globalSearchProviders` | Default sources: applications, saved objects (unchanged providers, wrapped as sources). |
| `globalSearchBar` | Phase 3+: render buckets; Phase 1–2 may consume adapter output gradually. |
| Other plugins | Register `actions` items, custom buckets, or sources via setup API. |

---

## Data model

### `GlobalSearchItem`

```ts
interface GlobalSearchItem {
  id: string;           // unique within a source; pipeline may prefix with source id
  sourceId: string;     // e.g. 'application', 'savedObjects', 'recent', 'actions'
  title: string;
  type: string;         // existing type string (application, dashboard, …)
  url: GlobalSearchProviderResultUrl;
  score: number;        // 1–100; sources set initial score; stages may adjust
  icon?: string;
  meta?: Record<string, Serializable>;
  /** Hints for assignment; pipeline may override */
  bucketHints?: GlobalSearchBucketId[];
}
```

Processed items (after URL resolution) match today’s `GlobalSearchResult` plus `sourceId` / `bucketId`.

### `GlobalSearchBucket`

```ts
type GlobalSearchBucketId =
  | 'suggested'
  | 'recent'
  | 'actions'
  | 'results'
  | 'syntax'      // query syntax suggestions (today's __suggestion__)
  | string;      // custom plugin buckets

interface GlobalSearchBucketDefinition {
  id: GlobalSearchBucketId;
  /** i18n key or title for section header */
  title: string;
  /** Lower = higher on screen */
  order: number;
  /** Max items after cap stage */
  maxItems?: number;
  /** Whether bucket may appear for a given query context */
  isVisible: (ctx: GlobalSearchQueryContext) => boolean;
  /** Default sort within bucket */
  sort?: GlobalSearchItemSortFn;
}
```

### `GlobalSearchResponse`

```ts
interface GlobalSearchBucketResult {
  id: GlobalSearchBucketId;
  title: string;
  items: GlobalSearchResult[];  // url resolved
  /** True while any contributing source is still loading */
  isPartial?: boolean;
}

interface GlobalSearchResponse {
  buckets: GlobalSearchBucketResult[];
  phase: GlobalSearchQueryPhase;
  /** Flat list for backward compatibility / telemetry */
  allItems: GlobalSearchResult[];
}
```

`find()` continues to emit **batches** (streaming providers). Each emission may update bucket contents; UI merges by item `id` + `sourceId`.

---

## Built-in buckets (v1)

| Bucket id | Purpose | Default visibility | Primary sources |
|-----------|---------|-------------------|-----------------|
| `syntax` | `type:`, `tag:` suggestions | `typing`, `filtered` | Syntax source (ported from `getSuggestions`) |
| `navigate` | Indexed apps and deep links (applications provider) | `idle`, `typing`, `searching` | Applications provider |
| `recent` | Recently opened items | `idle`, `typing` | Recent store (`localStorage`, per space) |
| `suggested` | _(planned)_ Curated defaults beyond raw app index | `idle`, `typing` (light) | TBD |
| `actions` | Quick commands (create dashboard, go to settings, …) | `idle`, `searching` when term matches | Static + plugin-registered actions |
| `results` | Full search hits | `searching`, `filtered` | All legacy result providers |

### Bucket assignment rules (defaults)

1. **Syntax** — items from syntax source only.
2. **Suggested** — `type === 'application'`, `phase === 'idle'`, score ≥ threshold OR empty-term default set; cap ~8.
3. **Recent** — items from recent store, ordered by `lastAccessed`; filter by term substring when `typing`.
4. **Actions** — items from actions registry; fuzzy match on title/keywords when term present.
5. **Results** — all provider items not consumed exclusively by other buckets; respect `types` / `tags` filters; sort by score.

An item appears in **at most one bucket** in v1 (first matching assignment wins). **Derived buckets** (Phase 4) may reference items from other buckets without re-fetching.

---

## Pipeline

### Stages (ordered)

| Stage | Responsibility |
|-------|----------------|
| 1. `buildContext` | Parse term → `GlobalSearchFindParams`, compute `phase`, attach capabilities. |
| 2. `collect` | Run enabled sources in parallel; respect `aborted$`, `maxResults` per source. |
| 3. `normalize` | Resolve URLs, ensure `sourceId`, validate required fields. |
| 4. `dedupe` | Collapse duplicates (same url or same type+id); merge scores (max). |
| 5. `assign` | Map each item to exactly one bucket using definitions + hints. |
| 6. `rank` | Per-bucket sort (score, recency, title). |
| 7. `cap` | Apply `maxItems` per bucket. |
| 8. `compose` | Optional derived buckets (e.g. “Top hits” = merge suggested + results). |

Stages are **pure** (input → output) for testability. Plugins register custom stages via `registerPipelineStage({ id, order, run })` — runs after core stages unless `order` overrides.

### Source interface

```ts
interface GlobalSearchItemSource {
  id: string;
  /** Which phases this source should run in; default all */
  phases?: GlobalSearchQueryPhase[];
  find(
    params: GlobalSearchFindParams,
    options: GlobalSearchProviderFindOptions,
    context?: GlobalSearchProviderContext // server only
  ): Observable<GlobalSearchItem[]>;
}
```

**Legacy adapter:** `GlobalSearchResultProvider` → `GlobalSearchItemSource` with `sourceId = provider.id`, all items hinted to `results`.

---

## Registration API (setup)

Exposed from `GlobalSearchPluginSetup` (names illustrative):

```ts
// Bucket metadata + visibility
registerBucketDefinition(def: GlobalSearchBucketDefinition): void;

// Item producers
registerItemSource(source: GlobalSearchItemSource): void;

// Legacy — unchanged; auto-wrapped as item source
registerResultProvider(provider: GlobalSearchResultProvider): void;

// Optional advanced extension
registerPipelineStage(stage: GlobalSearchPipelineStage): void;

// Actions bucket helper
registerAction(action: GlobalSearchAction): void;
```

**Server vs client:** Same split as today — server sources power `/internal/global_search/find`; client sources only run in browser. Bucket assembly runs **on the client** for the modal (server may return pre-grouped results later for other consumers).

---

## UI integration (`globalSearchBar`)

### Rendering

Replace flat `EuiSelectable` options list with:

```text
[ Search input ]
─────────────────
  Suggested          ← section header (i18n)
    • Discover
    • Dashboard
  Recent
    • My dashboard
  Actions
    • Create dashboard
─────────────────
  Results
    • ...
```

Implementation notes:

- Use `EuiSelectable` **group labels** or a thin wrapper with section headers + nested lists (evaluate EUI patterns during Phase 3).
- Preserve keyboard navigation across sections.
- `onChange` / telemetry include `bucketId` + rank within bucket.

### Migration from `use_search_state`

| Current | Target |
|---------|--------|
| `loadSuggestions` + `setDecoratedOptions` | Pipeline output bucket `syntax` + `results` |
| Empty-query application filter | Bucket `suggested` assignment rules |
| `sort.byScore` / `sort.byTitle` | Per-bucket `sort` on definitions |
| `__suggestion__` option type | `syntax` bucket items |

---

## Recent items (design sketch)

- **Storage:** `localStorage` keyed by space id + user profile hash (or anonymous session).
- **Schema:** `{ id, type, url, title, icon?, lastAccessed }[]`, max N entries (e.g. 20).
- **Writes:** On successful navigation from global search (and optionally from app chrome).
- **Privacy:** Same origin only; no server sync in v1.
- **Source id:** `recent`.

---

## Actions bucket (design sketch)

- **Registry** of `GlobalSearchAction`: `{ id, title, keywords, icon, execute(ctx), visible?(ctx) }`.
- **Execute** may navigate, open modal, or run async work.
- **Scoring:** keyword match against term; show in `idle` when no term (curated subset).
- Plugins register via `registerAction` (Fleet, Discover ES|QL shortcut is a precedent).

---

## Backward compatibility

| Consumer | Compatibility |
|----------|----------------|
| `globalSearch.find()` callers | Phase 1: add optional `GlobalSearchResponse` shape; keep emitting `{ results }` until deprecation window. |
| `registerResultProvider` | Wrapped as `results` source; no changes required for plugins. |
| Server route `/internal/global_search/find` | Phase 1: still flat `results`; Phase 2+: optional `?grouped=true` or new field `buckets`. |
| Telemetry | Extend events with `bucketId`; keep existing fields. |

---

## Implementation phases

### Phase 0 — Planning ✅

- This document + README link.

### Phase 1 — Core types & pipeline skeleton

- Add `common/buckets/*` types.
- Implement pipeline with `collect` → `normalize` → `assign` → `cap` for bucket `results` only.
- Legacy provider adapter; `find()` returns both `results` (flat) and `buckets`.

### Phase 2 — Built-in buckets (data)

- Port syntax suggestions → `syntax` source.
- Implement `suggested` rules (extract from `use_search_state` empty-query behavior).
- Implement `recent` store + source.
- Introduce `actions` registry + a few platform actions.

### Phase 3 — UI

- `globalSearchBar` renders bucket sections.
- Telemetry + tests (Scout).

### Phase 4 — Extension & composition

- `registerBucketDefinition`, `registerPipelineStage`, derived buckets.
- Plugin documentation + examples.

---

## Open questions

Record decisions here as they are made.

| # | Question | Proposal | Decision |
|---|----------|----------|----------|
| 1 | Can one item appear in multiple buckets? | No for v1; reassess for “Top hits” | TBD |
| 2 | Should server route return grouped buckets? | Client-side grouping first | TBD |
| 3 | Where does recent navigation get recorded? | `globalSearchBar` on select + optional chrome hook | TBD |
| 4 | Bucket order when only `results` has items | Hide empty buckets; show `results` without header or with “Results” | TBD |
| 5 | Command mode prefix (e.g. `>`) | Defer to actions bucket Phase 4 | TBD |

---

## Testing strategy

- **Unit:** Each pipeline stage with fixture items; bucket visibility matrix per phase.
- **Integration:** Provider adapter still returns same flat results for server route tests.
- **Scout:** Empty modal shows suggested/recent; typing shows syntax + results; selection navigates.

---

## References

- Application provider filtering: `x-pack/platform/plugins/private/global_search_providers/public/providers/application.ts`
- Empty vs typed UI logic: `x-pack/platform/plugins/private/global_search_bar/public/hooks/use_search_state.ts`
- Provider merge: `x-pack/platform/plugins/shared/global_search/public/services/search_service.ts`
