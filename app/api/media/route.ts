import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import prisma from "../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const take = Number(searchParams.get("take") ?? "60");
  const skip = Number(searchParams.get("skip") ?? "0");

  const items = await prisma.mediaGallery.findMany({
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(take) ? take : 60,
    skip: Number.isFinite(skip) ? skip : 0,
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((item): item is File => typeof item === "object" && item !== null && "arrayBuffer" in item);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  await mkdir(MEDIA_DIR, { recursive: true });

  const created = [];
  for (const file of files) {
    const extension = path.extname(file.name).toLowerCase();
    const isImageByType = file.type.startsWith("image/");
    const isImageByExt = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".svg"].includes(
      extension
    );
    if (!isImageByType && !isImageByExt) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(MEDIA_DIR, fileName);
    await writeFile(filePath, buffer);

    const record = await prisma.mediaGallery.create({
      data: {
        title: path.basename(file.name, extension),
        alt: null,
        url: `/media/${fileName}`,
        fileType: file.type,
        size: buffer.length,
        fileName,
      },
    });

    created.push(record);
  }

  return NextResponse.json({ items: created });
}
