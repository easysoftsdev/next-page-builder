'use client';

import { Suspense } from 'react';
import { Editor } from './Editor';

export function EditorClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <Editor slug={slug} />
    </Suspense>
  );
}
