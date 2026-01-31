import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const status = searchParams.get('status') || '';
  const createdBy = searchParams.get('createdBy') || '';
  const createdDateFrom = searchParams.get('createdDateFrom');
  const createdDateTo = searchParams.get('createdDateTo');

  const where: any = {};

  if (keyword) {
    where.slug = { contains: keyword, mode: 'insensitive' };
  }

  if (status && status !== 'all') {
    where.status = status;
  }

  if (createdBy) {
    where.createdBy = { contains: createdBy, mode: 'insensitive' };
  }

  if (createdDateFrom || createdDateTo) {
    where.createdAt = {};
    if (createdDateFrom) {
      where.createdAt.gte = new Date(createdDateFrom);
    }
    if (createdDateTo) {
      where.createdAt.lte = new Date(createdDateTo);
    }
  }

  const pages = await prisma.page.findMany({
    where,
    select: {
      id: true,
      slug: true,
      status: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      translations: {
        select: { title: true, language: { select: { isDefault: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Extract title from default language translation
  const pagesWithTitle = pages.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    status: p.status,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    title:
      p.translations?.find((t: any) => t.language.isDefault)?.title || null,
  }));

  return NextResponse.json({ pages: pagesWithTitle });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug: string;
    title?: string;
    createForAllLanguages?: boolean;
  };

  if (!body.slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  // create page if not exists
  let page = await prisma.page.findUnique({ where: { slug: body.slug } });
  if (!page) {
    page = await prisma.page.create({ data: { slug: body.slug } });
  }

  // If requested, create translations for all active languages
  if (body.createForAllLanguages) {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
    });
    await Promise.all(
      languages.map((lang) =>
        prisma.pageTranslation.upsert({
          where: {
            pageId_languageId: { pageId: page!.id, languageId: lang.id },
          },
          update: { title: body.title ?? null },
          create: {
            pageId: page!.id,
            languageId: lang.id,
            schema: {},
            title: body.title ?? null,
            metaDescription: null,
            version: 1,
          },
        }),
      ),
    );
  } else {
    // create default language translation (use default language)
    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
    });
    if (defaultLang) {
      await prisma.pageTranslation.upsert({
        where: {
          pageId_languageId: { pageId: page.id, languageId: defaultLang.id },
        },
        update: { title: body.title ?? null },
        create: {
          pageId: page.id,
          languageId: defaultLang.id,
          schema: {},
          title: body.title ?? null,
          metaDescription: null,
          version: 1,
        },
      });
    }
  }

  return NextResponse.json({ ok: true, slug: page.slug });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug)
    return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const body = (await request.json()) as {
    translations?: Array<{
      code: string;
      title?: string;
      metaDescription?: string;
    }>;
  };

  if (!body.translations || !Array.isArray(body.translations)) {
    return NextResponse.json(
      { error: 'translations required' },
      { status: 400 },
    );
  }

  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page)
    return NextResponse.json({ error: 'page not found' }, { status: 404 });

  // For each translation, upsert by language code
  const results = [] as any[];
  for (const t of body.translations) {
    const lang = await prisma.language.findUnique({ where: { code: t.code } });
    if (!lang) continue;
    const up = await prisma.pageTranslation.upsert({
      where: { pageId_languageId: { pageId: page.id, languageId: lang.id } },
      update: {
        title: t.title ?? undefined,
        metaDescription: t.metaDescription ?? undefined,
      },
      create: {
        pageId: page.id,
        languageId: lang.id,
        schema: {},
        title: t.title ?? null,
        metaDescription: t.metaDescription ?? null,
        version: 1,
      },
    });
    results.push({ code: t.code, id: up.id });
  }

  return NextResponse.json({ ok: true, updated: results });
}
