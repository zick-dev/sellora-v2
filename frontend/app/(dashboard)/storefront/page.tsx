'use client';
import { useTheme } from '@/lib/theme';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import VideoUpload from '@/components/VideoUpload';


const THEMES = [
  { value: '#4F46E5', label: 'Indigo',  colors: ['#4F46E5', '#6366F1'] },
  { value: '#10b981', label: 'Emerald', colors: ['#10b981', '#059669'] },
  { value: '#0ea5e9', label: 'Ocean',   colors: ['#0ea5e9', '#06b6d4'] },
  { value: '#f97316', label: 'Sunset',  colors: ['#f97316', '#ec4899'] },
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

const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: 'GH₵', KES: 'KSh', ZAR: 'R', TRY: '₺' };

export default function StorefrontPage() {
  const { C } = useTheme();
  const [store, setStore]         = useState<Store | null>(null);
  const [isPro, setIsPro]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [generatingPolicy, setGeneratingPolicy] = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'contact' | 'categories' | 'popup' | 'delivery' | 'policies'>('general');
  const [catInput, setCatInput]   = useState('');

  const [form, setForm] = useState({
    store_name:     '',
    description:    '',
    logo_url:       '',
    banner_url:     '',
    banner_type:    'image',
    theme_color:    '#4F46E5',
    whatsapp:       '',
    instagram:      '',
    categories:     '[]',
    popup_enabled:  false,
    popup_discount: 10,
    popup_message:  'Get a discount on your order!',
    base_currency:  'USD',
    category_type:  'general',
    show_trust_bar: true,
    delivery_fee:          0,
    free_delivery_above:   10000,
    bank_name:             '',
    account_name:          '',
    account_number:        '',
    bank_iban:              '',
    bank_routing_number:    '',
    bank_account_type:      'local',
    return_policy:          '',
    shipping_policy:        '',
    terms_of_service:       '',
  });

  const categories: string[] = (() => {
    try { return JSON.parse(form.categories); } catch { return []; }
  })();
  const sym = CURRENCY_SYMBOLS[form.base_currency] || form.base_currency + ' ';

  useEffect(() => {
    const load = async () => {
      try {
        const [storeResult, subResult] = await Promise.allSettled([
          api.get('/api/store/me'),
          api.get('/api/subscription/status'),
        ]);
        if (subResult.status === 'fulfilled') setIsPro(subResult.value.data.is_pro || false);
        if (storeResult.status !== 'fulfilled') return;
        const res = storeResult.value;
        setStore(res.data);
        setForm({
          store_name:     res.data.store_name || '',
          description:    res.data.description || '',
          logo_url:       res.data.logo_url || '',
          banner_url:     res.data.banner_url || '',
          banner_type:    res.data.banner_type || 'image',
          theme_color:    res.data.theme_color || '#4F46E5',
          whatsapp:       res.data.whatsapp || '',
          instagram:      res.data.instagram || '',
          categories:     res.data.categories || '[]',
          popup_enabled:  res.data.popup_enabled ?? false,
          popup_discount: res.data.popup_discount ?? 10,
          popup_message:  res.data.popup_message || 'Get a discount on your order!',
          base_currency:  res.data.base_currency || 'USD',
          category_type:  res.data.category_type || 'general',
          show_trust_bar: res.data.show_trust_bar ?? true,
          delivery_fee:         res.data.delivery_fee ?? 0,
          free_delivery_above:  res.data.free_delivery_above ?? 10000,
          bank_name:            res.data.bank_name ?? '',
          account_name:         res.data.account_name ?? '',
          account_number:       res.data.account_number ?? '',
          bank_iban:            res.data.bank_iban ?? '',
          bank_routing_number:  res.data.bank_routing_number ?? '',
          bank_account_type:    res.data.bank_iban ? 'iban' : res.data.bank_routing_number ? 'us' : 'local',
          return_policy:        res.data.return_policy ?? '',
          shipping_policy:      res.data.shipping_policy ?? '',
          terms_of_service:     res.data.terms_of_service ?? '',
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
        banner_type:    form.banner_type,
        theme_color:    form.theme_color,
        whatsapp:       form.whatsapp || null,
        instagram:      form.instagram || null,
        categories:     form.categories,
        popup_enabled:  form.popup_enabled,
        popup_discount: form.popup_discount,
        popup_message:  form.popup_message,
        base_currency:  form.base_currency,
        category_type:  form.category_type,
        show_trust_bar: form.show_trust_bar,
        delivery_fee:         form.delivery_fee ?? 0,
        free_delivery_above:  form.free_delivery_above ?? 10000,
        bank_name:            form.bank_name || null,
        account_name:         form.account_name || null,
        account_number:       form.bank_account_type === 'local' ? (form.account_number || null) : null,
        bank_iban:            form.bank_account_type === 'iban' ? (form.bank_iban || null) : null,
        bank_routing_number:  form.bank_account_type === 'us' ? (form.bank_routing_number || null) : null,
        return_policy:        form.return_policy || null,
        shipping_policy:      form.shipping_policy || null,
        terms_of_service:     form.terms_of_service || null,
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
    { key: 'policies', label: 'Policies', icon: '📜' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(79,70,229,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
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
        background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(236,72,153,0.08))',
        border: '1px solid rgba(79,70,229,0.2)',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(79,70,229,0.1)' : C.card,
              border: activeTab === tab.key ? '1.5px solid ' + C.purple : '1px solid ' + C.cardBorder,
              color: activeTab === tab.key ? C.purple : C.muted,
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
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
                <option value="TRY">TRY — Turkish Lira (&#8378;)</option>
              </select>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Prices on your storefront will show in this currency</p>
            </div>
            <div>
              <label style={labelStyle}>Store Type</label>
              <select
                value={form.category_type}
                onChange={e => setForm({ ...form, category_type: e.target.value })}
                style={{ width: '100%', background: C.input, border: '1.5px solid ' + C.inputBorder, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
              >
                <option value="general">General Store</option>
                <option value="clothing">Clothing & Fashion</option>
                <option value="shoes">Shoes & Footwear</option>
                <option value="beauty">Beauty & Cosmetics</option>
                <option value="electronics">Electronics & Gadgets</option>
                <option value="food">Food & Groceries</option>
                <option value="jewelry">Jewelry & Accessories</option>
              </select>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Helps suggest the right product variants (e.g. size, color) when adding products</p>
            </div>
          </div>

          {/* Trust Bar Toggle */}
          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Trust Bar</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Show the scrolling trust badges on your storefront (Pay on Delivery, Secure Checkout, etc.)</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.subtext, fontSize: 14 }}>Show trust bar</span>
              <div onClick={() => setForm({ ...form, show_trust_bar: !form.show_trust_bar })}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.show_trust_bar ? C.purple : C.inputBorder, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.show_trust_bar ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* Custom Domain — Pro Feature */}
          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(90deg, #4F46E5, #ec4899)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>PRO</div>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Custom Domain</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Use your own domain (e.g. <span style={{ color: C.purple, fontWeight: 600 }}>shop.yourbrand.com</span>) instead of the default Kormerce URL. Available on Pro plan.
            </p>
            {isPro ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder="shop.yourbrand.com"
                  style={{ width: '100%', background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
                />
                <div style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ color: C.subtext, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Setup Instructions:</p>
                  <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                    1. Add a CNAME record in your DNS pointing to <span style={{ color: C.purple, fontFamily: 'monospace' }}>cname.kormerce.com</span><br/>
                    2. Enter your domain above and contact support to complete setup.<br/>
                    3. SSL certificate will be issued automatically.
                  </p>
                </div>
                <button style={{ padding: '10px 20px', borderRadius: 9, background: C.purple, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  Request Domain Setup
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <p style={{ color: C.muted, fontSize: 13 }}>Upgrade to Pro to use a custom domain.</p>
                <a href="/upgrade" style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(90deg, #4F46E5, #ec4899)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                  Upgrade to Pro →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'general' && store && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24, marginTop: 16 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sell on Facebook &amp; Instagram</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
            Connect this feed URL in Meta Commerce Manager to sync your products to Facebook Shop, Instagram Shopping, and WhatsApp catalogs.
          </p>
          <div style={{ background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ color: C.purple, fontSize: 12.5, fontFamily: 'monospace', wordBreak: 'break-all', flex: '1 1 240px' }}>
              https://sellora-v2-production.up.railway.app/api/products/store/{store.id}/catalog.csv
            </p>
            <button
              onClick={() => {
                const feedUrl = 'https://sellora-v2-production.up.railway.app/api/products/store/' + store.id + '/catalog.csv';
                navigator.clipboard.writeText(feedUrl);
              }}
              style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: C.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              Copy Feed URL
            </button>
          </div>
          <p style={{ color: C.muted, fontSize: 11.5, marginTop: 10 }}>
            In Meta Commerce Manager: Catalog → Add Items → Data Feed → paste this URL. Meta will re-check it periodically for updates.
          </p>
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
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Hero media at the top of your storefront. Choose an image or a short video (max 10 seconds) to showcase your products.</p>

            {/* Image / Video toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setForm({ ...form, banner_type: 'image', banner_url: form.banner_type === 'video' ? '' : form.banner_url })}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: form.banner_type === 'image' ? 'none' : '1px solid ' + C.cardBorder, background: form.banner_type === 'image' ? C.purple : 'transparent', color: form.banner_type === 'image' ? '#fff' : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🖼️ Image
              </button>
              <button
                onClick={() => setForm({ ...form, banner_type: 'video', banner_url: form.banner_type === 'image' ? '' : form.banner_url })}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: form.banner_type === 'video' ? 'none' : '1px solid ' + C.cardBorder, background: form.banner_type === 'video' ? C.purple : 'transparent', color: form.banner_type === 'video' ? '#fff' : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🎬 Video
              </button>
            </div>

            {form.banner_type === 'video' ? (
              <VideoUpload
                value={form.banner_url}
                onChange={url => setForm({ ...form, banner_url: url })}
                label="Store Banner Video"
                hint="Max 10 seconds. Will autoplay on loop, muted, on your storefront."
                maxDurationSec={10}
              />
            ) : (
              <ImageUpload
                value={form.banner_url}
                onChange={url => setForm({ ...form, banner_url: url })}
                label="Store Banner"
                hint="Wide image recommended (1200x400px)."
                aspectRatio="3"
                placeholder="🖼️"
              />
            )}
          </div>

          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Theme Color</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Primary color for buttons and accents on your storefront.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {THEMES.map(t => {
                const active = form.theme_color === t.value;
                return (
                  <button key={t.value} onClick={() => setForm({ ...form, theme_color: t.value })} style={{ padding: 12, borderRadius: 12, cursor: 'pointer', border: active ? '2px solid rgba(79,70,229,0.6)' : '1px solid ' + C.cardBorder, background: active ? 'rgba(79,70,229,0.08)' : C.input, position: 'relative', transition: 'all 0.15s' }}>
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
                <input type="text" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })} placeholder="#4F46E5" style={{ ...inputBase, flex: 1 }} />
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
              <div style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12, padding: 16 }}>
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
            <button onClick={addCategory} disabled={!catInput.trim()} style={{ padding: '12px 18px', borderRadius: 10, background: catInput.trim() ? C.purple : 'rgba(79,70,229,0.3)', border: 'none', color: C.text, fontSize: 14, fontWeight: 700, cursor: catInput.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
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
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)' }}>
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
                        background: form.popup_discount === pct ? 'rgba(79,70,229,0.1)' : C.input,
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

              <div style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
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
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14, fontWeight: 700 }}>{sym}</span>
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
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14, fontWeight: 700 }}>{sym}</span>
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
            <div style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12, padding: 16 }}>
              <p style={{ color: C.subtext, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Preview</p>
              <p style={{ color: C.muted, fontSize: 13 }}>
                Orders below <span style={{ color: C.text, fontWeight: 700 }}>{sym + Number(form.free_delivery_above).toLocaleString()}</span> → delivery fee of <span style={{ color: C.purple, fontWeight: 700 }}>{sym + Number(form.delivery_fee).toLocaleString()}</span>
              </p>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                Orders above <span style={{ color: C.text, fontWeight: 700 }}>{sym + Number(form.free_delivery_above).toLocaleString()}</span> → <span style={{ color: C.success, fontWeight: 700 }}>Free delivery</span>
              </p>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Bank Transfer Details */}
      {activeTab === 'delivery' && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Bank Transfer Details</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            Enable bank transfer as a payment option. Customers will see these details at checkout and upload a transfer receipt.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Account Type</label>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Choose the type that matches how you receive payments.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'local', label: 'Local Bank Account' },
                  { key: 'iban', label: 'IBAN' },
                  { key: 'us', label: 'US Bank Account' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm({ ...form, bank_account_type: opt.key })}
                    style={{
                      padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      border: form.bank_account_type === opt.key ? '1.5px solid ' + C.purple : '1px solid ' + C.inputBorder,
                      background: form.bank_account_type === opt.key ? 'rgba(79,70,229,0.08)' : 'transparent',
                      color: form.bank_account_type === opt.key ? C.purple : C.muted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Account Name</label>
              <input
                type="text"
                value={form.account_name}
                onChange={e => setForm({ ...form, account_name: e.target.value })}
                placeholder="e.g. Amaka Johnson"
                style={inputBase}
              />
            </div>

            {form.bank_account_type === 'local' && (
              <>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={e => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. Access Bank, GTBank, First Bank"
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Account Number</label>
                  <input
                    type="text"
                    value={form.account_number}
                    onChange={e => setForm({ ...form, account_number: e.target.value })}
                    placeholder="e.g. 0123456789"
                    style={inputBase}
                    maxLength={15}
                  />
                </div>
              </>
            )}

            {form.bank_account_type === 'iban' && (
              <>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={e => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. Türkiye İş Bankası, Deutsche Bank"
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={labelStyle}>IBAN</label>
                  <input
                    type="text"
                    value={form.bank_iban}
                    onChange={e => setForm({ ...form, bank_iban: e.target.value.toUpperCase() })}
                    placeholder="e.g. TR98 0006 4000 0011 2345 6789 01"
                    style={inputBase}
                    maxLength={34}
                  />
                </div>
              </>
            )}

            {form.bank_account_type === 'us' && (
              <>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={e => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. Chase, Bank of America"
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Routing Number</label>
                  <input
                    type="text"
                    value={form.bank_routing_number}
                    onChange={e => setForm({ ...form, bank_routing_number: e.target.value })}
                    placeholder="e.g. 021000021"
                    style={inputBase}
                    maxLength={9}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Account Number</label>
                  <input
                    type="text"
                    value={form.account_number}
                    onChange={e => setForm({ ...form, account_number: e.target.value })}
                    placeholder="e.g. 1234567890"
                    style={inputBase}
                    maxLength={17}
                  />
                </div>
              </>
            )}

            {form.bank_name && (form.account_number || form.bank_iban || form.bank_routing_number) && (
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: 16 }}>
                <p style={{ color: C.subtext, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bank Transfer Enabled ✓</p>
                <p style={{ color: C.muted, fontSize: 13 }}>
                  Customers will see "Bank Transfer" as a payment option at checkout with your account details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Store Policies</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            Write your own policies or let AI draft them for you. Shown to buyers on your storefront.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { key: 'return_policy', label: 'Return & Refund Policy', policyType: 'return_policy' },
              { key: 'shipping_policy', label: 'Shipping & Delivery Policy', policyType: 'shipping_policy' },
              { key: 'terms_of_service', label: 'Terms of Service', policyType: 'terms_of_service' },
            ].map(p => (
              <div key={p.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>{p.label}</label>
                  <button
                    type="button"
                    disabled={generatingPolicy === p.key}
                    onClick={async () => {
                      setGeneratingPolicy(p.key);
                      try {
                        const res = await api.post('/api/ai/generate-policy', {
                          policy_type: p.policyType,
                          store_name: form.store_name || 'my store',
                        });
                        if (res.data?.content) setForm({ ...form, [p.key]: res.data.content });
                      } catch {}
                      setGeneratingPolicy(null);
                    }}
                    style={{
                      background: 'none', border: '1px solid ' + C.inputBorder, borderRadius: 8,
                      padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      color: C.purple, cursor: 'pointer',
                    }}
                  >
                    {generatingPolicy === p.key ? '⏳ Generating...' : '✨ AI Generate'}
                  </button>
                </div>
                <textarea
                  value={(form as any)[p.key]}
                  onChange={e => setForm({ ...form, [p.key]: e.target.value })}
                  placeholder={`Write your ${p.label.toLowerCase()}, or use AI Generate above...`}
                  rows={6}
                  style={{ ...inputBase, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}


      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '15px 0', marginTop: 20, background: saving ? 'rgba(79,70,229,0.4)' : C.purple, border: 'none', borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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