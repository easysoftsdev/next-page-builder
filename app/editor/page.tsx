import { EditorClient } from '../../components/builder/EditorClient';

export default async function EditorPage({
  searchParams,
}: {
  searchParams?: Promise<{ slug?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const slug = resolvedSearchParams.slug ?? 'home';
  return <EditorClient slug={slug} />;
}
