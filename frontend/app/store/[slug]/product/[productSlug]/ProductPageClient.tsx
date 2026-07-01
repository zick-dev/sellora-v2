'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { addToStoredCart, StoredCartItem } from '@/lib/storefrontCart';

interface Store {
  id: string; store_name: string; slug: string; logo_url: string | null;
  theme_color: string; base_currency?: string; whatsapp: string | null;
}
interface Variant {
  id: string;
  variant_type_1: string | null;
  variant_value_1: string | null;
  variant_type_2: string | null;
  variant_value_2: string | null;
  price: number | null;
  stock: number;
  is_available: boolean;
}
interface Product {
  id: string; name: string; description: string | null; price: number;
  price_currency?: string | null; stock: number; image_url: string | null;
  category: string | null; is_available: boolean;
  images?: { image_url: string }[];
  variants?: Variant[];
}

const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: 'GH₵', KES: 'KSh', ZAR: 'R', TRY: '₺' };

export default function ProductPageClient({ storeSlug, productSlug }: { storeSlug: string; productSlug: string }) {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sr = await api.get('/api/store/slug/' + storeSlug);
        setStore(sr.data);
        const pr = await api.get(`/api/products/public/${sr.data.id}/slug/${productSlug}`);
        setProduct(pr.data);
        if (pr.data.variants && pr.data.variants.length > 0) {
          setSelectedVariant(pr.data.variants[0]);
        }
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
        <Link href={`/store/${storeSlug}`} style={{ marginTop: 16, color: '#4F46E5', fontSize: 14, fontWeight: 600 }}>← Back to store</Link>
      </div>
    );
  }

  const accent = store.theme_color || '#4F46E5';
  const sym = CURRENCY_SYMBOLS[product.price_currency || store.base_currency || 'NGN'] || '';
  const gallery = [
    ...(product.image_url ? [product.image_url] : []),
    ...((product.images || []).map(img => img.image_url)),
  ];
  const hasVariants = product.variants && product.variants.length > 0;
  const activePrice = selectedVariant?.price != null ? selectedVariant.price : product.price;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const outOfStock = !product.is_available || activeStock <= 0;

  function cartKeyFor(variant: Variant | null) {
    return product!.id + (variant ? ':' + variant.id : '');
  }

  function handleAddToCart() {
    if (outOfStock) return;
    setAdding(true);
    const variantLabel = selectedVariant
      ? [selectedVariant.variant_value_1, selectedVariant.variant_value_2].filter(Boolean).join(' / ')
      : null;
    const item: StoredCartItem = {
      productId: product!.id,
      productName: product!.name,
      productImageUrl: product!.image_url,
      productPrice: product!.price,
      productPriceCurrency: product!.price_currency || null,
      variantId: selectedVariant?.id || null,
      variantLabel,
      variantPrice: selectedVariant?.price ?? null,
      quantity,
      cartKey: cartKeyFor(selectedVariant),
    };
    addToStoredCart(storeSlug, item);
    setAdding(false);
    setAdded(true);
    setTimeout(() => {
      router.push(`/store/${storeSlug}?cart=1`);
    }, 700);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
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
        <div
          style={{ aspectRatio: '1.3', background: '#f9f9f9', position: 'relative', overflow: 'hidden' }}
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touchStartX === null || gallery.length <= 1) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            if (deltaX > 50) setImgIndex(i => (i - 1 + gallery.length) % gallery.length);
            else if (deltaX < -50) setImgIndex(i => (i + 1) % gallery.length);
            setTouchStartX(null);
          }}
        >
          {gallery.length > 0 ? (
            <>
              <img src={gallery[imgIndex]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }} draggable={false} />
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(i => (i - 1 + gallery.length) % gallery.length)}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % gallery.length)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)} style={{
                        width: i === imgIndex ? 18 : 7, height: 7, borderRadius: 100,
                        background: i === imgIndex ? accent : 'rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s',
                      }} />
                    ))}
                  </div>
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                    {imgIndex + 1} / {gallery.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🛍️</div>
          )}
          {outOfStock && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: '#fff', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>Out of stock</div>
          )}
          {!outOfStock && activeStock <= 5 && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: activeStock <= 2 ? '#ef4444' : '#f59e0b', color: '#fff', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
              {activeStock <= 2 ? `Only ${activeStock} left!` : `${activeStock} left`}
            </div>
          )}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {product.category && <p style={{ color: '#bbb', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{product.category}</p>}
          <h1 style={{ color: '#111', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{product.name}</h1>
          <p style={{ color: accent, fontSize: 26, fontWeight: 900, marginBottom: 16 }}>{sym}{Number(activePrice).toLocaleString()}</p>

          {product.description && (
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.7, marginBottom: 20, background: '#f9f9f9', borderRadius: 10, padding: '14px 16px' }}>
              {product.description}
            </p>
          )}

          {hasVariants && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#111', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Choose an option</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.variants!.map(v => {
                  const label = [v.variant_value_1, v.variant_value_2].filter(Boolean).join(' / ');
                  const active = selectedVariant?.id === v.id;
                  const disabled = !v.is_available || v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: active ? '2px solid ' + accent : '1px solid #e5e5e5',
                        background: active ? accent + '10' : '#fff',
                        color: disabled ? '#ccc' : active ? accent : '#333',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        textDecoration: disabled ? 'line-through' : 'none',
                      }}
                    >
                      {label || 'Option'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!outOfStock && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#111', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Quantity</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{
                  width: 34, height: 34, borderRadius: 8, background: '#f5f5f5', border: '1px solid #e5e5e5',
                  cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111', minWidth: 20, textAlign: 'center' }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(activeStock, q + 1))} style={{
                  width: 34, height: 34, borderRadius: 8, background: '#f5f5f5', border: '1px solid #e5e5e5',
                  cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={outOfStock || adding || added}
            style={{
              display: 'block', width: '100%', textAlign: 'center', padding: '15px 0', borderRadius: 12,
              background: outOfStock ? '#e5e5e5' : added ? '#10b981' : accent,
              color: outOfStock ? '#999' : '#fff', fontWeight: 800, fontSize: 15, border: 'none',
              cursor: outOfStock ? 'not-allowed' : 'pointer', marginBottom: 12,
            }}
          >
            {outOfStock ? 'Out of Stock' : added ? '✓ Added to Cart' : adding ? 'Adding...' : 'Add to Cart'}
          </button>

          <Link href={`/store/${storeSlug}`} style={{ display: 'block', textAlign: 'center', color: '#888', fontSize: 13, textDecoration: 'none' }}>
            ← Continue browsing {store.store_name}
          </Link>
        </div>
      </div>
    </div>
  );
}
