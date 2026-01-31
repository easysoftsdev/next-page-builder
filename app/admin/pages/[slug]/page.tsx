'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
};

export default function AdminPageEdit({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    if (selectedLang) {
      loadTranslation();
    }
  }, [selectedLang]);

  async function loadLanguages() {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();
      const langs = data.languages || [];
      setLanguages(langs);
      // Set language from URL param or default
      const defaultLang =
        langParam ||
        langs.find((l: Language) => l.isDefault)?.code ||
        langs[0]?.code ||
        'en';
      setSelectedLang(defaultLang);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTranslation() {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/page?slug=${encodeURIComponent(slug)}&lang=${encodeURIComponent(selectedLang)}`,
      );
      if (r.ok) {
        const d = await r.json();
        setTitle(d.title ?? '');
        setMetaDescription(d.page?.metaDescription ?? '');
      } else {
        setTitle('');
        setMetaDescription('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const payload = {
        translations: [{ code: selectedLang, title, metaDescription }],
      };
      const res = await fetch(
        `/api/admin/pages?slug=${encodeURIComponent(slug)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error('Save failed');
      setStatus('Saved');
      router.refresh();
    } catch (err) {
      setStatus('Save error');
    }
  }

  if (!selectedLang) return <p>Loading...</p>;

  return (
    <div>
      <header className="admin-header">
        <div>
          <h1>Edit Page — {slug}</h1>
          <p className="muted">Manage title and metadata per language</p>
        </div>
        <div>
          <select
            value={selectedLang}
            onChange={(e) => {
              const newLang = e.target.value;
              setSelectedLang(newLang);
              router.push(`?lang=${encodeURIComponent(newLang)}`);
            }}
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

      {/* Breadcrumb */}
      <div className="admin-breadcrumb">
        <div className="admin-breadcrumb-label">Admin / Pages / Edit</div>
        <Link href="/admin/pages" className="admin-breadcrumb-link">
          Back to Pages →
        </Link>
      </div>

      <form onSubmit={handleSave} className="admin-section admin-form">
        {loading ? (
          <p>Loading translation data...</p>
        ) : (
          <>
            <div className="form-group">
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Meta Description
                <input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Meta description"
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="btn" type="submit">
                Save Translation
              </button>
              <span className="muted">{status}</span>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
