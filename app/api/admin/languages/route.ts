import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const where = includeInactive ? {} : { isActive: true };

  const languages = await prisma.language.findMany({
    where,
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });

  return NextResponse.json({ languages });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    code?: string;
    name?: string;
    nativeName?: string;
    isDefault?: boolean;
    isActive?: boolean;
  };

  // Validate required fields
  if (!body.code || !body.name || !body.nativeName) {
    return NextResponse.json(
      { error: "Missing required fields: code, name, nativeName" },
      { status: 400 }
    );
  }

  // Validate code format (alphanumeric, 2-3 chars)
  if (!/^[a-z]{2,3}$/i.test(body.code)) {
    return NextResponse.json(
      { error: "Language code must be 2-3 characters (a-z)" },
      { status: 400 }
    );
  }

  // If setting as default, unset other defaults
  if (body.isDefault) {
    await prisma.language.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const language = await prisma.language.upsert({
    where: { code: body.code },
    update: {
      name: body.name,
      nativeName: body.nativeName,
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
    },
    create: {
      code: body.code,
      name: body.name,
      nativeName: body.nativeName,
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json({ language });
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Language code required" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    nativeName?: string;
    isDefault?: boolean;
    isActive?: boolean;
  };

  // If setting as default, unset other defaults
  if (body.isDefault) {
    await prisma.language.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const language = await prisma.language.update({
    where: { code },
    data: body,
  });

  return NextResponse.json({ language });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Language code required" }, { status: 400 });
  }

  // Check if language is default
  const language = await prisma.language.findUnique({ where: { code } });
  if (language?.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete default language" },
      { status: 400 }
    );
  }

  // Delete associated translations
  await prisma.pageTranslation.deleteMany({
    where: { language: { code } },
  });

  // Delete the language
  await prisma.language.delete({ where: { code } });

  return NextResponse.json({ success: true });
}
