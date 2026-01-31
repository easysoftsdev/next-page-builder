import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import type { Prisma } from "@prisma/client";
import { createEmptyPage } from "../../../lib/schema";
import type { PageSchema } from "../../../types/builder";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? 'home';
  const lang = searchParams.get('lang') ?? 'en';

  // Try to find translation first
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      translations: {
        where: { language: { code: lang } },
        select: {
          schema: true,
          title: true,
          version: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!page) {
    return NextResponse.json({
      slug,
      lang,
      page: createEmptyPage(),
      title: null,
      updatedAt: new Date(0).toISOString(),
      version: 1,
    });
  }

  // If translation exists, return it
  if (page.translations.length > 0) {
    const translation = page.translations[0];
    return NextResponse.json({
      slug,
      lang,
      page: translation.schema as PageSchema,
      title: translation.title,
      updatedAt: translation.updatedAt.toISOString(),
      version: translation.version,
    });
  }

  // Fallback to legacy schema field if no translation
  return NextResponse.json({
    slug,
    lang,
    page: (page.schema as PageSchema) ?? createEmptyPage(),
    title: null,
    updatedAt: page.updatedAt.toISOString(),
    version: page.version,
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? 'home';
  const lang = searchParams.get('lang') ?? 'en';
  const body = (await request.json()) as PageSchema & { title?: string };

  // Get or create language
  const language = await prisma.language.findUnique({
    where: { code: lang },
  });

  if (!language) {
    return NextResponse.json({ error: 'Language not found' }, { status: 404 });
  }

  // Get or create page
  let page = await prisma.page.findUnique({ where: { slug } });
  if (!page) {
    page = await prisma.page.create({
      data: { slug },
    });
  }

  // Extract title from body if provided
  const title = body.title ?? undefined;
  const schema = { ...body };
  delete (schema as any).title;

  // Upsert translation
  const translation = await prisma.pageTranslation.upsert({
    where: {
      pageId_languageId: {
        pageId: page.id,
        languageId: language.id,
      },
    },
    update: {
      schema: schema as Prisma.InputJsonValue,
      title: title,
      version: {
        increment: 1,
      },
    },
    create: {
      pageId: page.id,
      languageId: language.id,
      schema: schema as Prisma.InputJsonValue,
      title: title,
      version: 1,
    },
  });

  return NextResponse.json({
    slug,
    lang,
    page: translation.schema as PageSchema,
    title: translation.title,
    updatedAt: translation.updatedAt.toISOString(),
    version: translation.version,
  });
}
