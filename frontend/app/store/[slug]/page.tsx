'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

const C = {
  bg:         '#0a0a0f',
  card:       '#12121a',
  cardBorder: 'rgba(255,255,255,0.08)',
  input:      '#1a1a2e',
  inputBorder:'rgba(255,255,255,0.1)',
  purple:     '#7c3aed',
  pink:       '#ec4899',
  green:      '#25d366',
  success:    '#10b981',
  muted:      '#6b7280',
  subtext:    '#9ca3af',
  text:       '#ffffff',
  amber:      '#f59e0b',
  red:        '#ef4444',
};

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
  popup_enabled?: boolean;
  popup_discount?: number;
  popup_message?: string;
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

interface CartItem {
  product: Product;
  quantity: number;
}

function cleanPhone(phone: string): string {
  let p = phone.replace(/\s/g, '');
  if (p.startsWith('0')) p = '234' + p.slice(1);
  return p;
}

function waLink(phone: string): string {
  return 'https://wa.me/' + cleanPhone(phone);
}

export default function StorefrontPage() {
  const { slug } = useParams();

  const [store, setStore]           = useState<Store | null>(null);
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const [cart, setCart]             = useState<CartItem[]>([]);
  const [showCart, setShowCart]     = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', note: '' });
  const [placing, setPlacing]       = useState(false);
  const [formError, setFormError]   = useState('');
  const [success, setSuccess]       = useState(false);
  const [orderNums, setOrderNums]   = useState<string[]>([]);

  const [showPopup, setShowPopup]               = useState(false);
  const [popupPhone, setPopupPhone]             = useState('');
  const [popupSubmitting, setPopupSubmitting]   = useState(false);
  const [discountUnlocked, setDiscountUnlocked] = useState(false);
  const [discountCode, setDiscountCode]         = useState('');
  const [selectedProduct, setSelectedProduct]   = useState<Product | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const storeRes = await api.get('/api/store/slug/' + slug);
        setStore(storeRes.data);
        const productsRes = await api.get('/api/products/public/' + storeRes.data.id);
        setProducts(productsRes.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!store?.popup_enabled) return;
    const dismissed = sessionStorage.getItem('sellora_popup_dismissed_' + store.id);
    const unlocked = sessionStorage.getItem('sellora_discount_' + store.id);
    if (unlocked) { setDiscountUnlocked(true); setDiscountCode(unlocked); return; }
    if (dismissed) return;
    const timer = setTimeout(() => setShowPopup(true), 12000);
    return () => clearTimeout(timer);
  }, [store]);

  function dismissPopup() {
    setShowPopup(false);
    if (store) sessionStorage.setItem('sellora_popup_dismissed_' + store.id, '1');
  }

  async function unlockDiscount() {
    if (!popupPhone.trim() || popupPhone.trim().length < 10 || !store) return;
    setPopupSubmitting(true);
    const code = 'SAVE' + (store.popup_discount || 10);
    try {
      await api.post('/api/abandoned/', {
        store_id: store.id, product_id: null,
        customer_name: 'Popup Lead', customer_phone: popupPhone.trim(), source: 'popup',
      });
    } catch {}
    finally {
      setDiscountCode(code); setDiscountUnlocked(true);
      sessionStorage.setItem('sellora_discount_' + store.id, code);
      setShowPopup(false); setPopupSubmitting(false);
    }
  }

  const themeColor = store?.theme_color || C.purple;

  const storeCategories: string[] = (() => {
    try { return JSON.parse(store?.categories || '[]'); } catch { return []; }
  })();

  const productCategories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];
  const allCategories = ['All', ...new Set([...storeCategories, ...productCategories.slice(1)])];
  const filtered = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);

  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const discountAmount = discountUnlocked && store ? Math.round(cartSubtotal * (store.popup_discount || 0) / 100) : 0;
  const cartTotal = cartSubtotal - discountAmount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) { setCart(prev => prev.filter(i => i.product.id !== productId)); }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  }

  function getCartQty(productId: string) { return cart.find(i => i.product.id === productId)?.quantity || 0; }

  async function handleCheckout() {
    if (!checkoutForm.name || !checkoutForm.phone) { setFormError('Please fill in your name and WhatsApp number.'); return; }
    if (cart.length === 0) { setFormError('Your cart is empty.'); return; }
    setPlacing(true); setFormError('');
    try {
      const nums: string[] = [];
      for (const item of cart) {
        const res = await api.post('/api/orders/', {
          product_id: item.product.id, customer_name: checkoutForm.name,
          customer_phone: checkoutForm.phone, customer_note: checkoutForm.note || undefined,
          quantity: item.quantity,
          discount_percent: discountUnlocked && store ? (store.popup_discount || 0) : 0,
          discount_code: discountUnlocked ? discountCode : undefined,
        });
        nums.push(res.data.order_number || res.data.id.slice(0, 8).toUpperCase());
      }
      setOrderNums(nums); setCart([]); setSuccess(true); setShowCheckout(false); setShowCart(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally { setPlacing(false); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 64 }}>🏪</div>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700 }}>Store not found</h1>
      <p style={{ color: C.muted, fontSize: 15 }}>This store link may have changed or been removed.</p>
      <p style={{ color: C.muted, fontSize: 13 }}>Powered by <span style={{ color: C.purple, fontWeight: 700 }}>Sellora</span></p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid ' + C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Order Placed!</h1>
      <p style={{ color: C.subtext, fontSize: 15, marginBottom: 20, maxWidth: 300 }}>Thank you! Your order has been sent to the seller. They will contact you shortly.</p>
      {orderNums.length > 0 && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 12, padding: '12px 20px', marginBottom: 20 }}>
          {orderNums.map(num => <p key={num} style={{ color: themeColor, fontSize: 14, fontWeight: 700 }}>Order #{num}</p>)}
        </div>
      )}
      {store?.whatsapp && (
        <a href={waLink(store.whatsapp)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: C.green, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 16 }}>
          💬 Chat with seller on WhatsApp
        </a>
      )}
      <button onClick={() => setSuccess(false)} style={{ padding: '12px 24px', borderRadius: 12, background: themeColor, border: 'none', color: C.text, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Continue Shopping</button>
      <p style={{ color: C.muted, fontSize: 12, marginTop: 20 }}>Powered by <span style={{ color: themeColor, fontWeight: 700 }}>Sellora</span></p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: cart.length > 0 ? 80 : 0 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {store?.banner_url && (
          <div style={{ width: '100%', height: 160, overflow: 'hidden', position: 'relative' }}>
            <img src={store.banner_url} alt="Store banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0.8))' }} />
          </div>
        )}

        <div style={{ padding: store?.banner_url ? '0 20px 20px' : '32px 20px 20px', marginTop: store?.banner_url ? -40 : 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, background: store?.logo_url ? 'transparent' : ('linear-gradient(135deg, ' + themeColor + ', #ec4899)'), border: '3px solid ' + C.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {store?.logo_url ? <img src={store.logo_url} alt={store.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏪'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{store?.store_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, display: 'inline-block' }} />
                <span style={{ color: C.success, fontSize: 11, fontWeight: 600 }}>Open</span>
                <span style={{ color: C.muted, fontSize: 11 }}>•</span>
                <span style={{ color: C.muted, fontSize: 11 }}>{products.length} products</span>
              </div>
            </div>
          </div>

          {store?.description && <p style={{ color: C.subtext, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{store.description}</p>}

          {(store?.whatsapp || store?.instagram) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {store.whatsapp && (
                <a href={waLink(store.whatsapp)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: C.green, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  💬 WhatsApp
                </a>
              )}
              {store.instagram && (
                <a href={'https://instagram.com/' + store.instagram} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: C.pink, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  {'📸 @' + store.instagram}
                </a>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ icon: '🚚', label: 'Pay on delivery' }, { icon: '💬', label: 'Chat with seller' }, { icon: '🔒', label: 'Secure checkout' }].map(badge => (
              <div key={badge.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 8, padding: '6px 10px' }}>
                <span style={{ fontSize: 12 }}>{badge.icon}</span>
                <span style={{ color: C.subtext, fontSize: 11, fontWeight: 600 }}>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {allCategories.length > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: activeCategory === cat ? 'none' : '1px solid ' + C.cardBorder, background: activeCategory === cat ? themeColor : 'transparent', color: activeCategory === cat ? C.text : C.subtext, transition: 'all 0.15s' }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '0 20px 80px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <p style={{ color: C.muted, fontSize: 15 }}>No products available yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {filtered.map(product => {
                const qty = getCartQty(product.id);
                const outOfStock = product.stock === 0 || !product.is_available;
                return (
                  <div key={product.id} style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, overflow: 'hidden' }}>
                    <div onClick={() => !outOfStock && setSelectedProduct(product)} style={{ aspectRatio: '1', background: '#1a1a26', position: 'relative', overflow: 'hidden', cursor: outOfStock ? 'default' : 'pointer' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🛍️</div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: product.stock <= 2 ? C.red : C.amber, borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 800, color: product.stock <= 2 ? '#fff' : '#000', animation: product.stock <= 2 ? 'pulse 1.5s ease-in-out infinite' : 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {product.stock <= 2 ? '🔥 Only ' + product.stock + ' left!' : product.stock + ' left'}
                        </div>
                      )}
                      {outOfStock && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: C.text, fontSize: 12, fontWeight: 700, background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 6 }}>Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 10px 12px' }}>
                      <p onClick={() => !outOfStock && setSelectedProduct(product)} style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: outOfStock ? 'default' : 'pointer' }}>{product.name}</p>
                      {product.category && <p style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>{product.category}</p>}
                      <p style={{ color: themeColor, fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{'N' + Number(product.price).toLocaleString()}</p>
                      {outOfStock ? (
                        <div style={{ width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.05)', borderRadius: 8, textAlign: 'center', color: C.muted, fontSize: 12, fontWeight: 600 }}>Out of stock</div>
                      ) : qty === 0 ? (
                        <button onClick={() => addToCart(product)} style={{ width: '100%', padding: '8px 0', background: themeColor, border: 'none', borderRadius: 8, color: C.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add to Cart</button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '4px 8px' }}>
                          <button onClick={() => updateQty(product.id, qty - 1)} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ color: themeColor, fontSize: 13, fontWeight: 700 }}>{qty}</span>
                          <button onClick={() => updateQty(product.id, Math.min(qty + 1, product.stock))} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid ' + C.cardBorder }}>
          <p style={{ color: C.muted, fontSize: 12 }}>Powered by <span style={{ color: themeColor, fontWeight: 700 }}>Sellora</span></p>
        </div>
      </div>

      {cart.length > 0 && !showCart && !showCheckout && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 40, maxWidth: 440, width: 'calc(100% - 40px)' }}>
          <button onClick={() => setShowCart(true)} style={{ width: '100%', padding: '14px 20px', background: 'linear-gradient(90deg, ' + themeColor + ', #ec4899)', border: 'none', borderRadius: 14, color: C.text, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 800 }}>{cartCount + ' item' + (cartCount !== 1 ? 's' : '')}</span>
            <span>View Cart</span>
            <span style={{ fontWeight: 800 }}>{'N' + cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowCart(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: C.card, borderRadius: '20px 20px 0 0', border: '1px solid ' + C.cardBorder, padding: '20px 20px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: C.text, fontSize: 18, fontWeight: 800 }}>{'Your Cart (' + cartCount + ')'}</h3>
              <button onClick={() => setShowCart(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.input, borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#1a1a26', overflow: 'hidden', flexShrink: 0 }}>
                    {item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛍️</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                    <p style={{ color: themeColor, fontSize: 13, fontWeight: 700 }}>{'N' + Number(item.product.price).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, Math.min(item.quantity + 1, item.product.stock))} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16, padding: 0, display: 'flex', alignItems: 'center' }}>×</button>
                </div>
              ))}
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', marginBottom: 4 }}>
                <span style={{ color: C.success, fontSize: 13 }}>{'Discount (' + discountCode + ')'}</span>
                <span style={{ color: C.success, fontSize: 13, fontWeight: 600 }}>{'-N' + discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid ' + C.cardBorder, borderBottom: '1px solid ' + C.cardBorder, marginBottom: 16 }}>
              <span style={{ color: C.subtext, fontSize: 15 }}>Total</span>
              <span style={{ color: C.text, fontSize: 18, fontWeight: 800 }}>{'N' + cartTotal.toLocaleString()}</span>
            </div>
            <button onClick={() => { setShowCart(false); setShowCheckout(true); }} style={{ width: '100%', padding: '15px 0', background: 'linear-gradient(90deg, ' + themeColor + ', #ec4899)', border: 'none', borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>Proceed to Checkout</button>
          </div>
        </div>
      )}

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowCheckout(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: C.card, borderRadius: '20px 20px 0 0', border: '1px solid ' + C.cardBorder, padding: '20px 20px 32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ color: C.text, fontSize: 18, fontWeight: 800 }}>Checkout</h3>
                <p style={{ color: C.muted, fontSize: 13 }}>{cartCount + ' item' + (cartCount !== 1 ? 's' : '') + ' • N' + cartTotal.toLocaleString()}</p>
              </div>
              <button onClick={() => { setShowCheckout(false); setShowCart(true); }} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ background: C.input, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ color: C.subtext, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Order Summary</p>
              {cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: C.subtext, fontSize: 13 }}>{item.product.name + ' x' + item.quantity}</span>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{'N' + (Number(item.product.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: C.success, fontSize: 13 }}>{'Discount (' + discountCode + ')'}</span>
                  <span style={{ color: C.success, fontSize: 13, fontWeight: 600 }}>{'-N' + discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>Total</span>
                <span style={{ color: themeColor, fontSize: 14, fontWeight: 800 }}>{'N' + cartTotal.toLocaleString()}</span>
              </div>
            </div>
            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: C.red, fontSize: 13, marginBottom: 16 }}>{formError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <input type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })} placeholder="Your full name *" style={{ width: '100%', background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 12, padding: '13px 16px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              <input type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="WhatsApp number * (e.g. 08031234567)" style={{ width: '100%', background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 12, padding: '13px 16px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              <textarea value={checkoutForm.note} onChange={e => setCheckoutForm({ ...checkoutForm, note: e.target.value })} placeholder="Any note for the seller? (optional)" rows={2} style={{ width: '100%', background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 12, padding: '13px 16px', color: C.text, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10 }}>
              <span style={{ flexShrink: 0 }}>🔒</span>
              <p style={{ color: C.subtext, fontSize: 12, lineHeight: 1.5 }}>Your order details will be sent directly to the seller. Pay on delivery or via bank transfer.</p>
            </div>
            <button onClick={handleCheckout} disabled={placing || !checkoutForm.name || !checkoutForm.phone} style={{ width: '100%', padding: '15px 0', background: placing || !checkoutForm.name || !checkoutForm.phone ? 'rgba(124,58,237,0.3)' : ('linear-gradient(90deg, ' + themeColor + ', #ec4899)'), border: 'none', borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 800, cursor: placing || !checkoutForm.name || !checkoutForm.phone ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {placing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Placing order...
                </span>
              ) : <span>{'Place Order — N' + cartTotal.toLocaleString()}</span>}
            </button>
          </div>
        </div>
      )}

      {/* Product detail bottom-sheet */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: C.card, borderRadius: '24px 24px 0 0', border: '1px solid ' + C.cardBorder, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ width: '100%', aspectRatio: '1.6', background: '#1a1a26', position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🛍️</div>
              )}
              <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>×</button>
              {selectedProduct.stock <= 5 && selectedProduct.stock > 0 && (
                <div style={{ position: 'absolute', top: 14, left: 14, background: selectedProduct.stock <= 2 ? C.red : C.amber, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 800, color: selectedProduct.stock <= 2 ? '#fff' : '#000' }}>
                  {selectedProduct.stock <= 2 ? '🔥 Only ' + selectedProduct.stock + ' left!' : selectedProduct.stock + ' left'}
                </div>
              )}
            </div>
            <div style={{ padding: '20px 20px 32px' }}>
              {selectedProduct.category && <p style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{selectedProduct.category}</p>}
              <h2 style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{selectedProduct.name}</h2>
              <p style={{ color: themeColor, fontSize: 22, fontWeight: 900, marginBottom: 16 }}>{'N' + Number(selectedProduct.price).toLocaleString()}</p>
              {selectedProduct.description && (
                <div style={{ background: C.input, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ color: C.subtext, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Description</p>
                  <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7 }}>{selectedProduct.description}</p>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedProduct.stock > 5 ? C.success : selectedProduct.stock > 0 ? C.amber : C.red, display: 'inline-block' }} />
                <span style={{ color: C.subtext, fontSize: 13 }}>
                  {selectedProduct.stock > 5 ? 'In stock' : selectedProduct.stock > 0 ? selectedProduct.stock + ' items left' : 'Out of stock'}
                </span>
              </div>
              {(() => {
                const qty = getCartQty(selectedProduct.id);
                if (qty === 0) {
                  return (
                    <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} style={{ width: '100%', padding: '16px 0', background: 'linear-gradient(90deg, ' + themeColor + ', #ec4899)', border: 'none', borderRadius: 14, color: C.text, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                      🛒 Add to Cart
                    </button>
                  );
                }
                return (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '10px 16px', flex: 1, justifyContent: 'space-between' }}>
                      <button onClick={() => updateQty(selectedProduct.id, qty - 1)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ color: themeColor, fontSize: 16, fontWeight: 800 }}>{qty} in cart</span>
                      <button onClick={() => updateQty(selectedProduct.id, Math.min(qty + 1, selectedProduct.stock))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: C.text, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <button onClick={() => { setSelectedProduct(null); setShowCart(true); }} style={{ padding: '14px 20px', background: themeColor, border: 'none', borderRadius: 12, color: C.text, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>View Cart</button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Discount Popup */}
      {showPopup && !discountUnlocked && store && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={dismissPopup} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: C.card, borderRadius: '20px 20px 0 0', border: '1px solid rgba(124,58,237,0.3)', padding: '28px 24px 36px', textAlign: 'center' }}>
            <button onClick={dismissPopup} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16 }}>×</button>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎁</div>
            <h3 style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{'Get ' + (store.popup_discount || 10) + '% OFF!'}</h3>
            <p style={{ color: C.subtext, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{store.popup_message || 'Enter your WhatsApp number to unlock this discount'}</p>
            <input type="tel" value={popupPhone} onChange={e => setPopupPhone(e.target.value)} placeholder="Your WhatsApp number" style={{ width: '100%', background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12, textAlign: 'center' }} />
            <button onClick={unlockDiscount} disabled={popupSubmitting || popupPhone.trim().length < 10} style={{ width: '100%', padding: '14px 0', background: popupSubmitting || popupPhone.trim().length < 10 ? 'rgba(124,58,237,0.3)' : 'linear-gradient(90deg, ' + themeColor + ', #ec4899)', border: 'none', borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 800, cursor: popupSubmitting || popupPhone.trim().length < 10 ? 'not-allowed' : 'pointer' }}>
              {popupSubmitting ? 'Unlocking...' : '🔓 Unlock My Discount'}
            </button>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 12 }}>The seller may contact you on WhatsApp with offers</p>
          </div>
        </div>
      )}

      {/* Discount unlocked banner */}
      {discountUnlocked && store && (
        <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 45, background: 'rgba(16,185,129,0.95)', borderRadius: 10, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}>
          <span style={{ fontSize: 14 }}>🎉</span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{(store.popup_discount || 10) + '% discount active — code ' + discountCode}</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}