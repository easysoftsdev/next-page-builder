# CONTRIBUTING.md

Thanks for contributing! This project is a **Next.js drag & drop page builder** where **JSON is the source of truth**.

## 1) Development Setup

### Prerequisites
- Node.js (LTS recommended)
- npm / pnpm / yarn

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

### Useful routes
- Editor: `/editor`
- Renderer: `/page/[slug]`

---

## 2) Working Agreements

### Golden rules (must follow)
1. **Schema is truth**: editor writes JSON; renderer reads JSON.
2. **Renderer is pure**: no DnD logic, no editor-only state.
3. **All edits go through Redux actions**: enables Undo/Redo and persistence.
4. **IDs are stable**: never regenerate IDs during moves/edits.

### Keep changes minimal
Prefer small, local diffs with clear intent.

---

## 3) Branching & PRs

### Branch naming
- `feature/<short-name>`
- `fix/<short-name>`
- `chore/<short-name>`

### PR checklist
- [ ] Works in editor and renderer
- [ ] Does not break hierarchy rules (Section → Row → Column → Component)
- [ ] Keeps JSON schema backward compatible unless explicitly intended
- [ ] Undo/Redo works for the new action(s)
- [ ] Persistence still reloads correctly
- [ ] No “invented” renderer components or props

---

## 4) Code Style & Patterns

### Prefer factories for new nodes
Use central creators (or add them) like:
- `createSection()`
- `createRow()`
- `createColumn()`
- `createComponent(type)`

### Prefer patch updates for props
- `updateComponentProps({ componentId, patch })`
- Deep-merge `props` (patch semantics), avoid overwriting whole props unless needed.

### Keep editor-only state out of schema
Editor-only state examples:
- selection id
- hover id
- drag overlay

These belong in UI state (Redux separate slice or component state), not in the persisted schema.

---

## 5) Testing (Practical)

If you don’t have automated tests yet, use this manual test matrix for any change:

### Manual smoke tests
1. Add Section / Row / Column
2. Add Text / Button / Image
3. Drag reorder within same parent
4. Edit props (e.g., text content)
5. Undo/Redo multiple times
6. Reload browser → state persists
7. Save via API → reload renderer page → correct output

---

## 6) Commit Messages

Use conventional commits if possible:
- `feat: add component registry`
- `fix: preserve ids on move`
- `chore: update docs`

---

# ARCHITECTURE.md

## 1) System Overview

This project builds pages with a strict separation:

- **Editor**: drag & drop + controls + Redux
- **Renderer**: JSON → React UI (read-only)

**Single source of truth:** the page schema JSON.

---

## 2) Architecture Diagram

```txt
┌──────────────┐
│   Editor UI  │  (Drag & Drop)
└──────┬───────┘
       │ dispatch(actions)
       ▼
┌────────────────────┐
│ Redux Store        │
│ - Past (Undo)      │
│ - Present          │
│ - Future (Redo)    │
└──────┬─────────────┘
       │ select(present)
       ▼
┌────────────────────┐
│ JSON Page Schema   │
│ (Single Source)    │
└──────┬─────────────┘
       │ save/load
       ▼
┌────────────────────┐
│ API (Save / Load)  │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Page Renderer      │
│ (JSON → React UI)  │
└────────────────────┘
```

---

## 3) Domain Model

### Hierarchy
```
Page
 └── Section
      └── Row
           └── Column (span 1–12)
                └── Component (typed)
```

### Node invariants
- Every node has a unique stable `id`
- Child collections are ordered arrays (order matters)
- Drag & drop reorders arrays, never “recreates” nodes

---

## 4) State Management (Undo/Redo)

### State shape
```ts
{
  past: PageSchema[]
  present: PageSchema
  future: PageSchema[]
}
```

### Reducer rules
- Any edit:
  - push current `present` → `past`
  - set `present` = new schema
  - clear `future`
- Undo:
  - move one state from `past` → `present`
  - push previous `present` → `future`
- Redo:
  - move one state from `future` → `present`
  - push previous `present` → `past`

**Performance note:** If history becomes heavy, consider:
- limiting past length
- storing patches/diffs
- normalizing schema (IDs map) later

---

## 5) Renderer Registry Pattern (Recommended)

Keep a single registry that maps JSON component `type` → renderer component.

### Example shape
- `renderer/components/index.ts`
  - `const registry = { text: Text, button: Button, image: Image }`

Rules:
- Renderer must handle unknown types gracefully (fallback component)
- Keep props validation defensive

---

## 6) Editor Responsibilities

The editor layer should:
- validate drop targets
- enforce hierarchy constraints
- dispatch Redux actions that transform JSON

Keep editor-only UI state separate:
- active selection
- hovered node
- drag overlay

---

## 7) API Design Notes

Current contract:
- `GET /api/page` → returns `PageSchema`
- `POST /api/page` → saves `PageSchema`

Recommended extension:
- use `slug` in query string: `?slug=home`
- return metadata: `{ schema, slug, version, updatedAt }`

---

## 8) Extensibility: Add a New Component

Checklist:
1. Extend types (component type union)
2. Add renderer implementation
3. Add editor insertion UI (toolbar)
4. Add optional property inspector controls
5. Ensure save/load + renderer works

---

## 9) Non-Goals (to keep scope sane)

For the early versions, avoid:
- mixing editor state into schema
- storing computed layout/DOM state
- coupling renderer to Redux

---

## 10) Suggested Next Technical Milestones

1. Component factories + ID utilities
2. Move components between columns
3. Property inspector + selection model
4. Responsive spans (breakpoints)
5. Versioning/drafts server-side

---

**End of docs**

