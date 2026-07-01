'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Store {
  id: string; store_name: string; slug: string; logo_url: string | null;
  theme_color: string; base_currency?: string; whatsapp: string | null;
}
interface Product {
  id: string; name: string; description: string | null; price: number;
  price_currency?: string | null; stock: number; image_url: string | null;
  category: string | null; is_available: boolean;
  images?: { image_url: string }[];
}

const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: 'GH₵', KES: 'KSh', ZAR: 'R', TRY: '₺' };

export default function ProductPageClient({ storeSlug, productSlug }: { storeSlug: string; productSlug: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sr = await api.get('/api/store/slug/' + storeSlug);
        setStore(sr.data);
        const pr = await api.get(`/api/products/public/${sr.data.id}/slug/${productSlug}`);
        setProduct(pr.data);

        // Track the view/click (fails silently)
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const source = urlParams.get('src') || 'direct';
          await api.post('/api/products/track-click', { product_id: pr.data.id, store_id: sr.data.id, source });
        } catch {}
      } catch (err) {
        console.error('Product page load error:', err);
      }
      setLoading(false);
    }
    load();
  }, [storeSlug, productSlug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e5e5e5', borderTopColor: '#4F46E5', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>😕</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 }}>Product not found</p>
        <p style={{ color: '#999', fontSize: 14 }}>This product may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  const accent = store.theme_color || '#4F46E5';
  const sym = CURRENCY_SYMBOLS[product.price_currency || store.base_currency || 'NGN'] || '';
  const gallery = [
    ...(product.image_url ? [product.image_url] : []),
    ...((product.images || []).map(img => img.image_url)),
  ];
  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';

  function copyLink() {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out ${product!.name} at ${store!.store_name}! ${currentUrl}?src=whatsapp`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #f0f0f0', padding: '14px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href={`/store/${storeSlug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏪</div>
            )}
            <span style={{ color: '#111', fontWeight: 700, fontSize: 15 }}>{store.store_name}</span>
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 60px' }}>
        {/* Image gallery */}
        <div style={{ aspectRatio: '1.3', background: '#f9f9f9', position: 'relative', overflow: 'hidden' }}>
          {gallery.length > 0 ? (
            <>
              <img src={gallery[imgIndex]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              {gallery.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {gallery.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} style={{
                      width: i === imgIndex ? 18 : 7, height: 7, borderRadius: 100,
                      background: i === imgIndex ? accent : 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s',
                    }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🛍️</div>
          )}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {product.category && <p style={{ color: '#bbb', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{product.category}</p>}
          <h1 style={{ color: '#111', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{product.name}</h1>
          <p style={{ color: accent, fontSize: 26, fontWeight: 900, marginBottom: 16 }}>{sym}{Number(product.price).toLocaleString()}</p>

          {product.description && (
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.7, marginBottom: 20, background: '#f9f9f9', borderRadius: 10, padding: '14px 16px' }}>
              {product.description}
            </p>
          )}

          {/* Stock status */}
          <div style={{ marginBottom: 20 }}>
            {product.is_available && product.stock > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} /> In stock
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} /> Out of stock
              </span>
            )}
          </div>

          {/* CTA */}
          <Link href={`/store/${storeSlug}`} style={{
            display: 'block', textAlign: 'center', padding: '15px 0', borderRadius: 12,
            background: accent, color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 24,
          }}>
            View in Store & Order
          </Link>

          {/* Share section */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
            <p style={{ color: '#111', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Share this product</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={shareWhatsApp} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25d366',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                WhatsApp
              </button>
              <button onClick={copyLink} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                background: copied ? 'rgba(16,185,129,0.1)' : '#f5f5f5', border: '1px solid ' + (copied ? 'rgba(16,185,129,0.2)' : '#e5e5e5'),
                color: copied ? '#10b981' : '#444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                {copied ? '✓ Copied!' : '🔗 Copy Link'}
              </button>
              <button onClick={() => setShowQR(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                background: '#f5f5f5', border: '1px solid #e5e5e5', color: '#444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                📱 QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code modal */}
      {showQR && (
        <div onClick={() => setShowQR(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 320 }}>
            <p style={{ color: '#111', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Scan to view this product</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`}
              alt="QR Code"
              style={{ width: 240, height: 240, borderRadius: 12, border: '1px solid #f0f0f0' }}
            />
            <button onClick={() => setShowQR(false)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#f5f5f5', border: 'none', color: '#444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
