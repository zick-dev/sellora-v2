'use client';

import { useEffect, useState } from 'react';

const INDIGO = '#4F46E5';

const SCREENS = ['home', 'product', 'cart', 'checkout'] as const;
type Screen = typeof SCREENS[number];

const PRODUCTS = [
  { name: 'Oversized Graphic Hoodie', price: '$45', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=70' },
  { name: 'Retro Chunky Sneakers', price: '$68', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=70' },
  { name: 'Denim Trucker Jacket', price: '$52', img: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=400&q=70' },
  { name: 'Boxy Fit Graphic Tee', price: '$24', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=70' },
];

export default function MobileDemoPhone() {
  const [screenIndex, setScreenIndex] = useState(0);
  const screen: Screen = SCREENS[screenIndex];

  useEffect(() => {
    const t = setTimeout(() => setScreenIndex(i => (i + 1) % SCREENS.length), 3200);
    return () => clearTimeout(t);
  }, [screenIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* iPhone frame */}
      <div style={{
        width: 260, height: 540, borderRadius: 44, background: '#111',
        padding: 12, boxShadow: '0 30px 70px -20px rgba(0,0,0,0.35)', position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 26, background: '#111', borderRadius: '0 0 16px 16px', zIndex: 10,
        }} />
        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden', background: '#fff', position: 'relative' }}>

          {/* Status bar */}
          <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 10, fontWeight: 700, color: '#111' }}>
            <span>9:41</span>
            <span>●●●</span>
          </div>

          {/* HOME SCREEN */}
          {screen === 'home' && (
            <div className="phone-fade" style={{ padding: '4px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: '#111' }} />
                  <span style={{ fontWeight: 800, fontSize: 12 }}>Kicks &amp; Fits</span>
                </div>
                <span style={{ fontSize: 14 }}>🛒</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflow: 'hidden' }}>
                {['All', 'Sneakers', 'Hoodies', 'Tees'].map((c, i) => (
                  <span key={c} style={{
                    fontSize: 9.5, fontWeight: 600, padding: '4px 9px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: i === 0 ? '#111' : '#f2f2f2', color: i === 0 ? '#fff' : '#666',
                  }}>{c}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PRODUCTS.map(p => (
                  <div key={p.name} style={{ borderRadius: 10, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '6px 7px' }}>
                      <p style={{ fontSize: 8.5, fontWeight: 600, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: 10, fontWeight: 800, color: INDIGO }}>{p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCT DETAIL SCREEN */}
          {screen === 'product' && (
            <div className="phone-fade">
              <div style={{ aspectRatio: '1.1', overflow: 'hidden' }}>
                <img src={PRODUCTS[1].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 8.5, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Sneakers</p>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 4 }}>{PRODUCTS[1].name}</h3>
                <p style={{ fontSize: 16, fontWeight: 900, color: INDIGO, marginBottom: 10 }}>{PRODUCTS[1].price}</p>
                <p style={{ fontSize: 8.5, fontWeight: 700, color: '#111', marginBottom: 5 }}>Size</p>
                <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                  {['40', '41', '42', '43'].map((s, i) => (
                    <span key={s} style={{
                      fontSize: 9, fontWeight: 700, width: 24, height: 24, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: i === 1 ? '1.5px solid ' + INDIGO : '1px solid #e5e5e5',
                      color: i === 1 ? INDIGO : '#666',
                    }}>{s}</span>
                  ))}
                </div>
                <div style={{ background: INDIGO, borderRadius: 9, padding: '9px 0', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 10.5 }}>
                  Add to Cart
                </div>
              </div>
            </div>
          )}

          {/* CART SCREEN */}
          {screen === 'cart' && (
            <div className="phone-fade" style={{ padding: '4px 14px' }}>
              <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Your Cart</p>
              {[PRODUCTS[1], PRODUCTS[0]].map(p => (
                <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fafafa', borderRadius: 9, padding: 7, marginBottom: 7 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 8.5, fontWeight: 600, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ fontSize: 9.5, fontWeight: 800, color: INDIGO }}>{p.price}</p>
                  </div>
                  <span style={{ fontSize: 8, color: '#999' }}>×1</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#111' }}>Total</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: INDIGO }}>$113</span>
              </div>
              <div style={{ background: INDIGO, borderRadius: 9, padding: '9px 0', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 10.5 }}>
                Checkout →
              </div>
            </div>
          )}

          {/* CHECKOUT SCREEN */}
          {screen === 'checkout' && (
            <div className="phone-fade" style={{ padding: '4px 14px' }}>
              <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Checkout</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {['Full name', 'WhatsApp number'].map(ph => (
                  <div key={ph} style={{ background: '#f7f7f7', border: '1px solid #eee', borderRadius: 8, padding: '7px 9px', fontSize: 9, color: '#aaa' }}>{ph}</div>
                ))}
              </div>
              <p style={{ fontSize: 8.5, fontWeight: 700, color: '#111', marginBottom: 6 }}>Payment Method</p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <div style={{ flex: 1, borderRadius: 8, border: '1.5px solid ' + INDIGO, background: INDIGO + '10', padding: '8px 6px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, marginBottom: 2 }}>🚚</p>
                  <p style={{ fontSize: 7.5, fontWeight: 700, color: '#111' }}>Pay on Delivery</p>
                </div>
                <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e5e5', padding: '8px 6px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, marginBottom: 2 }}>🏦</p>
                  <p style={{ fontSize: 7.5, fontWeight: 700, color: '#666' }}>Bank Transfer</p>
                </div>
              </div>
              <div style={{ background: INDIGO, borderRadius: 9, padding: '9px 0', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 10.5 }}>
                Place Order · $113
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screen indicator dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {SCREENS.map((s, i) => (
          <span key={s} style={{
            width: i === screenIndex ? 16 : 6, height: 6, borderRadius: 100,
            background: i === screenIndex ? INDIGO : '#ddd', transition: 'all 0.25s',
          }} />
        ))}
      </div>

      <style>{`
        .phone-fade { animation: phoneFadeIn 0.35s ease; }
        @keyframes phoneFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
