/**
 * Migration script: Convert existing pages to multi-language format
 *
 * This script:
 * 1. Finds all pages that have content in the legacy 'schema' field
 * 2. Creates PageTranslation records for the default language (EN)
 * 3. Clears the legacy 'schema' field once migrated
 *
 * Run with: bunx tsx scripts/migrate-pages-to-translations.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting page migration to multi-language format...\n');

  // Get the default language
  const defaultLanguage = await prisma.language.findUnique({
    where: { code: 'en' },
  });

  if (!defaultLanguage) {
    throw new Error(
      'Default language (EN) not found. Run seed first: bun run seed',
    );
  }

  console.log(
    `✓ Using default language: ${defaultLanguage.nativeName} (${defaultLanguage.code})\n`,
  );

  // Find all pages with legacy schema
  const pagesWithSchema = await prisma.page.findMany({
    where: {
      schema: {
        not: undefined,
      },
    },
  });

  console.log(`Found ${pagesWithSchema.length} pages to migrate\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const page of pagesWithSchema) {
    // Get existing translations for this page
    const existingTranslation = await prisma.pageTranslation.findUnique({
      where: {
        pageId_languageId: {
          pageId: page.id,
          languageId: defaultLanguage.id,
        },
      },
    });

    // Skip if translation already exists
    if (existingTranslation) {
      console.log(`⊙ Skipped "${page.slug}" (translation already exists)`);
      skippedCount++;
      continue;
    }

    // Create translation from legacy schema
    if (page.schema) {
      await prisma.pageTranslation.create({
        data: {
          pageId: page.id,
          languageId: defaultLanguage.id,
          schema: page.schema,
          title: null,
          metaDescription: null,
          version: page.version,
        },
      });

      // Clear legacy schema field
      await prisma.page.update({
        where: { id: page.id },
        data: {
          schema: Prisma.DbNull,
        },
      });

      console.log(`✓ Migrated "${page.slug}" to PageTranslation`);
      migratedCount++;
    }
  }

  console.log(`\n✓ Migration complete!`);
  console.log(`  - Migrated: ${migratedCount} pages`);
  console.log(`  - Skipped: ${skippedCount} pages`);
  console.log(`\nAll pages are now in multi-language format.`);
}

main()
  .catch((e) => {
    console.error('\n✗ Migration error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
