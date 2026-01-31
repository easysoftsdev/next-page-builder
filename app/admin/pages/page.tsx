'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PageItem = {
  id: string;
  slug: string;
  status: string;
  createdBy?: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Language = {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
};

const STATUSES = ['draft', 'published', 'archived'];

export default function AdminPages() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [createdDateFrom, setCreatedDateFrom] = useState('');
  const [createdDateTo, setCreatedDateTo] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    if (selectedLang) {
      loadPages();
    }
  }, [
    selectedLang,
    keyword,
    status,
    createdBy,
    createdDateFrom,
    createdDateTo,
  ]);

  async function loadLanguages() {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();
      const langs = data.languages || [];
      setLanguages(langs);
      const defaultLang =
        langs.find((l: Language) => l.isDefault)?.code ||
        langs[0]?.code ||
        'en';
      setSelectedLang(defaultLang);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPages() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (status) params.append('status', status);
      if (createdBy) params.append('createdBy', createdBy);
      if (createdDateFrom) params.append('createdDateFrom', createdDateFrom);
      if (createdDateTo) params.append('createdDateTo', createdDateTo);

      const res = await fetch(`/api/admin/pages?${params.toString()}`);
      const data = await res.json();
      setPages(data.pages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="admin-breadcrumb">
        <div className="admin-breadcrumb-label">Admin / Pages</div>
        <Link
          href="/admin"
          className="admin-breadcrumb-link"
        >
          Back to Admin →
        </Link>
      </div>
      <header className="admin-header">
        <div>
          <h1>Pages</h1>
          <p className="muted">Search and manage site pages</p>
        </div>
        <div>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
            }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.code.toUpperCase()})
                {lang.isDefault ? ' (Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Filters */}
      <div className="admin-section">
        <h2>Filters</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div className="form-group">
            <label>
              Keyword Search
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by slug..."
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-group">
            <label>
              Created By
              <input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="Filter by creator..."
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Created From
              <input
                type="date"
                value={createdDateFrom}
                onChange={(e) => setCreatedDateFrom(e.target.value)}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Created To
              <input
                type="date"
                value={createdDateTo}
                onChange={(e) => setCreatedDateTo(e.target.value)}
              />
            </label>
          </div>
          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'flex-end' }}
          >
            <button
              className="btn btn-ghost"
              onClick={() => {
                setKeyword('');
                setStatus('');
                setCreatedBy('');
                setCreatedDateFrom('');
                setCreatedDateTo('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="admin-section" style={{ marginTop: 20 }}>
        <h2>Pages ({pages.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : pages.length === 0 ? (
          <p>No pages found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Slug
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Created By
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Updated
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      <Link
                        href={`/page/${encodeURIComponent(p.slug)}`}
                        style={{ color: '#3b82f6' }}
                      >
                        {p.slug}
                      </Link>
                    </td>
                    <td style={{ padding: '8px' }}>{p.title || '—'}</td>
                    <td style={{ padding: '8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor:
                            p.status === 'published'
                              ? '#d1fae5'
                              : p.status === 'archived'
                                ? '#f3f4f6'
                                : '#fef3c7',
                          color:
                            p.status === 'published'
                              ? '#065f46'
                              : p.status === 'archived'
                                ? '#6b7280'
                                : '#92400e',
                        }}
                      >
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>{p.createdBy || '—'}</td>
                    <td
                      style={{
                        padding: '8px',
                        fontSize: '12px',
                        color: '#6b7280',
                      }}
                    >
                      {formatDate(p.createdAt)} {formatTime(p.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        fontSize: '12px',
                        color: '#6b7280',
                      }}
                    >
                      {formatDate(p.updatedAt)} {formatTime(p.updatedAt)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div className="page-actions">
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/admin/pages/${encodeURIComponent(p.slug)}?lang=${encodeURIComponent(selectedLang)}`}
                        >
                          Edit
                        </Link>
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={`/editor?slug=${encodeURIComponent(p.slug)}&lang=${encodeURIComponent(selectedLang)}`}
                        >
                          Editor
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
