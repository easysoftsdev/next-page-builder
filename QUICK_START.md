# Quick Start: Multi-Language Page Builder

## Setup

### 1. Seed Default Languages
```bash
bun run seed
```
Creates: English (EN), Bengali (BN), Chinese (ZH)

### 2. (Optional) Migrate Existing Pages
```bash
bun run migrate:pages
```
Converts old single-language pages to multi-language format

## Using the System

### Navigate to Key URLs

**Home Page (with Language Switcher & Admin Link):**
- http://localhost:3000/

**Admin Language Management:**
- http://localhost:3000/admin/languages
- Add new languages
- Set default language
- Activate/deactivate languages
- Delete languages

**Page Editor (with Language Selector):**
- http://localhost:3000/editor
- Language dropdown in top-right toolbar
- Select language, edit content for that language
- Save to that language version

**Public Page View (with Language Switcher):**
- http://localhost:3000/page/home
- Language switcher in top bar
- Switch to view different language versions
- Edit button to return to editor

## Key Features

### Editor
- Language selector in toolbar
- Fetch/save specific language versions
- Each language has independent content
- Version tracking per language

### Public Pages
- Language switcher shows all active languages
- Remembers language choice (localStorage)
- Loads content in selected language
- Clean, minimal UI

### Admin
- Create/edit/delete languages
- Set default language (one required)
- Activate/deactivate languages
- View status of all languages

## Database

The app uses three tables for multi-language support:

**Language Table**
```
id, code, name, nativeName, isDefault, isActive
```

**Page Table** (minimal metadata)
```
id, slug, schema (nullable - legacy), isPublished, version
```

**PageTranslation Table** (per-language content)
```
id, pageId, languageId, schema, title, metaDescription, version
```

## API Endpoints

### Public Endpoints
- `GET /api/page?slug=home` - Get page (default language)
- `GET /api/page?slug=home&lang=en` - Get specific language
- `GET /api/languages` - Get active languages

### Admin Endpoints
- `GET /api/admin/languages` - List all languages
- `POST /api/admin/languages` - Create language
- `PATCH /api/admin/languages?code=en` - Update language
- `DELETE /api/admin/languages?code=es` - Delete language

## Workflow Example

1. **Admin Sets Up Languages**
   - Go to `/admin/languages`
   - Click "Add Language"
   - Enter: code=`es`, name=`Spanish`, nativeName=`Español`
   - Click "Add Language"
   - Spanish appears in dropdown on all pages

2. **Editor Creates Content**
   - Go to `/editor`
   - Default language (English) selected
   - Create page content
   - Click language selector → choose Spanish
   - Spanish version empty - add Spanish content
   - Click Save - saves Spanish version
   - Switch back to English - English content still there

3. **Visitor Sees Content**
   - Visit `/page/home`
   - Click language switcher
   - Select Spanish
   - Page content in Spanish loads
   - Selection remembered for next visit

## Styling

All UI elements are styled and responsive:
- Language switchers: Dropdown buttons with active highlighting
- Admin page: Two-column layout (form + table)
- Public pages: Top navigation bars with language controls
- Mobile-friendly: Stacks vertically on small screens

## Troubleshooting

### Languages not showing
- Make sure languages are seeded: `bun run seed`
- Check `/api/languages` returns data

### Can't create new language
- Language code must be 2-3 characters (a-z only)
- All fields required (code, name, nativeName)

### Can't delete language
- Default language cannot be deleted
- Set another language as default first

### Content not loading in different language
- Make sure page has translation for that language
- In editor, select language and save content first

## Files Added

```
app/
├── page.tsx (updated - added language switcher)
├── page/
│   └── [slug]/page.tsx (updated - added language switcher)
├── admin/
│   └── languages/
│       └── page.tsx (new - admin UI)
├── api/
│   └── admin/
│       └── languages/
│           └── route.ts (new - admin endpoints)
└── globals.css (updated - added all styling)

lib/
└── language-context.tsx (existing - used by switcher)

components/
└── LanguageSwitcher.tsx (existing - used on all pages)
```

## Environment

The app uses:
- Next.js 16.1.5 with Turbopack
- Prisma 7.3.0 with PostgreSQL
- React 19.2.3
- Redux for editor state
- @dnd-kit for drag-and-drop

No additional dependencies were added.

---

**Ready to go!** 🚀

Visit http://localhost:3000 and start using multi-language features.
