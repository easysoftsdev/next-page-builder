import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding languages...');

  // Create default languages
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: 'en' },
      update: {},
      create: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        isDefault: true,
        isActive: true,
      },
    }),
    prisma.language.upsert({
      where: { code: 'bn' },
      update: {},
      create: {
        code: 'bn',
        name: 'Bengali',
        nativeName: 'বাংলা',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.language.upsert({
      where: { code: 'zh' },
      update: {},
      create: {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        isDefault: false,
        isActive: true,
      },
    }),
  ]);

  console.log(
    '✓ Languages seeded:',
    languages.map((l) => `${l.code} (${l.nativeName})`),
  );
}

main()
  .catch((e) => {
    console.error('✗ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
