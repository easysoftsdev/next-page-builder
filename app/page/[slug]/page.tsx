import { headers } from "next/headers";
import Link from 'next/link';
import { PageRenderer } from "../../../components/renderer/Renderer";
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import type { PageSchema } from "../../../types/builder";

export default async function PageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const response = await fetch(`${protocol}://${host}/api/page?slug=${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  const data = (await response.json()) as { page: PageSchema };

  return (
    <main className="page-view">
      <div className="page-top-bar">
        <Link href="/" className="btn btn-sm btn-ghost">
          Home
        </Link>
        <div className="page-top-bar-right">
          <LanguageSwitcher />
          <a
            className="btn btn-sm"
            href={`/editor?slug=${encodeURIComponent(slug)}`}
          >
            Edit Page
          </a>
        </div>
      </div>
      <header className="page-header">
        <div>
          <p className="kicker">Rendered Page</p>
          <h1>{data.page.title ?? slug}</h1>
        </div>
      </header>
      <PageRenderer page={data.page} />
    </main>
  );
}
