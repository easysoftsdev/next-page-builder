# Multi-Language Editor Implementation

## Overview
The page builder now supports multiple languages with full editor integration. Users can create and edit pages in different languages (English, Bengali, Chinese) from the editor toolbar.

## What's Implemented

### 1. **Editor Language Switcher** ✓
- Added language dropdown selector to editor toolbar (right side)
- Shows all active languages with native names (e.g., "English (EN)", "বাংলা (BN)", "中文 (ZH)")
- Language selection persists via localStorage
- Styled select element matches editor design

### 2. **Multi-Language Page Data** ✓
- Editor automatically loads/saves content in selected language
- GET `/api/page?slug=home&lang=en` - Fetch page in specific language
- POST `/api/page?slug=home&lang=en` - Save page in specific language
- Each language version is stored separately in `PageTranslation` table

### 3. **Language Context** ✓
- `useLanguage()` hook provides access to current language
- Context fetches available languages from `/api/languages` on app startup
- Languages stored in Prisma `Language` table with:
  - `code`: Language code (en, bn, zh)
  - `name`: English name
  - `nativeName`: Name in native language
  - `isDefault`: Set one as default
  - `isActive`: Enable/disable language

### 4. **Database Schema** ✓
- **Language**: Stores available languages
- **Page**: Page metadata and slug (legacy schema field kept for backward compatibility)
- **PageTranslation**: Per-language page content with `(pageId, languageId)` unique constraint
  - Stores full page schema for each language
  - Includes title and metaDescription fields
  - Version tracking for each translation

## Files Added/Modified

### New Files
- `lib/language-context.tsx` - React Context for language state
- `components/LanguageSwitcher.tsx` - Language dropdown component (on frontend)
- `app/api/languages/route.ts` - API endpoint for available languages
- `scripts/migrate-pages-to-translations.ts` - Migration script for existing pages

### Modified Files
- `components/builder/Editor.tsx` - Added language selector to toolbar, integrated language parameter in fetch/save
- `app/api/page/route.ts` - Updated to support language parameter
- `app/layout.tsx` - Added LanguageProvider wrapper
- `app/globals.css` - Added styles for language selector
- `package.json` - Added migrate:pages script

## How to Use

### 1. Seed Languages
```bash
bun run seed
```
This creates three default languages: English (EN), Bengali (BN), Chinese (ZH)

### 2. Migrate Existing Pages (if you have old data)
```bash
bun run migrate:pages
```
This converts any existing pages with legacy schema to the multi-language format, creating translations for the default language.

### 3. Use Editor with Languages
1. Navigate to `/editor`
2. Look for the language selector dropdown in the right toolbar
3. Select a language from the dropdown
4. Edit the page - changes are saved to that language version
5. Switch languages to edit different versions
6. Each language version is saved independently

## Technical Details

### Editor Changes
The `Editor` component now:
- Imports `useLanguage()` hook
- Fetches with language parameter: `/api/page?slug=...&lang=${currentLanguage}`
- Saves with language parameter: `/api/page?slug=...&lang=${currentLanguage}`
- Reloads content when language changes (via useEffect dependency)

### API Routes
- GET `/api/page?slug=home&lang=en` - Returns translation for specified language, falls back to legacy schema if not found
- POST `/api/page?slug=home&lang=en` - Upserts translation, increments version
- GET `/api/languages` - Returns active languages sorted by default and code

### CSS Styling
Language selector styling in `globals.css`:
- `.language-select` - Dropdown input styling with accent color focus state
- Custom dropdown arrow with SVG background
- Hover state with subtle accent border
- Focus state with light background color

## Database Queries

### Fetching a page in a specific language
```sql
SELECT * FROM "PageTranslation"
WHERE "pageId" = $1 AND "languageId" = $2
```

### Saving/Updating a page translation
```sql
INSERT INTO "PageTranslation" (...) 
VALUES (...) 
ON CONFLICT ("pageId", "languageId") 
DO UPDATE SET ...
```

## Testing

### Test language switching in editor:
1. Create content in English
2. Save (should show "Saved" status)
3. Switch to Bengali from dropdown
4. Verify content is empty (new language)
5. Add Bengali content
6. Switch back to English
7. Verify English content is still there
8. Switch to Bengali
9. Verify Bengali content is there

### Test API directly:
```bash
# Get English version
curl "http://localhost:3000/api/page?slug=home&lang=en"

# Get Bengali version
curl "http://localhost:3000/api/page?slug=home&lang=bn"

# Get available languages
curl "http://localhost:3000/api/languages"
```

## Migration from Old Format

If you have existing pages in the old single-language format:

1. Pages with data in the `Page.schema` field will be detected
2. Run `bun run migrate:pages` 
3. This will:
   - Create `PageTranslation` records for the default language (EN)
   - Copy schema from `Page.schema` to `PageTranslation.schema`
   - Clear the legacy `Page.schema` field
4. After migration, all pages can be edited in any language

## Next Steps (Optional Enhancements)

1. **Side-by-side translation editing** - Edit multiple languages at once
2. **Translation progress tracking** - See which languages have been translated
3. **Copy translations** - Clone one language version to another as a starting point
4. **Language-specific media** - Allow different images for different languages
5. **Auto-save per language** - Save each language version independently
6. **Translation history** - Version tracking per language

## Backward Compatibility

- Old pages without translations can still be edited
- API falls back to legacy `Page.schema` field if no translation exists
- Migration script provides easy upgrade path
- Both old and new formats supported simultaneously during transition
