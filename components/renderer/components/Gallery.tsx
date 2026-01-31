'use client';

import { useEffect } from 'react';
import { Fancybox } from '@fancyapps/ui';

type GalleryItem = {
  id: string;
  url: string;
  alt?: string;
  title?: string;
};

type GalleryProps = {
  items?: GalleryItem[];
  columns?: number;
  gap?: number;
  borderRadius?: number;
};

export function RenderGallery({ props }: { props: Record<string, unknown> }) {
  const items = Array.isArray(props.items)
    ? (props.items as GalleryItem[]).filter(
        (item) =>
          item && typeof item.url === 'string' && typeof item.id === 'string',
      )
    : [];
  const columns = typeof props.columns === 'number' ? props.columns : 3;
  const gap = typeof props.gap === 'number' ? props.gap : 12;
  const borderRadius =
    typeof props.borderRadius === 'number' ? props.borderRadius : 0;

  useEffect(() => {
    Fancybox.bind('[data-fancybox="gallery"]');

    return () => {
      Fancybox.destroy();
    };
  }, [items]);

  if (items.length === 0) {
    return <div className="renderer-gallery-empty">No media selected.</div>;
  }

  return (
    <>
      <style>{`
        .fancybox__container {
          z-index: 1000;
        }
      `}</style>
      <div
        className="renderer-gallery"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
          gap: `${Math.max(0, gap)}px`,
        }}
      >
        {items.map((item) => (
          <figure
            key={item.id}
            className="renderer-gallery-item"
            style={{
              borderRadius: `${Math.max(0, borderRadius)}px`,
              overflow: 'hidden',
            }}
          >
            <a
              href={item.url}
              data-fancybox="gallery"
              data-caption={item.alt ?? item.title ?? ''}
              className="renderer-gallery-link"
              style={{ display: 'block' }}
            >
              <img
                src={item.url}
                alt={item.alt ?? item.title ?? ''}
                loading="lazy"
                style={{
                  cursor: 'pointer',
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </a>
          </figure>
        ))}
      </div>
    </>
  );
}
