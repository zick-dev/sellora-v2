'use client';
import { useTheme } from '@/lib/theme';

import { useEffect, useState } from 'react';
import VariantBuilder from '@/components/VariantBuilder';
import api from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import { useDashboard } from '../layout';


interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  created_at: string;
}

const emptyForm = {
  name: '', price: '', stock: '', category: '',
  description: '', image_url: '', is_available: true,
};

export default function ProductsPage() {
  const { C } = useTheme();
  const [products, setProducts]   = useState<Product[]>([]);
  const { store } = useDashboard();
  const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: 'GH₵', KES: 'KSh', ZAR: 'R', TRY: '₺' };
  const sym = CURRENCY_SYMBOLS[(store as any)?.base_currency || 'NGN'] || ((store as any)?.base_currency || 'NGN') + ' ';
  const [storeId, setStoreId]     = useState('');
  const [storeCategories, setStoreCategories] = useState<string[]>([]);
  const [storeType, setStoreType] = useState('general');
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingCatalog, setGeneratingCatalog] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const storeRes = await api.get('/api/store/me');
        setStoreId(storeRes.data.id);
        try {
          const cats = JSON.parse(storeRes.data.categories || '[]');
          setStoreCategories(Array.isArray(cats) ? cats : []);
        } catch { setStoreCategories([]); }
        setStoreType(storeRes.data.category_type || 'general');
        const productsRes = await api.get(
          `/api/products/store/${storeRes.data.id}`
        );
        setProducts(productsRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setVariants([]);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name:        p.name,
      price:       String(p.price),
      stock:       String(p.stock),
      category:    p.category || '',
      description: p.description || '',
      image_url:   p.image_url || '',
      is_available: p.is_available,
    });
    setVariants((p as any).variants || []);
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.stock) {
      setError('Name, price and stock are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name:        form.name,
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock),
        category:    form.category || null,
        description: form.description || null,
        image_url:   form.image_url || null,
        is_available: form.is_available,
        variants:    variants.length > 0 ? variants : [],
      };
      if (editing) {
        const res = await api.put(`/api/products/${editing.id}`, payload);
        setProducts(prev =>
          prev.map(p => p.id === editing.id ? res.data : p)
        );
      } else {
        const res = await api.post(
          `/api/products/store/${storeId}`, payload
        );
        setProducts(prev => [res.data, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete product.');
    } finally {
      setDeleting(null);
    }
  }

  const inputStyle = {
    width: '100%', background: C.input,
    border: `1px solid ${C.inputBorder}`,
    borderRadius: 10, padding: '12px 14px',
    color: C.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: C.subtext, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 6,
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: 300,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid rgba(124,58,237,0.2)`,
        borderTopColor: C.purple,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            color: C.text, fontSize: 24, fontWeight: 800,
            marginBottom: 4,
          }}>
            Products
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in your store
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: C.purple, border: 'none',
            borderRadius: 10, padding: '10px 18px',
            color: C.text, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6,
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, padding: '60px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <h3 style={{
            color: C.text, fontSize: 18,
            fontWeight: 700, marginBottom: 8,
          }}>
            No products yet
          </h3>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
            Add your first product to start selling
          </p>
          <button
            onClick={openAdd}
            style={{
              background: C.purple, border: 'none',
              borderRadius: 10, padding: '12px 24px',
              color: C.text, fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add Product
          </button>
        </div>
      ) : (
        /* Products grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {products.map(product => (
            <div
              key={product.id}
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: 14, overflow: 'hidden',
              }}
            >
              {/* Image */}
              <div style={{
                aspectRatio: '1', background: '#ffffff',
                position: 'relative', overflow: 'hidden',
                border: '1px solid #1e1e30',
              }}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 32,
                  }}>
                    🛍️
                  </div>
                )}
                {/* Stock badge */}
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: product.stock === 0
                    ? C.red
                    : product.stock <= 3
                    ? C.amber
                    : C.green,
                  borderRadius: 6, padding: '2px 6px',
                  fontSize: 10, fontWeight: 700,
                  color: product.stock <= 3 && product.stock > 0
                    ? '#000' : C.text,
                }}>
                  {product.stock === 0
                    ? 'Out'
                    : product.stock <= 3
                    ? `${product.stock} left`
                    : 'In stock'
                  }
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '10px' }}>
                <p style={{
                  color: C.text, fontSize: 13, fontWeight: 600,
                  marginBottom: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </p>
                {product.category && (
                  <p style={{
                    color: C.muted, fontSize: 11, marginBottom: 4,
                  }}>
                    {product.category}
                  </p>
                )}
                <p style={{
                  color: C.purple, fontSize: 14,
                  fontWeight: 800, marginBottom: 8,
                }}>
                  {sym}{Number(product.price).toLocaleString()}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => openEdit(product)}
                    style={{
                      flex: 1, padding: '7px 0',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      borderRadius: 7, color: C.purple,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    style={{
                      flex: 1, padding: '7px 0',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 7, color: C.red,
                      fontSize: 12, fontWeight: 600,
                      cursor: deleting === product.id
                        ? 'not-allowed' : 'pointer',
                      opacity: deleting === product.id ? 0.5 : 1,
                    }}
                  >
                    {deleting === product.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ─────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 480,
            background: C.card,
            borderRadius: '20px 20px 0 0',
            border: `1px solid ${C.cardBorder}`,
            padding: '20px 20px 32px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 20px',
            }} />

            {/* Title */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 20,
            }}>
              <h3 style={{
                color: C.text, fontSize: 18, fontWeight: 800,
              }}>
                {editing ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: 'pointer',
                  color: C.muted, fontSize: 18,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, padding: '10px 14px',
                color: C.red, fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ankara Wrap Top"
                  style={inputStyle}
                />
              </div>

              {/* Price + Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Price ({sym}) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="8500"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="10"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                {storeCategories.length > 0 ? (
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select a category</option>
                    {storeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ color: C.amber, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No categories yet</p>
                    <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                      Create categories in Storefront Settings first so customers can browse by category.
                    </p>
                    <a href="/storefront" style={{ color: C.purple, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      Go to Storefront Settings →
                    </a>
                  </div>
                )}
              </div>

              {/* Variants */}
              <div>
                <VariantBuilder
                  storeType={storeType}
                  basePrice={form.price}
                  variants={variants}
                  onChange={setVariants}
                  C={C}
                />
              </div>

              {/* Description */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
                  <button
                    type="button"
                    disabled={!form.name || generatingDesc}
                    onClick={async () => {
                      setGeneratingDesc(true);
                      try {
                        const res = await api.post('/api/ai/product-description', { name: form.name, category: form.category || '' });
                        if (res.data?.description) setForm({ ...form, description: res.data.description });
                      } catch { /* silently fail */ }
                      setGeneratingDesc(false);
                    }}
                    style={{
                      background: 'none', border: '1px solid ' + C.inputBorder, borderRadius: 8,
                      padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      color: !form.name ? C.muted : C.purple, cursor: !form.name ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, opacity: !form.name ? 0.5 : 1,
                    }}
                  >
                    {generatingDesc ? '⏳ Generating...' : '✨ AI Generate'}
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your product, or use AI Generate above..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <ImageUpload
                  value={form.image_url}
                  onChange={url => setForm({ ...form, image_url: url })}
                  label="Product Image (optional)"
                  hint="Square image recommended. Drag & drop or click to upload."
                  aspectRatio="1"
                  placeholder="🛍️"
                />
                {form.image_url && (
                  <button
                    type="button"
                    disabled={generatingCatalog}
                    onClick={async () => {
                      setGeneratingCatalog(true);
                      try {
                        const res = await api.post('/api/ai/catalog-from-image', { image_url: form.image_url });
                        if (res.data) {
                          setForm({
                            ...form,
                            name: res.data.name || form.name,
                            description: res.data.description || form.description,
                            category: res.data.category || form.category,
                          });
                        }
                      } catch {}
                      setGeneratingCatalog(false);
                    }}
                    style={{
                      width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10,
                      border: '1px solid ' + C.inputBorder, background: generatingCatalog ? C.input : 'rgba(79,70,229,0.06)',
                      color: C.purple, fontSize: 13, fontWeight: 700, cursor: generatingCatalog ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {generatingCatalog ? '⏳ Analyzing image...' : '✨ AI Fill Details from Photo'}
                  </button>
                )}
              </div>

              {/* Available toggle */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: C.input,
                border: `1px solid ${C.inputBorder}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
                    Available for purchase
                  </p>
                  <p style={{ color: C.muted, fontSize: 12 }}>
                    Show this product on your storefront
                  </p>
                </div>
                <button
                  onClick={() => setForm(f => ({
                    ...f, is_available: !f.is_available
                  }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.is_available
                      ? C.purple : 'rgba(255,255,255,0.1)',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2,
                    left: form.is_available ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px 0',
                  background: saving
                    ? 'rgba(124,58,237,0.4)' : C.purple,
                  border: 'none', borderRadius: 10,
                  color: C.text, fontSize: 15, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                }}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Saving...
                  </span>
                ) : (
                  editing ? 'Update Product' : 'Add Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}