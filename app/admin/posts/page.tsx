'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPosts() {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return setStatus('Enter a title');
    setStatus('Creating...');
    try {
      // Create post as a page with slug `post-<slugified-title>`
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const res = await fetch(
        `/api/page?slug=post-${encodeURIComponent(slug)}&lang=en`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: [], title }),
        },
      );
      if (!res.ok) throw new Error('Create failed');
      setStatus('Created');
      setTitle('');
    } catch (err) {
      setStatus('Error creating post');
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="admin-breadcrumb">
        <div className="admin-breadcrumb-label">Admin / Posts</div>
        <Link
          href="/admin"
          className="admin-breadcrumb-link"
        >
          Back to Admin →
        </Link>
      </div>
      <header className="admin-header">
        <div>
          <h1>Posts</h1>
          <p className="muted">
            Create and manage blog posts (stored as pages)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
            }}
          >
            English (EN)
          </div>
          <Link className="btn" href="/editor">
            Open Editor
          </Link>
        </div>
      </header>

      <div className="admin-section">
        <form onSubmit={handleCreate} className="admin-form">
          <div className="form-group">
            <label>
              Post Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My first post"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              Create Post
            </button>
            <span className="muted">{status}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
