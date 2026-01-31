import { Editor } from "../../components/builder/Editor";

export default async function EditorPage({
  searchParams,
}: {
  searchParams?: Promise<{ slug?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const slug = resolvedSearchParams.slug ?? "home";
  return <Editor slug={slug} />;
}
