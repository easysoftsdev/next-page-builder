"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MediaItem = {
  id: string;
  title: string | null;
  alt: string | null;
  url: string;
  fileType: string;
  size: number;
  createdAt: string;
};

type MediaLibraryModalProps = {
  open: boolean;
  multiple?: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
};

export function MediaLibraryModal({ open, multiple = false, onClose, onSelect }: MediaLibraryModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    void loadMedia();
  }, [open]);

  async function loadMedia() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load media library.");
      }
      const data = (await response.json()) as { items: MediaItem[] };
      setItems(data.items ?? []);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load media library.");
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setStatus("uploading");
    setError(null);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    try {
      const response = await fetch("/api/media", { method: "POST", body: formData });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Upload failed.");
      }
      await loadMedia();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function toggleSelect(item: MediaItem) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (multiple) {
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      } else {
        next.clear();
        next.add(item.id);
      }
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="media-modal-backdrop" role="dialog" aria-modal="true">
      <div className="media-modal">
        <div className="media-modal-header">
          <div>
            <h4>Media Library</h4>
            <p className="muted">Select {multiple ? "one or more" : "one"} image(s).</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="media-modal-toolbar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleUpload(event.target.files)}
          />
          {status === "uploading" ? <span className="status-pill">Uploading…</span> : null}
          {status === "loading" ? <span className="status-pill">Loading…</span> : null}
          {error ? <span className="status-pill status-error">{error}</span> : null}
        </div>
        <div className="media-grid">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`media-card${selectedIds.has(item.id) ? " selected" : ""}`}
              onClick={() => toggleSelect(item)}
            >
              <img src={item.url} alt={item.alt ?? item.title ?? ""} loading="lazy" />
              <div className="media-card-meta">
                <span>{item.title ?? "Untitled"}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="media-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => onSelect(selectedItems)}
            disabled={selectedItems.length === 0}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
