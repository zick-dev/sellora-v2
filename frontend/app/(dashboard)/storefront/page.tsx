'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

const C = {
  bg:          '#0a0a0f',
  card:        '#12121a',
  cardBorder:  'rgba(255,255,255,0.08)',
  input:       '#1a1a2e',
  inputBorder: 'rgba(255,255,255,0.1)',
  inputFocus:  '#7c3aed',
  purple:      '#7c3aed',
  pink:        '#ec4899',
  success:     '#10b981',
  muted:       '#6b7280',
  subtext:     '#9ca3af',
  text:        '#ffffff',
};

const THEMES = [
  { value: 'default',  label: 'Violet',   colors: ['#7c3aed', '#ec4899'] },
  { value: 'ocean',    label: 'Ocean',    colors: ['#0ea5e9', '#06b6d4'] },
  { value: 'sunset',   label: 'Sunset',   colors: ['#f97316', '#ec4899'] },
  { value: 'forest',   label: 'Forest',   colors: ['#10b981', '#059669'] },
  { value: 'midnight', label: 'Midnight', colors: ['#374151', '#111827'] },
  { value: 'minimal',  label: 'Minimal',  colors: ['#f9fafb', '#e5e7eb'] },
];

interface Store {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function StorefrontPage() {
  const [store, setStore]     = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [copied, setCopied]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    store_name:  '',
    description: '',
    logo_url:    '',
    theme:       'default',
  });

  const [focusName, setFocusName] = useState(false);
  const [focusDesc, setFocusDesc] = useState(false);
  const [focusLogo, setFocusLogo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/store/me');
        setStore(res.data);
        setForm({
          store_name:  res.data.store_name || '',
          description: res.data.description || '',
          logo_url:    res.data.logo_url || '',
          theme:       res.data.theme || 'default',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  async function handleSave() {
    if (!form.store_name.trim()) {
      setError('Store name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/api/store/me', {
        store_name:  form.store_name,
        description: form.description || null,
        logo_url:    form.logo_url || null,
      });
      setStore(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update store.');
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/store/${store?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: 300,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid rgba(124,58,237,0.2)',
        borderTopColor: C.purple,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '0 0 80px', maxWidth: 600 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          color: C.text, fontSize: 24,
          fontWeight: 800, marginBottom: 4,
        }}>
          My Storefront
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>
          Manage your public store appearance
        </p>
      </div>

      {/* Store link banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.08))',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 16, padding: '20px', marginBottom: 20,
      }}>
        <p style={{
          color: C.subtext, fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          Your Store Link
        </p>
        <p style={{
          color: C.text, fontFamily: 'monospace',
          fontSize: 14, marginBottom: 14, wordBreak: 'break-all',
        }}>
          {typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost:3000'}
          /store/
          <span style={{ color: C.purple, fontWeight: 700 }}>
            {store?.slug}
          </span>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={copyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              background: C.purple, border: 'none',
              color: C.text, fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          
           <a href={`/store/${store?.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.text, fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Preview &#8599;
          </a>
        </div>
      </div>

      {/* Store details card */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '24px', marginBottom: 16,
      }}>
        <h2 style={{
          color: C.text, fontSize: 16,
          fontWeight: 700, marginBottom: 20,
        }}>
          Store Details
        </h2>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '10px 14px',
            color: '#f87171', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Store name */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: C.subtext, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>
              Store Name
            </label>
            <input
              type="text"
              value={form.store_name}
              onChange={e => setForm({ ...form, store_name: e.target.value })}
              onFocus={() => setFocusName(true)}
              onBlur={() => setFocusName(false)}
              style={{
                width: '100%', background: C.input,
                border: `1.5px solid ${focusName ? C.inputFocus : C.inputBorder}`,
                borderRadius: 10, padding: '12px 14px',
                color: C.text, fontSize: 14, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: C.subtext, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>
              Description
              <span style={{
                color: C.muted, fontWeight: 400,
                textTransform: 'none', marginLeft: 6, fontSize: 11,
              }}>
                — shown on your storefront
              </span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              onFocus={() => setFocusDesc(true)}
              onBlur={() => setFocusDesc(false)}
              placeholder="Tell customers what you sell..."
              rows={3}
              style={{
                width: '100%', background: C.input,
                border: `1.5px solid ${focusDesc ? C.inputFocus : C.inputBorder}`,
                borderRadius: 10, padding: '12px 14px',
                color: C.text, fontSize: 14, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
                transition: 'border-color 0.15s', resize: 'vertical',
              }}
            />
          </div>

          {/* Logo URL */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: C.subtext, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>
              Logo URL
              <span style={{
                color: C.muted, fontWeight: 400,
                textTransform: 'none', marginLeft: 6, fontSize: 11,
              }}>
                optional
              </span>
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input
                type="url"
                value={form.logo_url}
                onChange={e => setForm({ ...form, logo_url: e.target.value })}
                onFocus={() => setFocusLogo(true)}
                onBlur={() => setFocusLogo(false)}
                placeholder="https://example.com/logo.png"
                style={{
                  flex: 1, background: C.input,
                  border: `1.5px solid ${focusLogo ? C.inputFocus : C.inputBorder}`,
                  borderRadius: 10, padding: '12px 14px',
                  color: C.text, fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
              />
              {form.logo_url && (
                <img
                  src={form.logo_url}
                  alt="Logo preview"
                  style={{
                    width: 48, height: 48, borderRadius: 10,
                    objectFit: 'cover', flexShrink: 0,
                    border: `1px solid ${C.cardBorder}`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Theme picker */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '24px', marginBottom: 16,
      }}>
        <h2 style={{
          color: C.text, fontSize: 16,
          fontWeight: 700, marginBottom: 16,
        }}>
          Store Theme
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}>
          {THEMES.map(t => {
            const active = form.theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, theme: t.value })}
                style={{
                  padding: 12, borderRadius: 12,
                  border: active
                    ? '2px solid rgba(124,58,237,0.6)'
                    : `1px solid ${C.cardBorder}`,
                  background: active
                    ? 'rgba(124,58,237,0.08)' : C.input,
                  cursor: 'pointer', position: 'relative',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  height: 36, borderRadius: 8, marginBottom: 8,
                  background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                }} />
                <p style={{
                  color: C.text, fontSize: 12,
                  fontWeight: 600, textAlign: 'center',
                  margin: 0,
                }}>
                  {t.label}
                </p>
                {active && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: C.purple,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10, color: C.text,
                  }}>
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Store info */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '20px', marginBottom: 20,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Slug</span>
          <span style={{
            color: C.purple, fontSize: 13,
            fontFamily: 'monospace', fontWeight: 600,
          }}>
            {store?.slug}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Status</span>
          <span style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: C.success, fontSize: 12,
            fontWeight: 600, padding: '3px 10px',
            borderRadius: 8,
          }}>
            {store?.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
        }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Created</span>
          <span style={{ color: C.text, fontSize: 13 }}>
            {store?.created_at
              ? new Date(store.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : ''}
          </span>
        </div>
      </div>

      {/* Save button */}
<button
  onClick={handleSave}
  disabled={saving}
  style={{
    width: '100%', padding: '15px 0',
    background: saving ? 'rgba(124,58,237,0.4)' : C.purple,
    border: 'none', borderRadius: 12,
    color: C.text, fontSize: 15, fontWeight: 700,
    cursor: saving ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    transition: 'all 0.15s',
  }}
>
  {saving ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }} />
      Saving...
    </span>
  ) : saved ? (
    <span>&#10003; Saved!</span>
  ) : (
    <span>Save Changes</span>
  )}
</button>

<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>
  );
}