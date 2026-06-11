'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  bg:          '#0a0a0f',
  card:        '#12121a',
  cardBorder:  'rgba(255,255,255,0.08)',
  input:       '#1a1a2e',
  inputBorder: 'rgba(255,255,255,0.1)',
  purple:      '#7c3aed',
  pink:        '#ec4899',
  green:       '#25d366',
  success:     '#10b981',
  muted:       '#6b7280',
  subtext:     '#9ca3af',
  text:        '#ffffff',
  amber:       '#f59e0b',
  red:         '#ef4444',
};

interface Store {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
}

export default function StorefrontPage() {
  const { slug } = useParams();

  const [store, setStore]       = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Order modal state
  const [ordering, setOrdering]   = useState<Product | null>(null);
  const [form, setForm]           = useState({ name: '', phone: '', note: '', quantity: 1 });
  const [placing, setPlacing]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [orderNum, setOrderNum]   = useState('');
  const [formError, setFormError] = useState('');
  const [interestId, setInterestId] = useState<string | null>(null);

  // Category filter
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        // Get store by slug
        const storeRes = await api.get(`/api/store/slug/${slug}`);
        setStore(storeRes.data);

        // Get public products
        const productsRes = await api.get(
          `/api/products/public/${storeRes.data.id}`
        );
        setProducts(productsRes.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // Get unique categories
  const categories = [
    'All',
    ...Array.from(
      new Set(
        products
          .map(p => p.category)
          .filter(Boolean) as string[]
      )
    ),
  ];

  const filtered = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  // Track abandoned interest when order modal opens
  async function openOrderModal(product: Product) {
    setOrdering(product);
    setFormError('');
    setSuccess(false);
    setForm({ name: '', phone: '', note: '', quantity: 1 });
    if (store) {
      try {
        const res = await api.post('/api/abandoned/', {
          store_id: store.id,
          product_id: product.id,
        });
        setInterestId(res.data.id);
      } catch {}
    }
  }

  async function placeOrder() {
    if (!ordering || !form.name || !form.phone) {
      setFormError('Please fill in your name and WhatsApp number.');
      return;
    }
    setPlacing(true);
    setFormError('');
    try {
      const res = await api.post('/api/orders/', {
        product_id: ordering.id,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_note: form.note || undefined,
        quantity: form.quantity,
      });
      // Mark interest as converted
      if (interestId) {
        await api.put(`/api/abandoned/${interestId}/convert`).catch(() => {});
      }
      setOrderNum(res.data.order_number || res.data.id.slice(0, 8).toUpperCase());
      setSuccess(true);
      setOrdering(null);
    } catch (err: any) {
      setFormError(
        err.response?.data?.detail || 'Failed to place order. Please try again.'
      );
    } finally {
      setPlacing(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: `3px solid rgba(124,58,237,0.2)`,
        borderTopColor: C.purple,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Not Found ────────────────────────────────────────────────────
  if (notFound) return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 64 }}>🏪</div>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700 }}>
        Store not found
      </h1>
      <p style={{ color: C.muted, fontSize: 15 }}>
        This store link may have changed or been removed.
      </p>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
        Powered by{' '}
        <span style={{ color: C.purple, fontWeight: 700 }}>Sellora</span>
      </p>
    </div>
  );

  // ── Order Success Screen ─────────────────────────────────────────
  if (success) return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', textAlign: 'center',
    }}>
      {/* Glowing checkmark */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)',
        border: `2px solid ${C.success}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 0 40px rgba(16,185,129,0.3)',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24"
          fill="none" stroke={C.success} strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Order number */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '6px 16px', marginBottom: 20,
        color: C.subtext, fontSize: 13, fontWeight: 600,
      }}>
        Order #{orderNum}
      </div>

      <h1 style={{
        color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 4,
      }}>
        Order Placed
      </h1>
      <h2 style={{
        fontSize: 28, fontWeight: 800, marginBottom: 16,
        background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Successfully!
      </h2>
      <p style={{ color: C.subtext, fontSize: 15, marginBottom: 28, maxWidth: 320 }}>
        Thank you for shopping with us. Your unique order link
        has been generated and shared.
      </p>

      {/* WhatsApp info card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '20px',
        marginBottom: 24, textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(37,211,102,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke={C.green} strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
              Sent to WhatsApp
            </p>
            <p style={{ color: C.muted, fontSize: 12 }}>
              Seller usually responds in ~5 mins
            </p>
          </div>
        </div>
        <p style={{ color: C.subtext, fontSize: 13, lineHeight: 1.6 }}>
          Your order details have been forwarded to the seller.
          They will contact you shortly to confirm payment and delivery.
        </p>
      </div>

      {/* Back to store */}
      <button
        onClick={() => setSuccess(false)}
        style={{
          width: '100%', maxWidth: 380,
          padding: '16px 0',
          background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
          border: 'none', borderRadius: 12,
          color: C.text, fontSize: 15, fontWeight: 700,
          cursor: 'pointer', marginBottom: 12,
        }}
      >
        Back to Store 🛍
      </button>

      <p style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>
        Powered by <span style={{ color: C.purple, fontWeight: 700 }}>Sellora</span>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Main Storefront ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{
          padding: '40px 20px 32px',
          background: `linear-gradient(180deg, rgba(124,58,237,0.15) 0%, transparent 100%)`,
          borderBottom: `1px solid ${C.cardBorder}`,
        }}>
          {/* Store logo or emoji */}
          {store?.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.store_name}
              style={{
                width: 64, height: 64, borderRadius: 16,
                objectFit: 'cover', marginBottom: 16,
                border: `1px solid ${C.cardBorder}`,
              }}
            />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, marginBottom: 16,
            }}>
              🏪
            </div>
          )}

          <h1 style={{
            color: C.text, fontSize: 26, fontWeight: 800,
            marginBottom: 6, letterSpacing: '-0.3px',
          }}>
            {store?.store_name}
          </h1>

          {store?.description && (
            <p style={{
              color: C.subtext, fontSize: 14,
              lineHeight: 1.6, marginBottom: 16,
            }}>
              {store.description}
            </p>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 20, padding: '4px 12px',
              color: C.subtext, fontSize: 12,
            }}>
              {products.length} products
            </span>
            <span style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 20, padding: '4px 12px',
              color: C.success, fontSize: 12,
            }}>
              ⚡ Fast replies
            </span>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div style={{
            display: 'flex', gap: 8, padding: '16px 20px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 13,
                  fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                  border: activeCategory === cat
                    ? 'none'
                    : `1px solid ${C.cardBorder}`,
                  background: activeCategory === cat
                    ? C.purple
                    : 'transparent',
                  color: activeCategory === cat ? C.text : C.subtext,
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        <div style={{ padding: '8px 20px 80px' }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <p style={{ color: C.muted, fontSize: 15 }}>
                No products available yet
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              {filtered.map(product => (
                <div
                  key={product.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: 16, overflow: 'hidden',
                  }}
                >
                  {/* Product image */}
                  <div style={{
                    aspectRatio: '1',
                    background: '#1a1a26',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 36,
                      }}>
                        🛍️
                      </div>
                    )}

                    {/* Stock badge */}
                    {product.stock <= 3 && product.stock > 0 && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: C.amber, borderRadius: 6,
                        padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        color: '#000',
                      }}>
                        {product.stock} left
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: C.red, borderRadius: 6,
                        padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        color: C.text,
                      }}>
                        Sold out
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div style={{ padding: '12px' }}>
                    <p style={{
                      color: C.text, fontSize: 13, fontWeight: 600,
                      marginBottom: 2, lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {product.name}
                    </p>
                    {product.category && (
                      <p style={{
                        color: C.muted, fontSize: 11, marginBottom: 6,
                      }}>
                        {product.category}
                      </p>
                    )}
                    <p style={{
                      color: C.text, fontSize: 16, fontWeight: 800,
                      marginBottom: 10,
                    }}>
                      ₦{Number(product.price).toLocaleString()}
                    </p>
                    <button
                      onClick={() => openOrderModal(product)}
                      disabled={product.stock === 0 || !product.is_available}
                      style={{
                        width: '100%', padding: '9px 0',
                        background: product.stock === 0 || !product.is_available
                          ? 'rgba(255,255,255,0.05)'
                          : C.purple,
                        border: 'none', borderRadius: 8,
                        color: product.stock === 0 || !product.is_available
                          ? C.muted
                          : C.text,
                        fontSize: 12, fontWeight: 700,
                        cursor: product.stock === 0 || !product.is_available
                          ? 'not-allowed'
                          : 'pointer',
                      }}
                    >
                      {product.stock === 0 ? 'Out of stock' : 'Order Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '20px',
          borderTop: `1px solid ${C.cardBorder}`,
        }}>
          <p style={{ color: C.muted, fontSize: 12 }}>
            Powered by{' '}
            <span style={{ color: C.purple, fontWeight: 700 }}>Sellora</span>
          </p>
        </div>
      </div>

      {/* ── Order Modal ─────────────────────────────────────────── */}
      {ordering && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setOrdering(null)}
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
            animation: 'slideup 0.25s ease',
          }}>
            {/* Drag handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 20px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', marginBottom: 20,
            }}>
              <div>
                <h3 style={{
                  color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 4,
                }}>
                  {ordering.name}
                </h3>
                <p style={{
                  fontSize: 22, fontWeight: 800,
                  background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  ₦{Number(ordering.price).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setOrdering(null)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.muted, fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            {/* Error */}
            {formError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, padding: '10px 14px',
                color: C.red, fontSize: 13, marginBottom: 16,
              }}>
                {formError}
              </div>
            )}

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Name */}
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name *"
                style={{
                  width: '100%', background: C.input,
                  border: `1px solid ${C.inputBorder}`,
                  borderRadius: 12, padding: '13px 16px',
                  color: C.text, fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Phone */}
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="WhatsApp number * (e.g. +234 803 123 4567)"
                style={{
                  width: '100%', background: C.input,
                  border: `1px solid ${C.inputBorder}`,
                  borderRadius: 12, padding: '13px 16px',
                  color: C.text, fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Quantity */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: C.input,
                border: `1px solid ${C.inputBorder}`,
                borderRadius: 12, padding: '12px 16px',
              }}>
                <span style={{ color: C.subtext, fontSize: 14 }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button
                    onClick={() => setForm(f => ({
                      ...f, quantity: Math.max(1, f.quantity - 1)
                    }))}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none', cursor: 'pointer',
                      color: C.text, fontSize: 16, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    −
                  </button>
                  <span style={{ color: C.text, fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                    {form.quantity}
                  </span>
                  <button
                    onClick={() => setForm(f => ({
                      ...f,
                      quantity: Math.min(ordering.stock, f.quantity + 1)
                    }))}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none', cursor: 'pointer',
                      color: C.text, fontSize: 16, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Note */}
              <textarea
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="Any note for the seller? (optional)"
                rows={2}
                style={{
                  width: '100%', background: C.input,
                  border: `1px solid ${C.inputBorder}`,
                  borderRadius: 12, padding: '13px 16px',
                  color: C.text, fontSize: 14, outline: 'none',
                  resize: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Secure order banner */}
            <div style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 12, padding: '12px 16px',
              marginTop: 16, marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke={C.purple} strokeWidth="2"
                style={{ marginTop: 1, flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p style={{ color: C.subtext, fontSize: 12, lineHeight: 1.5 }}>
                <strong style={{ color: C.text }}>Secure Order</strong> — Your order
                details will be sent directly to the seller via WhatsApp.
                Pay on delivery or via bank transfer.
              </p>
            </div>

            {/* Total */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <span style={{ color: C.subtext, fontSize: 14 }}>Order Subtotal</span>
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>
                ₦{(Number(ordering.price) * form.quantity).toLocaleString()}
              </span>
            </div>

            {/* Confirm button */}
            <button
              onClick={placeOrder}
              disabled={placing || !form.name || !form.phone}
              style={{
                width: '100%', padding: '16px 0',
                background: placing || !form.name || !form.phone
                  ? 'rgba(124,58,237,0.3)'
                  : `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
                border: 'none', borderRadius: 12,
                color: C.text, fontSize: 15, fontWeight: 800,
                cursor: placing || !form.name || !form.phone
                  ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              {placing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Placing order...
                </span>
              ) : (
                <span>
                  🛍 Confirm Order — ₦{(Number(ordering.price) * form.quantity).toLocaleString()}
                </span>
              )}
            </button>

            <p style={{
              color: C.muted, fontSize: 11,
              textAlign: 'center', marginTop: 10,
            }}>
              By clicking confirm, you agree to our Terms of Service
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideup {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}