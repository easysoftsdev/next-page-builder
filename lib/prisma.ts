import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

declare global {
  var prisma: PrismaClient | undefined;
}

const cached = global.prisma;
const hasMediaGalleryModel =
  cached && typeof cached === "object"
    ? Boolean((cached as { _runtimeDataModel?: { models?: Record<string, unknown> } })._runtimeDataModel?.models?.MediaGallery)
    : false;
const prisma: PrismaClient = hasMediaGalleryModel
  ? (cached as PrismaClient)
  : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
