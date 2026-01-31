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
};

export function RenderGallery({ props }: { props: Record<string, unknown> }) {
  const items = Array.isArray(props.items)
    ? (props.items as GalleryItem[]).filter(
        (item) => item && typeof item.url === "string" && typeof item.id === "string"
      )
    : [];
  const columns = typeof props.columns === "number" ? props.columns : 3;
  const gap = typeof props.gap === "number" ? props.gap : 12;

  if (items.length === 0) {
    return <div className="renderer-gallery-empty">No media selected.</div>;
  }

  return (
    <div
      className="renderer-gallery"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
        gap: `${Math.max(0, gap)}px`,
      }}
    >
      {items.map((item) => (
        <figure key={item.id} className="renderer-gallery-item">
          <img src={item.url} alt={item.alt ?? item.title ?? ""} loading="lazy" />
        </figure>
      ))}
    </div>
  );
}
