'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import StorefrontChat from '@/components/StorefrontChat';

interface Store {
  id: string; store_name: string; slug: string; description: string | null;
  logo_url: string | null; banner_url: string | null; banner_type?: string; theme_color: string;
  whatsapp: string | null; instagram: string | null; categories: string;
  is_active: boolean; popup_enabled?: boolean; popup_discount?: number;
  popup_message?: string; delivery_fee?: number; free_delivery_above?: number;
  base_currency?: string;
  show_trust_bar?: boolean;
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
  stock: number; image_url: string | null; category: string | null; is_available: boolean;
  price_currency?: string | null;
  variants?: Variant[];
}
interface CartItem { product: Product; quantity: number; variant?: Variant | null; cartKey: string; }

function cleanPhone(p: string): string {
  p = p.replace(/\s/g, '');
  if (p.startsWith('0')) p = '234' + p.slice(1);
  return p;
}
function waLink(phone: string) { return 'https://wa.me/' + cleanPhone(phone); }
function getCurrencySymbol(code?: string): string {
  const map: Record<string,string> = { NGN:'\u20a6', GHS:'GH\u20b5', KES:'KSh', ZAR:'R', UGX:'USh', TZS:'TSh', XOF:'CFA', EGP:'E\u00a3', GBP:'\u00a3', EUR:'\u20ac', USD:'$' };
  return map[code||''] || code || '$';
}

function convertPrice(price: number, fromCurrency: string | null | undefined, toCurrency: string | undefined, rates: Record<string, number>): number {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();
  if (from === to) return price;
  // rates are fetched with buyerCurrency as base
  // rates[X] = how many X per 1 base unit
  // To convert from A to B: (price / rates[A]) * rates[B]
  // This converts: A -> base -> B
  let converted = price;
  if (rates[from] && rates[to]) {
    converted = (price / rates[from]) * rates[to];
  } else if (rates[from]) {
    converted = price / rates[from];
  } else {
    return price;
  }
  // Round to clean numbers for better UX
  if (converted >= 1000) return Math.round(converted / 100) * 100;
  if (converted >= 100) return Math.round(converted / 10) * 10;
  if (converted >= 10) return Math.round(converted);
  return Math.round(converted * 100) / 100;
}

