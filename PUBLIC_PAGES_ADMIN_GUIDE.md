# Public Pages & Admin Features Update

## Overview
Added language switcher to all public pages and created a complete admin section for managing languages.

## What's New

### 1. **Language Switcher on Public Pages** ✓
- Added to home page (`/`) - top right corner
- Added to page views (`/page/home`, `/page/[slug]`) - top right corner
- Shows dropdown with all available languages
- Language selection persists via localStorage
- Uses the same `LanguageSwitcher` component from the Context API

### 2. **Admin Language Management** ✓
- New admin page at `/admin/languages`
- Create new languages with:
  - Language code (2-3 characters: en, bn, zh, es, etc.)
  - English name (e.g., "Spanish")
  - Native name (e.g., "Español")
  - Set as default language option
  - Activate/deactivate languages
- Edit existing languages
- Delete languages (except default language)
- View all languages with their status (active/inactive, default or not)

### 3. **Admin API Endpoints** ✓

**GET** `/api/admin/languages`
- List all languages
- Query param: `?includeInactive=true` - Include disabled languages
- Returns: Array of language objects

**POST** `/api/admin/languages`
- Create or update a language
- Body: `{ code, name, nativeName, isDefault, isActive }`
- Returns: Created/updated language object

**PATCH** `/api/admin/languages?code=en`
- Update a specific language
- Body: `{ name, nativeName, isDefault, isActive }`
- Returns: Updated language object

**DELETE** `/api/admin/languages?code=es`
- Delete a language and its translations
- Cannot delete default language
- Returns: `{ success: true }`

### 4. **Page Layout Updates**

**Home Page (`/`):**
- Added top bar with "Language Admin" button
- Language switcher dropdown in top right

**Page View (`/page/[slug]`):**
- Added top bar with navigation
- Home button (left)
- Language switcher + Edit Page button (right)
- Clean, minimal design

### 5. **Files Added/Modified**

**New Files:**
- `app/api/admin/languages/route.ts` - Admin API endpoints
- `app/admin/languages/page.tsx` - Admin UI for managing languages

**Modified Files:**
- `app/page.tsx` - Added language switcher and admin link
- `app/page/[slug]/page.tsx` - Added language switcher and top navigation
- `app/globals.css` - Added all styling for new components

## Features in Detail

### Language Admin Page

**Form:**
- Language Code (disabled when editing)
- English Name
- Native Name
- Checkboxes for "Set as default" and "Active"
- Save/Update button
- Cancel button when editing

**Languages Table:**
- Code column (highlighted)
- English name
- Native name
- Default status (✓ or ×)
- Active status (✓ or ×)
- Edit button per row
- Delete button (except for default language)

**Validation:**
- Language code must be 2-3 characters (a-z only)
- All fields required for creating
- Cannot delete default language
- Cannot update code of existing language

**When setting as default:**
- Other default flags are automatically cleared
- Only one language can be default at a time

### Public Page Experience

**Language Switching:**
1. User sees LanguageSwitcher dropdown in top right
2. Click to open dropdown with all active languages
3. Select a language to view page in that language
4. Page content loads in selected language via `/api/page?slug=...&lang=XX`
5. Language selection persists in localStorage

**Navigation:**
- Home page has quick access to Language Admin
- Page views have Home button to return
- Edit Page button remains accessible

## Styling

All new UI elements match the existing design system:
- Uses CSS variables for colors (--accent, --panel, --border, etc.)
- Responsive design (mobile-friendly)
- Consistent button and form styling
- Smooth transitions and hover states

## Testing

### Test Language Admin Page
```bash
# Visit admin page
http://localhost:3000/admin/languages

# Try adding a new language
# Try editing a language
# Try setting as default
# Try deleting a non-default language
```

### Test Public Pages with Language Switcher
```bash
# Visit home page
http://localhost:3000
# Click language switcher, select different language

# Visit page view
http://localhost:3000/page/home
# Click language switcher, verify content updates
```

### Test API Directly
```bash
# List languages
curl http://localhost:3000/api/admin/languages

# Add Spanish language
curl -X POST http://localhost:3000/api/admin/languages \
  -H "Content-Type: application/json" \
  -d '{
    "code": "es",
    "name": "Spanish",
    "nativeName": "Español",
    "isActive": true
  }'

# Update language
curl -X PATCH http://localhost:3000/api/admin/languages?code=es \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Delete language
curl -X DELETE http://localhost:3000/api/admin/languages?code=es
```

## Workflow

### For Content Creators:
1. Navigate to `/admin/languages` to set up languages
2. Add languages: English, Bengali, Chinese, Spanish, etc.
3. Set one as default
4. Go to `/editor` and create content
5. Use editor language switcher to edit different versions
6. Switch language in the selector, fill in content for each language
7. Save each language version

### For Website Visitors:
1. Visit public page (e.g., `/page/home`)
2. Use language switcher in top right to view in preferred language
3. Language preference is remembered in browser

## Architecture

```
Admin Management (Backend)
├── /api/admin/languages (CRUD)
│   ├── GET - list all languages
│   ├── POST - create/update language
│   ├── PATCH - update specific language
│   └── DELETE - remove language
└── /admin/languages (UI Page)
    └── Form + Table for management

Public Pages (Frontend)
├── / (Home)
│   └── Language Switcher
├── /page/[slug] (Page View)
│   ├── Language Switcher
│   └── Edit button
└── LanguageSwitcher Component
    └── Uses useLanguage() hook for state
```

## Database Impact

- No schema changes required
- Uses existing `Language` table
- Manages language records (create, update, deactivate)
- Associated `PageTranslation` records are deleted when language is deleted

## Error Handling

- Form validation with helpful messages
- API error responses with clear messages
- Cannot delete default language (prevents data corruption)
- Invalid language codes rejected (2-3 chars only)
- Graceful fallbacks if languages fail to load

## Future Enhancements

1. **Bulk Operations** - Enable/disable multiple languages at once
2. **Language Cloning** - Copy language as template
3. **Translation Progress** - Show which pages have translations for each language
4. **Import/Export** - Bulk manage languages from CSV
5. **Language Groups** - Organize languages by region/category
6. **Translation Memory** - Cache for faster switching
7. **Language-specific Settings** - Direction (RTL/LTR), date formats, etc.
