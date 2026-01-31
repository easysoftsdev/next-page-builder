"use client";

import { useEffect, useRef, useState } from 'react';

export function RenderImage({ props }: { props: Record<string, unknown> }) {
  const src = typeof props.src === 'string' ? props.src : '';
  const alt = typeof props.alt === 'string' ? props.alt : '';
  const width = typeof props.width === 'number' ? props.width : 1200;
  const height = typeof props.height === 'number' ? props.height : 800;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;
    setLoaded(false);
    setErrored(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    // Check if image is already cached/loaded
    if (img.complete) {
      if (img.naturalHeight > 0) {
        setLoaded(true);
      } else {
        setErrored(true);
      }
    }
  }, [src]);

  if (!src) return null;

  return (
    <div
      className={`renderer-image-shell${loaded ? ' is-loaded' : ''}${errored ? ' is-error' : ''}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {!loaded && !errored ? (
        <div className="renderer-image-loader" aria-hidden="true" />
      ) : null}
      <img
        ref={imgRef}
        className="renderer-image"
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{ width: '100%', height: 'auto' }}
      />
      {errored ? (
        <div className="renderer-image-fallback">Image failed to load</div>
      ) : null}
    </div>
  );
}