export default function StorefrontPage() {
  const { slug } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [buyerCurrency, setBuyerCurrency] = useState<string | null>(null);
  const [showLocal, setShowLocal] = useState(true);

  // Convert a product price from its original currency to the store's display currency
  const displayCurrency = showLocal && buyerCurrency ? buyerCurrency : store?.base_currency;
  const dp = (price: number, priceCurrency?: string | null) =>
    convertPrice(price, priceCurrency, displayCurrency, fxRates);
  const [searchFocused, setSearchFocused] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', note: '' });
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pay_on_delivery' | 'bank_transfer'>('pay_on_delivery');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderNums, setOrderNums] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [provideAddress, setProvideAddress] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPhone, setPopupPhone] = useState('');
  const [popupSubmitting, setPopupSubmitting] = useState(false);
  const [discountUnlocked, setDiscountUnlocked] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const sr = await api.get('/api/store/slug/' + slug);
        setStore(sr.data);
        const pr = await api.get('/api/products/public/' + sr.data.id);
        setProducts(pr.data);
        // Detect buyer's local currency via IP geolocation
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          const geoData = await geoRes.json();
          const detectedCurrency = geoData?.currency || sr.data.base_currency || 'USD';
          setBuyerCurrency(detectedCurrency);
          // Fetch FX rates with detected currency as base
          const fxRes = await api.get('/api/fx/rates/' + detectedCurrency);
          if (fxRes.data?.rates) setFxRates(fxRes.data.rates);
        } catch {
          // Fallback to store's base currency
          try {
            const fxRes = await api.get('/api/fx/rates/' + (sr.data.base_currency || 'USD'));
            if (fxRes.data?.rates) setFxRates(fxRes.data.rates);
          } catch { /* FX rates unavailable */ }
        }
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!store?.popup_enabled) return;
    const dismissed = sessionStorage.getItem('sp_dismissed_' + store.id);
    const unlocked  = sessionStorage.getItem('sp_discount_'  + store.id);
    if (unlocked) { setDiscountUnlocked(true); setDiscountCode(unlocked); return; }
    if (dismissed) return;
    const t = setTimeout(() => setShowPopup(true), 12000);
    return () => clearTimeout(t);
  }, [store]);

  function dismissPopup() {
    setShowPopup(false);
    if (store) sessionStorage.setItem('sp_dismissed_' + store.id, '1');
  }
  async function unlockDiscount() {
    if (!popupPhone.trim() || popupPhone.trim().length < 10 || !store) return;
    setPopupSubmitting(true);
    const code = 'SAVE' + (store.popup_discount || 10);
    try { await api.post('/api/abandoned/', { store_id: store.id, product_id: null, customer_name: 'Popup Lead', customer_phone: popupPhone.trim(), source: 'popup' }); } catch {}
    finally { setDiscountCode(code); setDiscountUnlocked(true); sessionStorage.setItem('sp_discount_' + store.id, code); setShowPopup(false); setPopupSubmitting(false); }
  }

  const accent = store?.theme_color || '#111111';
  const sym    = getCurrencySymbol(displayCurrency);
  const storeCategories: string[] = (() => { try { return JSON.parse(store?.categories || '[]'); } catch { return []; } })();
  const productCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]));
  const allCategories = ['All', ...new Set([...storeCategories, ...productCategories])];
  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });
  const cartSubtotal  = cart.reduce((s, i) => s + dp(Number(i.variant?.price != null ? i.variant.price : i.product.price), i.product.price_currency) * i.quantity, 0);
  const discountAmt   = discountUnlocked && store ? Math.round(cartSubtotal * (store.popup_discount || 0) / 100) : 0;
  const discountedSub = cartSubtotal - discountAmt;
  const deliveryFee   = store && (store.delivery_fee||0) > 0 && discountedSub < (store.free_delivery_above||0) ? (store.delivery_fee||0) : 0;
  const cartTotal     = discountedSub + deliveryFee;
  const cartCount     = cart.reduce((s, i) => s + i.quantity, 0);

  function effectivePrice(p: Product, v?: Variant | null) { return v?.price != null ? v.price : p.price; }
  function effectiveStock(p: Product, v?: Variant | null) { return v ? v.stock : p.stock; }
  function makeCartKey(productId: string, variantId?: string | null) { return variantId ? productId + ':' + variantId : productId; }

  function addToCart(p: Product, v?: Variant | null) {
    const key = makeCartKey(p.id, v?.id);
    const maxStock = effectiveStock(p, v);
    setCart(prev => {
      const ex = prev.find(i => i.cartKey === key);
      if (ex) return prev.map(i => i.cartKey === key ? { ...i, quantity: Math.min(i.quantity + 1, maxStock) } : i);
      return [...prev, { product: p, quantity: 1, variant: v || null, cartKey: key }];
    });
  }
  function removeFromCart(key: string) { setCart(p => p.filter(i => i.cartKey !== key)); }
  function updateQty(key: string, qty: number) {
    if (qty <= 0) { removeFromCart(key); return; }
    setCart(p => p.map(i => {
      if (i.cartKey !== key) return i;
      const maxStock = effectiveStock(i.product, i.variant);
      return { ...i, quantity: Math.min(qty, maxStock) };
    }));
  }
  function getQty(productId: string, variantId?: string | null) {
    const key = makeCartKey(productId, variantId);
    return cart.find(i => i.cartKey === key)?.quantity || 0;
  }

  async function handleReceiptUpload(file: File) {
    setUploadingReceipt(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'sellora-storage');
      const res = await fetch('https://api.cloudinary.com/v1_1/dkun9hvkf/image/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) setReceiptUrl(data.secure_url);
    } catch {}
    setUploadingReceipt(false);
  }

  async function handleCheckout() {
    if (!checkoutForm.name || !checkoutForm.phone) { setFormError('Please fill in your name and WhatsApp number.'); return; }
    if (!cart.length) { setFormError('Your cart is empty.'); return; }
    setPlacing(true); setFormError('');
    try {
      const nums: string[] = [];
      for (const item of cart) {
        const variantDesc = item.variant
          ? [item.variant.variant_value_1, item.variant.variant_value_2].filter(Boolean).join(' / ')
          : null;
        const res = await api.post('/api/orders/', { product_id: item.product.id, variant_id: item.variant?.id || null, variant_description: variantDesc, customer_name: checkoutForm.name, customer_phone: checkoutForm.phone, customer_note: checkoutForm.note || undefined, quantity: item.quantity, discount_percent: discountUnlocked && store ? (store.popup_discount||0) : 0, discount_code: discountUnlocked ? discountCode : undefined, delivery_address: provideAddress ? deliveryAddress : null, payment_method: paymentMethod, transfer_receipt_url: paymentMethod === 'bank_transfer' ? receiptUrl : null });
        nums.push(res.data.order_number || res.data.id.slice(0,8).toUpperCase());
      }
      setOrderNums(nums); setCart([]); setSuccess(true); setShowCheckout(false); setShowCart(false);
    } catch (err: any) { setFormError(err.response?.data?.detail || 'Failed to place order. Please try again.'); }
    finally { setPlacing(false); }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #f0f0f0', borderTopColor:'#111', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
        <p style={{ color:'#999', fontSize:13 }}>Loading store...</p>
      </div>
      {store && (
        <StorefrontChat
          storeName={store.store_name}
          accentColor={accent}
          products={products}
          deliveryFee={(store as any).delivery_fee || 0}
          freeDeliveryAbove={(store as any).free_delivery_above || 0}
          whatsapp={(store as any).whatsapp}
          currencySymbol={sym}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:48 }}>🏪</div>
      <h1 style={{ color:'#111', fontSize:20, fontWeight:700 }}>Store not found</h1>
      <p style={{ color:'#999', fontSize:14 }}>This link may have changed or been removed.</p>
    </div>
  );

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', textAlign:'center' }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'#f0fdf4', border:'2px solid #22c55e', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{ color:'#111', fontSize:26, fontWeight:800, marginBottom:6 }}>Order Placed!</h1>
      <p style={{ color:'#666', fontSize:15, marginBottom:20, maxWidth:320 }}>Thank you! The seller will contact you shortly.</p>
      {orderNums.length > 0 && <div style={{ background:'#f9f9f9', border:'1px solid #eee', borderRadius:10, padding:'12px 24px', marginBottom:20 }}>{orderNums.map(n => <p key={n} style={{ color:accent, fontSize:14, fontWeight:700 }}>Order #{n}</p>)}</div>}
      {store?.whatsapp && <a href={waLink(store.whatsapp)} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:8, background:'#25d366', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', marginBottom:12 }}>💬 Chat on WhatsApp</a>}
      <button onClick={() => setSuccess(false)} style={{ padding:'12px 28px', borderRadius:8, background:accent, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Continue Shopping</button>
      {store && (
        <StorefrontChat
          storeName={store.store_name}
          accentColor={accent}
          products={products}
          deliveryFee={(store as any).delivery_fee || 0}
          freeDeliveryAbove={(store as any).free_delivery_above || 0}
          whatsapp={(store as any).whatsapp}
          currencySymbol={sym}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const inputStyle: React.CSSProperties = { width:'100%', background:'#f9f9f9', border:'1px solid #e5e5e5', borderRadius:9, padding:'13px 14px', color:'#111', fontSize:14, outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', fontFamily:'-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' }}>

      {/* HEADER */}
      <header style={{ position:'sticky', top:0, zIndex:100, background: scrolled ? 'rgba(255,255,255,0.96)' : '#fff', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom:'1px solid #f0f0f0', transition:'all 0.2s' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            {store?.logo_url
              ? <img src={store.logo_url} alt={store.store_name} style={{ width:34, height:34, borderRadius:8, objectFit:'cover' }} />
              : <div style={{ width:34, height:34, borderRadius:8, background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏪</div>}
            <span style={{ color:'#111', fontWeight:800, fontSize:16, letterSpacing:'-0.3px' }}>{store?.store_name}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <button onClick={() => setShowCart(true)} style={{ position:'relative', padding:'8px 14px', borderRadius:8, background:accent, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Cart
              {cartCount > 0 && <span style={{ background:'#fff', color:accent, borderRadius:'50%', width:18, height:18, fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'10px 20px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative' }}>
          <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? accent : '#999'} strokeWidth="2" style={{ transition:'all 0.2s' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={'Search ' + (store?.store_name || 'products') + '...'}
            style={{
              width: '100%',
              padding: '10px 40px 10px 40px',
              borderRadius: 10,
              border: '1.5px solid ' + (searchFocused ? accent : '#e5e5e5'),
              background: '#f9f9f9',
              fontSize: 14,
              color: '#111',
              outline: 'none',
              boxSizing: 'border-box' as const,
              transition: 'border-color 0.2s',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* HERO */}
      {store?.banner_url && (
        <div style={{ width:'100%', height:'clamp(200px, 40vw, 460px)', position:'relative', overflow:'hidden' }}>
          {store.banner_type === 'video' ? (
            <video src={store.banner_url} autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <img src={store.banner_url} alt={store.store_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          )}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'0 clamp(20px,5vw,80px)' }}>
            <div style={{ maxWidth:440 }}>
              <h1 style={{ color:'#fff', fontSize:'clamp(22px,4vw,46px)', fontWeight:900, lineHeight:1.1, marginBottom:10, letterSpacing:'-0.5px' }}>{store.store_name}</h1>
              {store.description && <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'clamp(13px,1.5vw,16px)', marginBottom:18, lineHeight:1.5 }}>{store.description}</p>}
              <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'11px 26px', borderRadius:8, background:'#fff', border:'none', color:'#111', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Shop Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INFO BAR (no banner) */}
      {!store?.banner_url && (
        <div style={{ background:'#fafafa', borderBottom:'1px solid #f0f0f0', padding:'28px 20px' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            {store?.logo_url
              ? <img src={store.logo_url} alt={store.store_name} style={{ width:56, height:56, borderRadius:10, objectFit:'cover', border:'1px solid #eee' }} />
              : <div style={{ width:56, height:56, borderRadius:10, background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🏪</div>}
            <div>
              <h1 style={{ color:'#111', fontSize:22, fontWeight:800, marginBottom:4 }}>{store?.store_name}</h1>
              {store?.description && <p style={{ color:'#666', fontSize:14, lineHeight:1.5, maxWidth:480 }}>{store.description}</p>}
            </div>
          </div>
        </div>
      )}

      {/* TRUST BAR — animated carousel */}
      {store?.show_trust_bar !== false && (
        <div style={{ borderBottom:'1px solid #f0f0f0', overflow:'hidden', background:'#fff' }}>
          <div style={{ display:'flex', animation:'trustScroll 18s linear infinite', width:'max-content' }}>
            {[...Array(3)].map((_, ri) => (
              <div key={ri} style={{ display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
                {[
                  { bg:'#fff7ed', border:'#fed7aa', color:'#c2410c', svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, text:'Pay on Delivery' },
                  { bg:'#f0fdf4', border:'#bbf7d0', color:'#15803d', svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, text:'WhatsApp Support' },
                  { bg:'#eff6ff', border:'#bfdbfe', color:'#1d4ed8', svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, text:'Secure Checkout' },
                  { bg:'#fdf4ff', border:'#e9d5ff', color:'#7e22ce', svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, text:'Easy Returns' },
                  { bg:'#fefce8', border:'#fde68a', color:'#b45309', svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text:'Buyer Protection' },
                  { bg:'#f0fdfa', border:'#99f6e4', color:'#0f766e', svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>, text:'Quality Guaranteed' },
                ].map(t => (
                  <div key={t.text} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 24px', borderRight:'1px solid #f0f0f0', whiteSpace:'nowrap', flexShrink:0 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:t.bg, border:'1px solid '+t.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {t.svg}
                    </div>
                    <span style={{ color:'#444', fontSize:12, fontWeight:600 }}>{t.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY NAV */}
      {allCategories.length > 1 && (
        <nav style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', position:'sticky', top:60, zIndex:90 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none', height:46, alignItems:'center' }}>
            {allCategories.map(cat => (
              <button key={cat} onClick={() => { setActiveCategory(cat); document.getElementById('products')?.scrollIntoView({ behavior:'smooth' }); }}
                style={{
                  padding:'8px 14px', fontSize:13, fontWeight: activeCategory===cat ? 700 : 500, whiteSpace:'nowrap', cursor:'pointer',
                  border:'none', borderBottom: activeCategory===cat ? '2px solid '+accent : '2px solid transparent',
                  background:'transparent', color: activeCategory===cat ? accent : '#666', transition:'all 0.15s', flexShrink:0,
                }}>
                {cat}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* PRODUCTS */}
      <div id="products" style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px 100px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8 }}>
          <h2 style={{ color:'#111', fontSize:17, fontWeight:700 }}>
            {searchQuery ? 'Search results' : activeCategory === 'All' ? 'All Products' : activeCategory}
            <span style={{ color:'#bbb', fontWeight:400, fontSize:14, marginLeft:8 }}>({filtered.length})</span>
          </h2>
          {buyerCurrency && buyerCurrency !== (store?.base_currency || 'USD') && (
            <button onClick={() => setShowLocal(!showLocal)} style={{
              fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20,
              border:'1px solid #e0e0e0', background: showLocal ? '#f0f0f0' : '#fff',
              color:'#555', cursor:'pointer', display:'flex', alignItems:'center', gap:4,
            }}>
              {showLocal ? getCurrencySymbol(buyerCurrency) + ' ' + buyerCurrency : getCurrencySymbol(store?.base_currency) + ' ' + (store?.base_currency || '')}
              <span style={{ fontSize:10, color:'#999' }}>⇄</span>
            </button>
          )}
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ fontSize:12, color:'#999', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>
              Clear search ×
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>{searchQuery ? '🔍' : '🛍️'}</div>
            <p style={{ color:'#bbb', fontSize:14 }}>
              {searchQuery ? 'No products match "' + searchQuery + '"' : 'No products available yet'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ marginTop:12, padding:'8px 18px', borderRadius:8, background:accent, border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap:16 }}>
            {filtered.map(product => {
              const qty = getQty(product.id);
              const oos = product.stock === 0 || !product.is_available;
              return (
                <div key={product.id} style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:12, overflow:'hidden', transition:'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div onClick={() => { if (!oos) { setSelectedVariant(null); setSelectedProduct(product); setSelectedImageIndex(0); } }} style={{ aspectRatio:'1', background:'#ffffff', position:'relative', overflow:'hidden', cursor: oos ? 'default' : 'pointer', border:'1px solid #f0f0f0' }}>
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'contain', transition:'transform 0.3s' }} onMouseEnter={e => (e.currentTarget.style.transform='scale(1.04)')} onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, color:'#ddd' }}>🛍️</div>}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div style={{ position:'absolute', top:8, left:8, background: product.stock<=2 ? '#ef4444' : '#f59e0b', color:'#fff', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                        {product.stock<=2 ? `Only ${product.stock} left!` : `${product.stock} left`}
                      </div>
                    )}
                    {oos && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.75)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ background:'#111', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6 }}>Sold Out</span></div>}
                  </div>
                  <div style={{ padding:'12px 14px' }}>
                    <p onClick={() => { if (!oos) { setSelectedVariant(null); setSelectedProduct(product); setSelectedImageIndex(0); } }} style={{ color:'#111', fontSize:14, fontWeight:600, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor: oos ? 'default' : 'pointer' }}>{product.name}</p>
                    {product.category && <p style={{ color:'#bbb', fontSize:11, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{product.category}</p>}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                      <p style={{ color:accent, fontSize:16, fontWeight:800 }}>{sym + dp(product.price, product.price_currency).toLocaleString()}</p>
                      {oos ? <span style={{ color:'#bbb', fontSize:12 }}>Unavailable</span>
                        : qty === 0 ? (
                          <button onClick={() => {
                          if (product.variants && product.variants.length > 0) {
                            setSelectedVariant(null);
                            setSelectedProduct(product);
                            setSelectedImageIndex(0);
                          } else {
                            addToCart(product);
                          }
                        }} style={{ padding:'6px 13px', borderRadius:7, background:accent, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
                          {product.variants && product.variants.length > 0 ? 'Select' : 'Add'}
                        </button>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f5f5', borderRadius:7, padding:'4px 8px' }}>
                            <button onClick={() => updateQty(product.id, qty-1)} style={{ width:22, height:22, borderRadius:5, background:'#fff', border:'1px solid #e5e5e5', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <span style={{ color:'#111', fontSize:13, fontWeight:700, minWidth:14, textAlign:'center' }}>{qty}</span>
                            <button onClick={() => updateQty(product.id, Math.min(qty+1, product.stock))} style={{ width:22, height:22, borderRadius:5, background:'#fff', border:'1px solid #e5e5e5', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background:'#111', borderTop:'1px solid #222', padding:'40px 20px 28px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          {/* Top row */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:32, justifyContent:'space-between', marginBottom:32 }}>
            {/* Brand */}
            <div style={{ maxWidth:280 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                {store?.logo_url
                  ? <img src={store.logo_url} alt={store.store_name} style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }} />
                  : <div style={{ width:36, height:36, borderRadius:8, background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏪</div>}
                <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{store?.store_name}</span>
              </div>
              {store?.description && <p style={{ color:'#888', fontSize:13, lineHeight:1.6 }}>{store.description}</p>}
            </div>
            {/* Links */}
            <div style={{ display:'flex', gap:40, flexWrap:'wrap' }}>
              <div>
                <p style={{ color:'#555', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Connect</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {store?.whatsapp && <a href={waLink(store.whatsapp)} target="_blank" rel="noreferrer" style={{ color:'#888', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.833L.057 23.7a.75.75 0 00.919.919l5.867-1.453A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.73 9.73 0 01-4.964-1.355l-.357-.212-3.692.915.931-3.594-.232-.371A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                    WhatsApp
                  </a>}
                  {store?.instagram && <a href={'https://instagram.com/'+store.instagram} target="_blank" rel="noreferrer" style={{ color:'#888', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    {'@'+store.instagram}
                  </a>}
                </div>
              </div>
              <div>
                <p style={{ color:'#555', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Shop</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {allCategories.filter(c => c !== 'All').slice(0,4).map(cat => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); window.scrollTo({top:0,behavior:'smooth'}); }}
                      style={{ color:'#888', fontSize:13, background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}>
                      {cat}
                    </button>
                  ))}
                  <button onClick={() => setActiveCategory('All')} style={{ color:'#888', fontSize:13, background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}>All Products</button>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom row */}
          <div style={{ borderTop:'1px solid #222', paddingTop:20, display:'flex', flexWrap:'wrap', gap:12, alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ color:'#555', fontSize:12 }}>© {new Date().getFullYear()} {store?.store_name}. All rights reserved.</p>
            <div style={{ display:'flex', gap:16 }}>
              <span style={{ color:'#444', fontSize:12 }}>🚚 Pay on Delivery</span>
              <span style={{ color:'#444', fontSize:12 }}>🔒 Secure</span>
              <span style={{ color:'#444', fontSize:12 }}>💬 WhatsApp Support</span>
            </div>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOAT BUTTON — visible when cart is empty */}
      {store?.whatsapp && cartCount === 0 && !showCart && !showCheckout && (
        <div style={{ position:'fixed', bottom:24, right:20, zIndex:90 }}>
          <a href={waLink(store.whatsapp)} target="_blank" rel="noreferrer"
            style={{ width:54, height:54, borderRadius:'50%', background:'#25d366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(37,211,102,0.4)', textDecoration:'none', transition:'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform='scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.833L.057 23.7a.75.75 0 00.919.919l5.867-1.453A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.73 9.73 0 01-4.964-1.355l-.357-.212-3.692.915.931-3.594-.232-.371A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
          </a>
        </div>
      )}
      {/* FLOATING CART */}
      {cartCount > 0 && !showCart && !showCheckout && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:90, width:'calc(100% - 32px)', maxWidth:440 }}>
          <button onClick={() => setShowCart(true)} style={{ width:'100%', padding:'14px 20px', background:'#111', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 8px 28px rgba(0,0,0,0.22)' }}>
            <span style={{ background:'rgba(255,255,255,0.15)', borderRadius:7, padding:'2px 10px', fontSize:13 }}>{cartCount} item{cartCount!==1?'s':''}</span>
            <span>View Cart</span>
            <span style={{ fontWeight:800 }}>{sym+cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setShowCart(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
          <div style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:'20px 20px 0 0', padding:'22px 20px 32px', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 -8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ width:36, height:4, borderRadius:2, background:'#e5e5e5', margin:'0 auto 18px' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ color:'#111', fontSize:18, fontWeight:800 }}>Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} style={{ width:30, height:30, borderRadius:'50%', background:'#f5f5f5', border:'none', cursor:'pointer', color:'#666', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {cart.map(item => {
                const itemPrice = dp(item.variant?.price != null ? item.variant.price : item.product.price, item.product.price_currency);
                const itemStock = item.variant ? item.variant.stock : item.product.stock;
                const variantLabel = item.variant ? [item.variant.variant_value_1, item.variant.variant_value_2].filter(Boolean).join(' / ') : null;
                return (
                <div key={item.cartKey} style={{ display:'flex', gap:10, background:'#fafafa', borderRadius:10, padding:'10px 12px', alignItems:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:8, background:'#f0f0f0', overflow:'hidden', flexShrink:0 }}>
                    {item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🛍️</div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:'#111', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.product.name}</p>
                    {variantLabel && <p style={{ color:'#999', fontSize:11, marginBottom:2 }}>{variantLabel}</p>}
                    <p style={{ color:accent, fontSize:13, fontWeight:700 }}>{sym+Number(itemPrice).toLocaleString()}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <button onClick={() => updateQty(item.cartKey, item.quantity-1)} style={{ width:24, height:24, borderRadius:5, background:'#fff', border:'1px solid #e5e5e5', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ color:'#111', fontSize:13, fontWeight:700, minWidth:14, textAlign:'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.cartKey, Math.min(item.quantity+1, itemStock))} style={{ width:24, height:24, borderRadius:5, background:'#fff', border:'1px solid #e5e5e5', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartKey)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:15, padding:0 }}>×</button>
                </div>
                );
              })}
            </div>
            <div style={{ background:'#f9f9f9', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
              {discountAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span style={{ color:'#22c55e', fontSize:13 }}>Discount ({discountCode})</span><span style={{ color:'#22c55e', fontSize:13, fontWeight:600 }}>-{sym+discountAmt.toLocaleString()}</span></div>}
              {deliveryFee > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span style={{ color:'#666', fontSize:13 }}>Delivery fee</span><span style={{ color:'#111', fontSize:13, fontWeight:600 }}>{sym+deliveryFee.toLocaleString()}</span></div>}
              {deliveryFee===0 && store && (store.delivery_fee||0) > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span style={{ color:'#22c55e', fontSize:13 }}>Delivery</span><span style={{ color:'#22c55e', fontSize:13, fontWeight:600 }}>Free!</span></div>}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #eee', marginTop:4 }}>
                <span style={{ color:'#111', fontSize:15, fontWeight:700 }}>Total</span>
                <span style={{ color:'#111', fontSize:17, fontWeight:800 }}>{sym+cartTotal.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => { setShowCart(false); setShowCheckout(true); }} style={{ width:'100%', padding:'14px 0', background:accent, border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer' }}>Checkout →</button>
          </div>
        </div>
      )}

      {/* CHECKOUT */}
      {showCheckout && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setShowCheckout(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
          <div style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:'20px 20px 0 0', padding:'22px 20px 32px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 -8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ width:36, height:4, borderRadius:2, background:'#e5e5e5', margin:'0 auto 18px' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div><h3 style={{ color:'#111', fontSize:18, fontWeight:800 }}>Checkout</h3><p style={{ color:'#999', fontSize:13 }}>{cartCount} item{cartCount!==1?'s':''} · {sym+cartTotal.toLocaleString()}</p></div>
              <button onClick={() => { setShowCheckout(false); setShowCart(true); }} style={{ width:30, height:30, borderRadius:'50%', background:'#f5f5f5', border:'none', cursor:'pointer', color:'#666', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ background:'#f9f9f9', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
              <p style={{ color:'#999', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Order Summary</p>
              {cart.map(item => {
                const itemPrice = dp(item.variant?.price != null ? item.variant.price : item.product.price, item.product.price_currency);
                const variantLabel = item.variant ? [item.variant.variant_value_1, item.variant.variant_value_2].filter(Boolean).join(' / ') : null;
                return (
                <div key={item.cartKey} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:'#666', fontSize:13 }}>{item.product.name}{variantLabel ? ' ('+variantLabel+')' : ''} x{item.quantity}</span>
                  <span style={{ color:'#111', fontSize:13, fontWeight:600 }}>{sym+(Number(itemPrice)*item.quantity).toLocaleString()}</span>
                </div>
                );
              })}
              {discountAmt > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ color:'#22c55e', fontSize:13 }}>Discount ({discountCode})</span><span style={{ color:'#22c55e', fontSize:13, fontWeight:600 }}>-{sym+discountAmt.toLocaleString()}</span></div>}
              {deliveryFee > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ color:'#666', fontSize:13 }}>Delivery</span><span style={{ color:'#111', fontSize:13, fontWeight:600 }}>{sym+deliveryFee.toLocaleString()}</span></div>}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #eee', marginTop:4 }}>
                <span style={{ color:'#111', fontSize:14, fontWeight:700 }}>Total</span>
                <span style={{ color:accent, fontSize:15, fontWeight:800 }}>{sym+cartTotal.toLocaleString()}</span>
              </div>
            </div>
            {formError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, marginBottom:12 }}>{formError}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              <input type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name:e.target.value})} placeholder="Full name *" style={inputStyle} />
              <input type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone:e.target.value})} placeholder="WhatsApp number * (e.g. 08031234567)" style={inputStyle} />
              <textarea value={checkoutForm.note} onChange={e => setCheckoutForm({...checkoutForm, note:e.target.value})} placeholder="Order note (optional)" rows={2} style={{ ...inputStyle, resize:'none', fontFamily:'inherit' }} />
              <div style={{ background:'#f9f9f9', border:'1px solid #e5e5e5', borderRadius:9, padding:'11px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => setProvideAddress(!provideAddress)}>
                  <div style={{ width:18, height:18, borderRadius:4, border:'2px solid '+(provideAddress?accent:'#d1d5db'), background:provideAddress?accent:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                    {provideAddress && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                  </div>
                  <p style={{ color:'#111', fontSize:13, fontWeight:600 }}>Provide delivery address</p>
                </div>
                {provideAddress && <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Full delivery address..." rows={2} style={{ width:'100%', background:'transparent', border:'none', borderTop:'1px solid #e5e5e5', marginTop:8, paddingTop:8, color:'#111', fontSize:13, outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box' }} />}
                {!provideAddress && <p style={{ color:'#999', fontSize:12, marginTop:5, marginLeft:26 }}>Seller will ask on WhatsApp</p>}
              </div>
            </div>
            {/* Payment Method */}
            <div style={{ marginBottom:12 }}>
              <p style={{ color:'#111', fontSize:13, fontWeight:700, marginBottom:8 }}>Payment Method</p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setPaymentMethod('pay_on_delivery')} style={{
                  flex:1, padding:'12px 10px', borderRadius:10, cursor:'pointer', textAlign:'center',
                  border: paymentMethod === 'pay_on_delivery' ? '2px solid '+accent : '1px solid #e5e5e5',
                  background: paymentMethod === 'pay_on_delivery' ? accent+'10' : '#fff',
                }}>
                  <p style={{ fontSize:18, marginBottom:4 }}>🚚</p>
                  <p style={{ color:'#111', fontSize:12, fontWeight:700 }}>Pay on Delivery</p>
                </button>
                {(store as any)?.bank_name && (store as any)?.account_number && (
                  <button onClick={() => setPaymentMethod('bank_transfer')} style={{
                    flex:1, padding:'12px 10px', borderRadius:10, cursor:'pointer', textAlign:'center',
                    border: paymentMethod === 'bank_transfer' ? '2px solid '+accent : '1px solid #e5e5e5',
                    background: paymentMethod === 'bank_transfer' ? accent+'10' : '#fff',
                  }}>
                    <p style={{ fontSize:18, marginBottom:4 }}>🏦</p>
                    <p style={{ color:'#111', fontSize:12, fontWeight:700 }}>Bank Transfer</p>
                  </button>
                )}
              </div>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank_transfer' && (
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'14px 16px', marginBottom:12 }}>
                <p style={{ color:'#166534', fontSize:13, fontWeight:700, marginBottom:10 }}>Transfer to this account:</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#555', fontSize:13 }}>Bank</span>
                    <span style={{ color:'#111', fontSize:13, fontWeight:700 }}>{(store as any)?.bank_name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#555', fontSize:13 }}>Account Name</span>
                    <span style={{ color:'#111', fontSize:13, fontWeight:700 }}>{(store as any)?.account_name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#555', fontSize:13 }}>Account Number</span>
                    <span style={{ color:'#111', fontSize:13, fontWeight:700 }}>{(store as any)?.account_number}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #bbf7d0', paddingTop:6, marginTop:2 }}>
                    <span style={{ color:'#555', fontSize:13 }}>Amount</span>
                    <span style={{ color:'#166534', fontSize:15, fontWeight:800 }}>{sym+cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ marginTop:12 }}>
                  <p style={{ color:'#166534', fontSize:12, fontWeight:600, marginBottom:6 }}>Upload transfer receipt *</p>
                  {receiptUrl ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <img src={receiptUrl} alt="Receipt" style={{ width:60, height:60, borderRadius:8, objectFit:'cover', border:'1px solid #bbf7d0' }} />
                      <div>
                        <p style={{ color:'#166534', fontSize:12, fontWeight:600 }}>Receipt uploaded ✓</p>
                        <button onClick={() => setReceiptUrl('')} style={{ color:'#dc2626', fontSize:11, background:'none', border:'none', cursor:'pointer', padding:0 }}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display:'block', padding:'14px 0', borderRadius:8, border:'2px dashed #bbf7d0', textAlign:'center', cursor:'pointer', background:'#f0fdf4' }}>
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if (e.target.files?.[0]) handleReceiptUpload(e.target.files[0]); }} />
                      <p style={{ color:'#166534', fontSize:13, fontWeight:600 }}>{uploadingReceipt ? '⏳ Uploading...' : '📎 Tap to upload receipt'}</p>
                    </label>
                  )}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:6, alignItems:'flex-start', background:'#f9f9f9', borderRadius:8, padding:'9px 12px', marginBottom:12 }}>
              <span style={{ flexShrink:0 }}>🔒</span>
              <p style={{ color:'#888', fontSize:12, lineHeight:1.5 }}>Order sent directly to seller. {paymentMethod === 'bank_transfer' ? 'Your receipt will be verified by the seller.' : 'Pay on delivery.'}</p>
            </div>
            <button onClick={handleCheckout} disabled={placing || !checkoutForm.name || !checkoutForm.phone || (paymentMethod === 'bank_transfer' && !receiptUrl)}
              style={{ width:'100%', padding:'14px 0', background: placing||!checkoutForm.name||!checkoutForm.phone ? '#ccc' : accent, border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:800, cursor: placing||!checkoutForm.name||!checkoutForm.phone ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {placing ? <span style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ width:15, height:15, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'spin 0.8s linear infinite', display:'inline-block' }} />Placing order...</span> : `Place Order · ${sym+cartTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL */}
      {selectedProduct && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setSelectedProduct(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
          <div style={{ position:'relative', width:'100%', maxWidth:520, background:'#fff', borderRadius:'20px 20px 0 0', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 -8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ aspectRatio:'1.5', background:'#f9f9f9', position:'relative', overflow:'hidden', borderRadius:'20px 20px 0 0' }}>
              {(() => {
                const gallery = [
                  ...(selectedProduct.image_url ? [selectedProduct.image_url] : []),
                  ...((selectedProduct as any).images?.map((img: any) => img.image_url) || []),
                ];
                if (gallery.length === 0) return <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:60 }}>🛍️</div>;
                const idx = Math.min(selectedImageIndex, gallery.length - 1);
                return (
                  <>
                    <img src={gallery[idx]} alt={selectedProduct.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                    {gallery.length > 1 && (
                      <>
                        <div style={{ position:'absolute', bottom:10, left:0, right:0, display:'flex', justifyContent:'center', gap:5 }}>
                          {gallery.map((_, i) => (
                            <button key={i} onClick={() => setSelectedImageIndex(i)} style={{
                              width: i === idx ? 16 : 6, height: 6, borderRadius: 100,
                              background: i === idx ? accent : 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s',
                            }} />
                          ))}
                        </div>
                        <button onClick={() => setSelectedImageIndex((idx - 1 + gallery.length) % gallery.length)} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button onClick={() => setSelectedImageIndex((idx + 1) % gallery.length)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
              <button onClick={() => setSelectedProduct(null)} style={{ position:'absolute', top:12, right:12, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.9)', border:'none', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', color:'#111' }}>×</button>
              {(() => {
                const stockShown = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                return stockShown<=5 && stockShown>0 && <div style={{ position:'absolute', top:12, left:12, background:stockShown<=2?'#ef4444':'#f59e0b', color:'#fff', borderRadius:7, padding:'3px 9px', fontSize:11, fontWeight:800 }}>{stockShown<=2?`Only ${stockShown} left!`:`${stockShown} left`}</div>;
              })()}
            </div>
            <div style={{ padding:'18px 20px 32px' }}>
              {selectedProduct.category && <p style={{ color:'#bbb', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{selectedProduct.category}</p>}
              <h2 style={{ color:'#111', fontSize:19, fontWeight:800, marginBottom:6 }}>{selectedProduct.name}</h2>
              <p style={{ color:accent, fontSize:22, fontWeight:900, marginBottom:12 }}>
                {sym+dp(selectedVariant?.price != null ? selectedVariant.price : selectedProduct.price, selectedProduct.price_currency).toLocaleString()}
              </p>
              {selectedProduct.description && <p style={{ color:'#555', fontSize:14, lineHeight:1.7, marginBottom:14, background:'#f9f9f9', borderRadius:8, padding:'11px 13px' }}>{selectedProduct.description}</p>}

              {/* Variant picker */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (() => {
                const variants = selectedProduct.variants!;
                const type1 = variants[0]?.variant_type_1;
                const type2 = variants[0]?.variant_type_2;
                const values1 = Array.from(new Set(variants.map(v => v.variant_value_1).filter(Boolean))) as string[];
                const values2 = type2 ? Array.from(new Set(variants.map(v => v.variant_value_2).filter(Boolean))) as string[] : [];

                return (
                  <div style={{ marginBottom: 16 }}>
                    {type1 && (
                      <div style={{ marginBottom: type2 ? 12 : 0 }}>
                        <p style={{ color:'#888', fontSize:12, fontWeight:700, marginBottom:8 }}>{type1}</p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {values1.map(v1 => {
                            const matchingVariant = variants.find(v => v.variant_value_1 === v1 && (!selectedVariant?.variant_value_2 || v.variant_value_2 === selectedVariant?.variant_value_2)) || variants.find(v => v.variant_value_1 === v1);
                            const isSelected = selectedVariant?.variant_value_1 === v1;
                            const isOOS = matchingVariant ? matchingVariant.stock === 0 || !matchingVariant.is_available : true;
                            return (
                              <button key={v1} disabled={isOOS}
                                onClick={() => {
                                  const next = variants.find(v => v.variant_value_1 === v1 && (selectedVariant?.variant_value_2 ? v.variant_value_2 === selectedVariant.variant_value_2 : !v.variant_value_2)) || variants.find(v => v.variant_value_1 === v1);
                                  if (next) setSelectedVariant(next);
                                }}
                                style={{ padding:'7px 14px', borderRadius:8, border: isSelected ? '2px solid '+accent : '1px solid #e5e5e5', background: isSelected ? accent+'15' : '#fff', color: isOOS ? '#ccc' : '#111', fontSize:13, fontWeight:600, cursor: isOOS ? 'not-allowed' : 'pointer', textDecoration: isOOS ? 'line-through' : 'none' }}>
                                {v1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {type2 && values2.length > 0 && (
                      <div>
                        <p style={{ color:'#888', fontSize:12, fontWeight:700, marginBottom:8 }}>{type2}</p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {values2.map(v2 => {
                            const matchingVariant = variants.find(v => v.variant_value_2 === v2 && (!selectedVariant?.variant_value_1 || v.variant_value_1 === selectedVariant?.variant_value_1)) || variants.find(v => v.variant_value_2 === v2);
                            const isSelected = selectedVariant?.variant_value_2 === v2;
                            const isOOS = matchingVariant ? matchingVariant.stock === 0 || !matchingVariant.is_available : true;
                            return (
                              <button key={v2} disabled={isOOS}
                                onClick={() => {
                                  const next = variants.find(v => v.variant_value_2 === v2 && (selectedVariant?.variant_value_1 ? v.variant_value_1 === selectedVariant.variant_value_1 : true)) || variants.find(v => v.variant_value_2 === v2);
                                  if (next) setSelectedVariant(next);
                                }}
                                style={{ padding:'7px 14px', borderRadius:8, border: isSelected ? '2px solid '+accent : '1px solid #e5e5e5', background: isSelected ? accent+'15' : '#fff', color: isOOS ? '#ccc' : '#111', fontSize:13, fontWeight:600, cursor: isOOS ? 'not-allowed' : 'pointer', textDecoration: isOOS ? 'line-through' : 'none' }}>
                                {v2}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
                {(() => {
                  const stockShown = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                  return (
                    <>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:stockShown>5?'#22c55e':stockShown>0?'#f59e0b':'#ef4444', display:'inline-block' }} />
                      <span style={{ color:'#666', fontSize:13 }}>{stockShown>5?'In stock':stockShown>0?stockShown+' left':'Out of stock'}</span>
                    </>
                  );
                })()}
              </div>
              {(() => {
                const hasVariants = selectedProduct.variants && selectedProduct.variants.length > 0;
                const variantNotChosen = hasVariants && !selectedVariant;
                const stockAvailable = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                const qty = getQty(selectedProduct.id, selectedVariant?.id);

                if (variantNotChosen) {
                  return <button disabled style={{ width:'100%', padding:'14px 0', background:'#ddd', border:'none', borderRadius:10, color:'#888', fontSize:15, fontWeight:800, cursor:'not-allowed' }}>Select an option above</button>;
                }
                if (stockAvailable === 0) {
                  return <button disabled style={{ width:'100%', padding:'14px 0', background:'#ddd', border:'none', borderRadius:10, color:'#888', fontSize:15, fontWeight:800, cursor:'not-allowed' }}>Out of Stock</button>;
                }
                if (qty===0) return <button onClick={() => { addToCart(selectedProduct, selectedVariant); setSelectedProduct(null); }} style={{ width:'100%', padding:'14px 0', background:accent, border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer' }}>Add to Cart</button>;
                return (
                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f5f5f5', borderRadius:10, padding:'9px 14px', flex:1, justifyContent:'space-between' }}>
                      <button onClick={() => updateQty(makeCartKey(selectedProduct.id, selectedVariant?.id), qty-1)} style={{ width:28, height:28, borderRadius:7, background:'#fff', border:'1px solid #e5e5e5', cursor:'pointer', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <span style={{ color:'#111', fontSize:14, fontWeight:800 }}>{qty} in cart</span>
                      <button onClick={() => updateQty(makeCartKey(selectedProduct.id, selectedVariant?.id), Math.min(qty+1, stockAvailable))} style={{ width:28, height:28, borderRadius:7, background:'#fff', border:'1px solid #e5e5e5', cursor:'pointer', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                    </div>
                    <button onClick={() => { setSelectedProduct(null); setShowCart(true); }} style={{ padding:'12px 16px', background:accent, border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>View Cart</button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* POPUP */}
      {showPopup && !discountUnlocked && store && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={dismissPopup} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
          <div style={{ position:'relative', width:'100%', maxWidth:480, background:'#fff', borderRadius:'20px 20px 0 0', padding:'30px 22px 38px', textAlign:'center', boxShadow:'0 -8px 40px rgba(0,0,0,0.15)' }}>
            <button onClick={dismissPopup} style={{ position:'absolute', top:12, right:12, width:28, height:28, borderRadius:'50%', background:'#f5f5f5', border:'none', cursor:'pointer', color:'#666', fontSize:15 }}>×</button>
            <div style={{ fontSize:44, marginBottom:8 }}>🎁</div>
            <h3 style={{ color:'#111', fontSize:21, fontWeight:800, marginBottom:6 }}>Get {store.popup_discount||10}% OFF!</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:18, lineHeight:1.5 }}>{store.popup_message||'Enter your WhatsApp number to unlock this discount'}</p>
            <input type="tel" value={popupPhone} onChange={e => setPopupPhone(e.target.value)} placeholder="Your WhatsApp number" style={{ width:'100%', background:'#f9f9f9', border:'1px solid #e5e5e5', borderRadius:10, padding:'13px 14px', color:'#111', fontSize:15, outline:'none', boxSizing:'border-box', marginBottom:10, textAlign:'center' }} />
            <button onClick={unlockDiscount} disabled={popupSubmitting||popupPhone.trim().length<10} style={{ width:'100%', padding:'13px 0', background:popupSubmitting||popupPhone.trim().length<10?'#ccc':accent, border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:800, cursor:popupSubmitting||popupPhone.trim().length<10?'not-allowed':'pointer' }}>
              {popupSubmitting?'Unlocking...':'🔓 Unlock My Discount'}
            </button>
            <p style={{ color:'#ccc', fontSize:11, marginTop:8 }}>The seller may contact you on WhatsApp</p>
          </div>
        </div>
      )}

      {/* DISCOUNT BANNER */}
      {discountUnlocked && store && (
        <div style={{ position:'fixed', top:12, left:'50%', transform:'translateX(-50%)', zIndex:400, background:'#22c55e', borderRadius:8, padding:'7px 16px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(34,197,94,0.35)', whiteSpace:'nowrap' }}>
          <span>🎉</span>
          <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>{store.popup_discount||10}% off · {discountCode}</span>
        </div>
      )}

      {store && (
        <StorefrontChat
          storeName={store.store_name}
          accentColor={accent}
          products={products}
          deliveryFee={(store as any).delivery_fee || 0}
          freeDeliveryAbove={(store as any).free_delivery_above || 0}
          whatsapp={(store as any).whatsapp}
          currencySymbol={sym}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes trustScroll{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}} ::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}