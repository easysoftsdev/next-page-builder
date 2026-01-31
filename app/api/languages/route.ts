import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
        nativeName: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });

    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch languages' },
      { status: 500 },
    );
  }
}
