'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Check, X } from 'lucide-react';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
}

interface FormData {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
}

const INITIAL_FORM = {
  code: '',
  name: '',
  nativeName: '',
  isDefault: false,
  isActive: true,
};

export default function AdminLanguages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  async function loadLanguages() {
    try {
      const response = await fetch('/api/admin/languages?includeInactive=true');
      const data = (await response.json()) as { languages: Language[] };
      setLanguages(data.languages);
      setError('');
    } catch (err) {
      setError('Failed to load languages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const method = editingCode ? 'PATCH' : 'POST';
      const url = editingCode
        ? `/api/admin/languages?code=${encodeURIComponent(editingCode)}`
        : '/api/admin/languages';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        throw new Error(errData.error || 'Failed to save language');
      }

      await loadLanguages();
      setForm(INITIAL_FORM);
      setEditingCode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(code: string) {
    if (
      !confirm(
        `Delete language "${code}"? Associated page translations will also be deleted.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/languages?code=${encodeURIComponent(code)}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        throw new Error(errData.error || 'Failed to delete language');
      }

      await loadLanguages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete language',
      );
    }
  }

  function handleEdit(lang: Language) {
    setEditingCode(lang.code);
    setForm({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      isDefault: lang.isDefault,
      isActive: lang.isActive,
    });
  }

  function handleCancel() {
    setEditingCode(null);
    setForm(INITIAL_FORM);
    setError('');
  }

  return (
    <main className="admin-shell">
      {/* Breadcrumb */}
      <div className="admin-breadcrumb">
        <div className="admin-breadcrumb-label">Admin / Languages</div>
        <Link
          href="/admin"
          className="admin-breadcrumb-link"
        >
          Back to Admin →
        </Link>
      </div>
      <header className="admin-header">
        <div>
          <h1>Language Management</h1>
          <p>Add, edit, and manage available languages for your pages</p>
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
          }}
        >
          {languages.find((l) => l.isDefault)
            ? `${languages.find((l) => l.isDefault)?.nativeName} (${languages.find((l) => l.isDefault)?.code.toUpperCase()})`
            : 'Default'}
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-section">
          <h2>{editingCode ? 'Edit Language' : 'Add New Language'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label>
                Language Code
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toLowerCase() })
                  }
                  placeholder="en, bn, zh, etc."
                  disabled={!!editingCode}
                  required
                  pattern="[a-z]{2,3}"
                  title="2-3 lowercase letters"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                English Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="English, Bengali, Chinese, etc."
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Native Name
                <input
                  type="text"
                  value={form.nativeName}
                  onChange={(e) =>
                    setForm({ ...form, nativeName: e.target.value })
                  }
                  placeholder="English, বাংলা, 中文, etc."
                  required
                />
              </label>
            </div>

            <div className="form-group form-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                />
                Set as default language
              </label>
            </div>

            <div className="form-group form-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={submitting}>
                {submitting
                  ? 'Saving...'
                  : editingCode
                    ? 'Update Language'
                    : 'Add Language'}
              </button>
              {editingCode && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-section">
          <h2>Available Languages</h2>
          {loading ? (
            <p>Loading...</p>
          ) : languages.length === 0 ? (
            <p className="text-muted">
              No languages configured. Create one above.
            </p>
          ) : (
            <div className="languages-table">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Native Name</th>
                    <th>Default</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {languages.map((lang) => (
                    <tr
                      key={lang.code}
                      className={lang.isActive ? '' : 'inactive-row'}
                    >
                      <td className="code-cell">
                        <code>{lang.code}</code>
                      </td>
                      <td>{lang.name}</td>
                      <td className="native-name">{lang.nativeName}</td>
                      <td className="center">
                        {lang.isDefault ? (
                          <Check size={16} className="text-green" />
                        ) : (
                          <X size={16} className="text-muted" />
                        )}
                      </td>
                      <td className="center">
                        {lang.isActive ? (
                          <Check size={16} className="text-green" />
                        ) : (
                          <X size={16} className="text-muted" />
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleEdit(lang)}
                        >
                          Edit
                        </button>
                        {!lang.isDefault && (
                          <button
                            className="btn btn-sm btn-ghost btn-danger"
                            onClick={() => handleDelete(lang.code)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
