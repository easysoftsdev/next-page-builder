import { headers } from "next/headers";
import { PageRenderer } from "../../../components/renderer/Renderer";
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
      <header className="page-header">
        <div>
          <p className="kicker">Rendered Page</p>
          <h1>{data.page.title ?? slug}</h1>
        </div>
        <a className="btn" href={`/editor?slug=${encodeURIComponent(slug)}`}>
          Edit Page
        </a>
      </header>
      <PageRenderer page={data.page} />
    </main>
  );
}
