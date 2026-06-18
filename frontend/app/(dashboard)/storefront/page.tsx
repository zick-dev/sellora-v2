'use client';
import { useTheme } from '@/lib/theme';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';


const THEMES = [
  { value: '#7c3aed', label: 'Violet',  colors: ['#7c3aed', '#ec4899'] },
  { value: '#0ea5e9', label: 'Ocean',   colors: ['#0ea5e9', '#06b6d4'] },
  { value: '#f97316', label: 'Sunset',  colors: ['#f97316', '#ec4899'] },
  { value: '#10b981', label: 'Forest',  colors: ['#10b981', '#059669'] },
  { value: '#f59e0b', label: 'Gold',    colors: ['#f59e0b', '#f97316'] },
  { value: '#ec4899', label: 'Rose',    colors: ['#ec4899', '#f43f5e'] },
];

interface Store {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  theme_color: string;
  whatsapp: string | null;
  instagram: string | null;
  categories: string;
  is_active: boolean;
  created_at: string;
  popup_enabled: boolean;
  popup_discount: number;
  popup_message: string;
}

export default function StorefrontPage() {
  const { C } = useTheme();
  const [store, setStore]         = useState<Store | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'contact' | 'categories' | 'popup' | 'delivery'>('general');
  const [catInput, setCatInput]   = useState('');

  const [form, setForm] = useState({
    store_name:     '',
    description:    '',
    logo_url:       '',
    banner_url:     '',
    theme_color:    '#7c3aed',
    whatsapp:       '',
    instagram:      '',
    categories:     '[]',
    popup_enabled:  false,
    popup_discount: 10,
    popup_message:  'Get a discount on your order!',
    base_currency:  'USD',
    delivery_fee:          0,
    free_delivery_above:   10000,
  });

  const categories: string[] = (() => {
    try { return JSON.parse(form.categories); } catch { return []; }
  })();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/store/me');
        setStore(res.data);
        setForm({
          store_name:     res.data.store_name || '',
          description:    res.data.description || '',
          logo_url:       res.data.logo_url || '',
          banner_url:     res.data.banner_url || '',
          theme_color:    res.data.theme_color || '#7c3aed',
          whatsapp:       res.data.whatsapp || '',
          instagram:      res.data.instagram || '',
          categories:     res.data.categories || '[]',
          popup_enabled:  res.data.popup_enabled ?? false,
          popup_discount: res.data.popup_discount ?? 10,
          popup_message:  res.data.popup_message || 'Get a discount on your order!',
          base_currency:  res.data.base_currency || 'USD',
          delivery_fee:         res.data.delivery_fee ?? 0,
          free_delivery_above:  res.data.free_delivery_above ?? 10000,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  async function handleSave() {
    if (!form.store_name.trim()) { setError('Store name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/api/store/me', {
        store_name:     form.store_name,
        description:    form.description || null,
        logo_url:       form.logo_url || null,
        banner_url:     form.banner_url || null,
        theme_color:    form.theme_color,
        whatsapp:       form.whatsapp || null,
        instagram:      form.instagram || null,
        categories:     form.categories,
        popup_enabled:  form.popup_enabled,
        popup_discount: form.popup_discount,
        popup_message:  form.popup_message,
        base_currency:  form.base_currency,
        delivery_fee:         form.delivery_fee ?? 0,
        free_delivery_above:  form.free_delivery_above ?? 10000,
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
    const url = window.location.origin + '/store/' + store?.slug;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function addCategory() {
    const val = catInput.trim();
    if (!val || categories.includes(val)) return;
    const updated = JSON.stringify([...categories, val]);
    setForm(f => ({ ...f, categories: updated }));
    setCatInput('');
  }

  function removeCategory(cat: string) {
    const updated = JSON.stringify(categories.filter((c: string) => c !== cat));
    setForm(f => ({ ...f, categories: updated }));
  }

  const inputBase = {
    width: '100%', background: C.input,
    border: '1.5px solid ' + C.inputBorder,
    borderRadius: 10, padding: '12px 14px',
    color: C.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: C.subtext, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 8,
  };

  const tabs = [
    { key: 'general',    label: 'General',    icon: '🏪' },
    { key: 'appearance', label: 'Appearance', icon: '🎨' },
    { key: 'contact',    label: 'Contact',    icon: '📱' },
    { key: 'categories', label: 'Categories', icon: '🏷️' },
    { key: 'popup',      label: 'Popup',      icon: '🎁' },
    { key: 'delivery', label: 'Delivery', icon: '🚚' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, padding: '0 0 80px' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Storefront</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Customize how your store looks to customers</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.08))',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 16, padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <p style={{ color: C.subtext, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Your Store Link</p>
          <p style={{ color: C.text, fontFamily: 'monospace', fontSize: 13 }}>
            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
            /store/<span style={{ color: C.purple, fontWeight: 700 }}>{store?.slug}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyLink} style={{ padding: '8px 14px', borderRadius: 8, background: copied ? 'rgba(16,185,129,0.15)' : C.purple, border: 'none', color: C.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <a href={'/store/' + store?.slug} target="_blank" rel="noreferrer" style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: C.text, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Preview
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.card, borderRadius: 12, padding: 4, border: '1px solid ' + C.cardBorder, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ flex: '1 1 80px', padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === tab.key ? C.purple : 'transparent', color: activeTab === tab.key ? C.text : C.muted, fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
            <span style={{ marginRight: 4 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {activeTab === 'general' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Store Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Store Name</label>
              <input type="text" value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} style={inputBase} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Tell customers what you sell..." rows={3} style={{ ...inputBase, resize: 'vertical' }} />
            </div>
            <div style={{ background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: C.subtext, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Store URL Slug</p>
                <p style={{ color: C.purple, fontSize: 14, fontFamily: 'monospace', fontWeight: 600 }}>{store?.slug}</p>
              </div>
              <span style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: C.success, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8 }}>
                {store?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <label style={labelStyle}>Store Currency</label>
              <select
                value={form.base_currency}
                onChange={e => setForm({ ...form, base_currency: e.target.value })}
                style={{ width: '100%', background: C.input, border: '1.5px solid ' + C.inputBorder, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="NGN">NGN — Nigerian Naira (&#8358;)</option>
                <option value="GHS">GHS — Ghanaian Cedi (&#8373;)</option>
                <option value="KES">KES — Kenyan Shilling (KSh)</option>
                <option value="ZAR">ZAR — South African Rand (R)</option>
                <option value="UGX">UGX — Ugandan Shilling (USh)</option>
                <option value="TZS">TZS — Tanzanian Shilling (TSh)</option>
                <option value="XOF">XOF — West African CFA (CFA)</option>
                <option value="EGP">EGP — Egyptian Pound (E&#163;)</option>
                <option value="GBP">GBP — British Pound (&#163;)</option>
                <option value="EUR">EUR — Euro (&#8364;)</option>
              </select>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Prices on your storefront will show in this currency</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Store Logo</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Square image recommended. Shown in store header.</p>
            <ImageUpload
              value={form.logo_url}
              onChange={url => setForm({ ...form, logo_url: url })}
              label="Store Logo"
              hint="Square image recommended."
              aspectRatio="1"
              placeholder="🏪"
            />
          </div>

          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Store Banner</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Wide hero image at the top of your storefront. 1200x400px recommended.</p>
            <ImageUpload
              value={form.banner_url}
              onChange={url => setForm({ ...form, banner_url: url })}
              label="Store Banner"
              hint="Wide image recommended (1200x400px)."
              aspectRatio="3"
              placeholder="🖼️"
            />
          </div>

          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Theme Color</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Primary color for buttons and accents on your storefront.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {THEMES.map(t => {
                const active = form.theme_color === t.value;
                return (
                  <button key={t.value} onClick={() => setForm({ ...form, theme_color: t.value })} style={{ padding: 12, borderRadius: 12, cursor: 'pointer', border: active ? '2px solid rgba(124,58,237,0.6)' : '1px solid ' + C.cardBorder, background: active ? 'rgba(124,58,237,0.08)' : C.input, position: 'relative', transition: 'all 0.15s' }}>
                    <div style={{ height: 36, borderRadius: 8, marginBottom: 8, background: 'linear-gradient(135deg, ' + t.colors[0] + ', ' + t.colors[1] + ')' }} />
                    <p style={{ color: C.text, fontSize: 12, fontWeight: 600, textAlign: 'center', margin: 0 }}>{t.label}</p>
                    {active && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.text }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Custom Color</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })} style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid ' + C.inputBorder, background: 'none', cursor: 'pointer', padding: 2 }} />
                <input type="text" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })} placeholder="#7c3aed" style={{ ...inputBase, flex: 1 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Contact & Social</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Let customers reach you directly from your storefront.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>📱</span>
                <input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+234 803 123 4567" style={{ ...inputBase, paddingLeft: 40 }} />
              </div>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Customers will use this to contact you on WhatsApp</p>
            </div>
            <div>
              <label style={labelStyle}>Instagram Handle</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.muted, fontWeight: 700 }}>@</span>
                <input type="text" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="yourstorename" style={{ ...inputBase, paddingLeft: 36 }} />
              </div>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Without the @ symbol</p>
            </div>
            {(form.whatsapp || form.instagram) && (
              <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: 16 }}>
                <p style={{ color: C.subtext, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Preview on storefront:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {form.whatsapp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25d366', fontSize: 13, fontWeight: 600 }}>
                      💬 Chat on WhatsApp
                    </div>
                  )}
                  {form.instagram && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: C.pink, fontSize: 13, fontWeight: 600 }}>
                      {'📸 @' + form.instagram}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Product Categories</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Categories appear as filter pills on your storefront.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="e.g. Fashion, Electronics, Food..." style={{ ...inputBase, flex: 1 }} />
            <button onClick={addCategory} disabled={!catInput.trim()} style={{ padding: '12px 18px', borderRadius: 10, background: catInput.trim() ? C.purple : 'rgba(124,58,237,0.3)', border: 'none', color: C.text, fontSize: 14, fontWeight: 700, cursor: catInput.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
              + Add
            </button>
          </div>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏷️</div>
              <p style={{ color: C.muted, fontSize: 14 }}>No categories yet</p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Add categories to help customers find products faster</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((cat: string) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{cat}</span>
                  <button onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>x</button>
                </div>
              ))}
            </div>
          )}
          {categories.length > 0 && (
            <p style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>
              {categories.length + ' categor' + (categories.length !== 1 ? 'ies' : 'y') + ' — shown as filter buttons on your store'}
            </p>
          )}
        </div>
      )}

      {activeTab === 'popup' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Discount Popup</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            Capture leads by offering a discount. Customers enter their WhatsApp number to unlock it — and you get their contact for follow-up.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: C.input, borderRadius: 12, marginBottom: 16 }}>
            <div>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Enable popup</p>
              <p style={{ color: C.muted, fontSize: 12 }}>Show the discount popup to customers</p>
            </div>
            <button
              onClick={() => setForm({ ...form, popup_enabled: !form.popup_enabled })}
              style={{
                width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: form.popup_enabled ? C.success : 'rgba(255,255,255,0.15)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: form.popup_enabled ? 23 : 3,
                width: 22, height: 22, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {form.popup_enabled && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Discount Percentage</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setForm({ ...form, popup_discount: pct })}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                        border: form.popup_discount === pct ? '2px solid ' + C.purple : '1px solid ' + C.inputBorder,
                        background: form.popup_discount === pct ? 'rgba(124,58,237,0.1)' : C.input,
                        color: form.popup_discount === pct ? C.purple : C.subtext,
                        fontSize: 14, fontWeight: 700,
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Popup Message</label>
                <textarea
                  value={form.popup_message}
                  onChange={e => setForm({ ...form, popup_message: e.target.value })}
                  placeholder="Get 10% off your first order!"
                  rows={2}
                  maxLength={200}
                  style={{ ...inputBase, resize: 'vertical' }}
                />
              </div>

              <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ color: C.subtext, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Preview</p>
                <div style={{ fontSize: 32, marginBottom: 6 }}>🎁</div>
                <p style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                  {'Get ' + form.popup_discount + '% OFF!'}
                </p>
                <p style={{ color: C.muted, fontSize: 13 }}>{form.popup_message}</p>
              </div>
            </>
          )}
        </div>
      )}
      
    {activeTab === 'delivery' && (
  <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
    <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Delivery Fee</h2>
    <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
      Set a delivery fee for orders below your free delivery threshold. Customers pay this on delivery.
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Delivery Fee Amount</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14, fontWeight: 700 }}>₦</span>
          <input
            type="number"
            min="0"
            value={form.delivery_fee}
            onChange={e => setForm({ ...form, delivery_fee: Number(e.target.value) })}
            placeholder="e.g. 500"
            style={{ ...inputBase, paddingLeft: 32 }}
          />
        </div>
        <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Set to 0 for always-free delivery</p>
      </div>

      <div>
        <label style={labelStyle}>Free Delivery Above</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14, fontWeight: 700 }}>₦</span>
          <input
            type="number"
            min="0"
            value={form.free_delivery_above}
            onChange={e => setForm({ ...form, free_delivery_above: Number(e.target.value) })}
            placeholder="e.g. 10000"
            style={{ ...inputBase, paddingLeft: 32 }}
          />
        </div>
        <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Orders above this amount get free delivery</p>
      </div>

          {form.delivery_fee > 0 && (
            <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: 16 }}>
              <p style={{ color: C.subtext, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Preview</p>
              <p style={{ color: C.muted, fontSize: 13 }}>
                Orders below <span style={{ color: C.text, fontWeight: 700 }}>{'₦' + Number(form.free_delivery_above).toLocaleString()}</span> → delivery fee of <span style={{ color: C.purple, fontWeight: 700 }}>{'₦' + Number(form.delivery_fee).toLocaleString()}</span>
              </p>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                Orders above <span style={{ color: C.text, fontWeight: 700 }}>{'₦' + Number(form.free_delivery_above).toLocaleString()}</span> → <span style={{ color: C.success, fontWeight: 700 }}>Free delivery</span>
              </p>
            </div>
          )}
        </div>
      </div>
    )}

      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '15px 0', marginTop: 20, background: saving ? 'rgba(124,58,237,0.4)' : C.purple, border: 'none', borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saving ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
            Saving...
          </span>
        ) : saved ? (
          <span>✓ Saved!</span>
        ) : (
          <span>Save Changes</span>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}