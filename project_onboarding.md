# PROJECT_ONBOARDING — 🧱 Mini Elementor (Next.js Drag & Drop Page Builder)

Welcome! This doc is the **single best starting point** to understand, run, and extend the project.

The product is a simple Elementor-like page builder in **Next.js** with:
- **Section → Row → Column → Component** layout
- **Drag & Drop** editing
- **Redux** state management + persistence
- **Undo / Redo** history
- **JSON** as the single source of truth
- **Server-rendered pages** from JSON via API

---

## 0) Golden Rules

1. **JSON is the source of truth**
   - Editor writes JSON.
   - Renderer reads JSON.
   - No DOM state is persisted.

2. **Editor and Renderer are decoupled**
   - Editor = DnD + controls + Redux
   - Renderer = pure JSON → UI

3. **Every node has a unique `id`**
   - Sections, rows, columns, components.

4. **All changes go through Redux actions**
   - Enables Undo/Redo and persistence.

---

## 1) Quick Start

### Requirements
- Node.js (LTS recommended)
- npm / pnpm / yarn

### Install
```bash
npm install
```

### Run Dev
```bash
npm run dev
```

Open:
- **Editor**: `/editor`
- **Public renderer**: `/page/[slug]`

---

## 2) What You’re Building

### Layout Hierarchy
```
Page
 └── Section
      └── Row
           └── Column (1–12)
                └── Component (text/button/image/...)
```

### Page Schema (Single Source)
```json
{
  "sections": [
    {
      "id": "section-1",
      "rows": [
        {
          "id": "row-1",
          "columns": [
            {
              "id": "col-1",
              "span": 6,
              "components": [
                {
                  "id": "cmp-1",
                  "type": "text",
                  "props": {
                    "text": "Hello World"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 3) Repo Map (Where Things Live)

```
app/
├── editor/               # Page Builder UI (DnD)
├── page/[slug]/          # Public page renderer
└── api/page/route.ts     # Save / Load JSON
components/
├── builder/              # Editor components (DnD + controls)
└── renderer/             # JSON → UI renderer (pure)
store/
├── index.ts              # Redux store
└── builderSlice.ts       # Present/Past/Future + actions
types/
└── builder.ts            # Schema types
lib/
├── schema.ts             # Node factories
└── storage.ts            # Simple file-backed persistence
data/
└── pages.json            # Stored page JSON by slug
```

Key idea:
- `components/builder/*` can depend on DnD + Redux.
- `components/renderer/*` **must remain pure** (no DnD, no Redux-only assumptions).

---

## 4) How Data Flows End-to-End

```
Editor UI (DnD)
   ↓ dispatch(actions)
Redux Store
   ↓ select(present)
JSON Page Schema
   ↓ save/load
API (/api/page)
   ↓
Renderer (JSON → React UI)
```

### Editor Responsibilities
- Adds/moves/removes nodes
- Updates component props
- Maintains selection state (if needed)
- Dispatches actions that update `present`

### Renderer Responsibilities
- Takes JSON schema and renders it deterministically
- No editing logic
- No DnD logic

---

## 5) Redux State Model (Undo/Redo)

State shape:
```ts
{
  past: PageSchema[]
  present: PageSchema
  future: PageSchema[]
}
```

Rules:
- Any edit action pushes old `present` into `past`, clears `future`, sets new `present`.
- `undo` pops from `past` into `present` and pushes previous `present` into `future`.
- `redo` pops from `future` into `present` and pushes previous `present` into `past`.

**Tip:** Keep actions small and predictable. Prefer “transform JSON” actions over “mutate UI state”.

---

## 6) Editor UX Guidelines

### Minimal editor state
Try to keep UI/editor-only state out of the schema:
- Selection (active node id)
- Hover state
- Drag overlay state

These can live in Redux separately or component-local state.

### DnD constraints
- Maintain valid nesting: Section → Row → Column → Component
- Validate drops:
  - Prevent dropping a row into a component
  - Prevent invalid spans or empty structures (unless allowed)

---

## 7) API Contract (Save / Load)

### Save
```
POST /api/page
Body: PageSchema JSON
```

### Load
```
GET /api/page
Response: PageSchema JSON
```

**Best practice:** include `slug` to support multiple pages:
- `GET /api/page?slug=home`
- `POST /api/page?slug=home`

Also consider returning:
- `updatedAt`
- `version`

### Persistence (Prisma)

This project uses Prisma with a `Page` table:

- `slug` (unique)
- `schema` (JSON)
- `version` (int)
- timestamps

Setup:

1. Copy `.env.example` → `.env` and set `DATABASE_URL`.
2. Run `npx prisma generate` (uses `prisma.config.ts`).
3. Run `npx prisma migrate dev --name init`.

---

## 8) Adding a New Component Type (Extensibility)

Goal: add a new component without changing the core schema.

### Step-by-step
1. **Add the type**
   - Update union type in `types/builder.ts` (e.g., `"video"`).

2. **Add renderer implementation**
   - `src/components/renderer/components/Video.tsx`
   - Add to renderer map: `type → ReactComponent`

3. **Add editor UI**
   - Toolbar button to insert new component JSON
   - Optional property editor panel for props

4. **Add default props**
   - Define a factory: `createComponent("video")`

### Definition of done
- New node can be inserted
- Appears in Editor preview
- Appears in Renderer page
- JSON persists across reload

---

## 9) Common Tasks (Playbook)

### A) Insert a text component into a column
- Action: `addComponent({ columnId, component })`
- Reducer: find column by id and push into `components`

### B) Drag component between columns (roadmap)
- Action: `moveComponent({ fromColumnId, toColumnId, componentId, toIndex })`
- Reducer:
  - remove from source
  - insert into destination
  - preserve component id

### C) Edit component props
- Action: `updateComponentProps({ componentId, patch })`
- Reducer: deep-merge `props` (prefer patch semantics)

### D) Delete nodes safely
- Ensure no orphan nodes
- Ensure minimum structure rules (if any)

---

## 10) Quality Bar & Conventions

### Type safety
- Keep schema types in `types/builder.ts`
- Prefer exhaustive `switch(type)` handling in renderer

### Deterministic rendering
- Renderer output should be stable given the same JSON input.

### Performance
- Avoid deep cloning the entire schema on every edit if possible.
- Use immutable update helpers carefully (e.g., Immer) and normalize if needed later.

---

## 11) Suggested Next Improvements (Roadmap Guidance)

High impact, low complexity:
- Component factory utilities (`createSection/createRow/...`)
- Central renderer registry (`componentType → component`)
- Selection + property inspector (right sidebar)

Medium complexity:
- Drag components between columns
- Inline text editing

Advanced:
- Responsive breakpoints (per node, per span)
- Reusable blocks
- Versioning/drafts (server-side)
- AI-assisted editing

---

## 12) Codex Agent Instructions (Optional but Recommended)

If you use Codex as an agent in this repo, paste this into Codex Chat:

```
You are working inside a Next.js page builder repo.

Golden rules:
- JSON page schema is the source of truth.
- Editor modifies JSON via Redux actions.
- Renderer must stay pure (no DnD, no editor-only logic).

Before coding:
- Scan app/editor, components/builder, components/renderer, store/builderSlice.ts, types/builder.ts
- Summarize the data model and how drag/drop mutates state.

Constraints:
- Do not invent APIs.
- Prefer minimal changes.
- Maintain valid hierarchy: Section → Row → Column → Component.

After summarizing, propose a plan and wait for approval.
```

---

**End of onboarding**
