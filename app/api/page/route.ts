import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import type { Prisma } from "@prisma/client";
import { createEmptyPage } from "../../../lib/schema";
import type { PageSchema } from "../../../types/builder";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "home";

  const record = await prisma.page.findUnique({ where: { slug } });

  if (!record) {
    return NextResponse.json({
      slug,
      page: createEmptyPage(),
      updatedAt: new Date(0).toISOString(),
      version: 1,
    });
  }

  return NextResponse.json({
    slug,
    page: record.schema as PageSchema,
    updatedAt: record.updatedAt.toISOString(),
    version: record.version,
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "home";
  const body = (await request.json()) as PageSchema;

  const existing = await prisma.page.findUnique({ where: { slug } });
  const record = existing
    ? await prisma.page.update({
        where: { slug },
        data: {
          schema: body as Prisma.InputJsonValue,
          version: existing.version + 1,
        },
      })
    : await prisma.page.create({
        data: {
          slug,
          schema: body as Prisma.InputJsonValue,
          version: 1,
        },
      });

  return NextResponse.json({
    slug,
    page: record.schema as PageSchema,
    updatedAt: record.updatedAt.toISOString(),
    version: record.version,
  });
}
