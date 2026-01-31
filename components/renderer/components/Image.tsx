"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function RenderImage({ props }: { props: Record<string, unknown> }) {
  const src = typeof props.src === "string" ? props.src : "";
  const alt = typeof props.alt === "string" ? props.alt : "";
  const width = typeof props.width === "number" ? props.width : 1200;
  const height = typeof props.height === "number" ? props.height : 800;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!src) return;
    setLoaded(false);
    setErrored(false);
  }, [src]);

  if (!src) return null;
  return (
    <div
      className={`renderer-image-shell${loaded ? " is-loaded" : ""}${errored ? " is-error" : ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {!loaded && !errored ? <div className="renderer-image-loader" aria-hidden="true" /> : null}
      <Image
        className="renderer-image"
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        onLoadingComplete={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
      {errored ? <div className="renderer-image-fallback">Image failed to load</div> : null}
    </div>
  );
}
