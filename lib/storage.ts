import fs from "node:fs";
import path from "node:path";
import type { PageSchema } from "../types/builder";
import { createEmptyPage } from "./schema";

const dataFile = path.join(process.cwd(), "data", "pages.json");

type StoredPages = Record<
  string,
  {
    updatedAt: string;
    version: number;
    page: PageSchema;
  }
>;

function readStore(): StoredPages {
  try {
    const raw = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(raw) as StoredPages;
  } catch {
    return {};
  }
}

function writeStore(store: StoredPages) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

export function loadPage(slug: string): { page: PageSchema; updatedAt: string; version: number } {
  const store = readStore();
  const record = store[slug];
  if (!record) {
    return { page: createEmptyPage(), updatedAt: new Date(0).toISOString(), version: 1 };
  }
  return record;
}

export function savePage(slug: string, page: PageSchema) {
  const store = readStore();
  const version = (store[slug]?.version ?? 0) + 1;
  const record = { page, version, updatedAt: new Date().toISOString() };
  store[slug] = record;
  writeStore(store);
  return record;
}
