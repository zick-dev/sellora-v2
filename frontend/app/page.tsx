'use client';

import { useState } from 'react';
import Link from 'next/link';

const INDIGO = '#4F46E5';
const INDIGO_DARK = '#3730A3';
const EMERALD = '#10B981';
const DARK_BG = '#0d0d14';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const steps = [
    { num: '1', title: 'Sign up free', desc: 'Create your account in under a minute.' },
    { num: '2', title: 'Add your products', desc: 'Upload photos, set prices, organize by category.' },
    { num: '3', title: 'Share your link', desc: 'Send it on WhatsApp or Instagram.' },
    { num: '4', title: 'Get paid on delivery', desc: 'No card, no processor, no friction.' },
  ];

  const features = [
    { title: 'Your own branded link', desc: 'Every storefront is white-labeled — your name, your brand, no watermark.' },
    { title: 'Pay on delivery', desc: 'No card or bank setup required for your customers to order.' },
    { title: 'AI that helps you sell', desc: 'Auto-replies, FAQ generation, and promo writing, built in.' },
    { title: 'Full control over delivery', desc: 'Set your own delivery fee and free-delivery threshold.' },
  ];

  const whyKormerce = [
    { title: 'Built for how Africa actually sells', desc: 'Pay-on-delivery first. No card required, ever.' },
    { title: 'Your brand, always', desc: 'Customers see your store — never ours.' },
    { title: 'Free to start, no catch', desc: '15 products free, forever. Upgrade only when ready.' },
  ];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif', color: '#0a0a0a', background: '#fff' }}>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>K</div>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>Kormerce</span>
          </div>

          <nav style={{ display: 'none', gap: 36, alignItems: 'center' }} className="desktop-nav">
            <a href="#features" style={{ color: '#444', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#444', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Pricing</a>
            <Link href="/login" style={{ color: '#444', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/signup" className="hide-mobile" style={{ padding: '10px 20px', borderRadius: 100, background: '#0a0a0a', color: '#fff', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
              Get started — it's free
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, background: '#fff' }}>
            <a href="#features" onClick={() => setMenuOpen(false)} style={{ color: '#333', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ color: '#333', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Pricing</a>
            <Link href="/login" style={{ color: '#333', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
            <Link href="/signup" style={{ padding: '13px 0', borderRadius: 10, background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Get started — it's free
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{ padding: '110px 24px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: '#f4f4f6', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: EMERALD }} />
            <span style={{ fontSize: 12.5, color: '#555', fontWeight: 500 }}>Built for WhatsApp &amp; Instagram sellers</span>
          </div>

          <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 68px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-2px', marginBottom: 24, color: '#0a0a0a' }}>
            Your chats, now a<br />real online store.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#666', lineHeight: 1.6, marginBottom: 38, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            No card to start. No bank setup. Just a store link you can share today, and orders you get paid for on delivery.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            <Link href="/signup" style={{ padding: '15px 30px', borderRadius: 100, background: INDIGO, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Start selling free
            </Link>
            <Link href="/store/amakas-closet" style={{ padding: '15px 30px', borderRadius: 100, background: '#fff', color: '#0a0a0a', fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid #e2e2e2' }}>
              View a live store →
            </Link>
          </div>
          <p style={{ color: '#aaa', fontSize: 13 }}>Free forever for your first 15 products</p>
        </div>

        {/* Browser-chrome screenshot mockup */}
        <div style={{ maxWidth: 920, margin: '64px auto 0' }}>
          <div style={{ borderRadius: '18px 18px 0 0', background: '#f0f0f2', border: '1px solid #e4e4e7', borderBottom: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: '4px 16px', fontSize: 12.5, color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                kormerce.com/store/amakas-closet
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #e4e4e7', borderRadius: '0 0 18px 18px', overflow: 'hidden', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.18)' }}>
            {/* Mini storefront header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: INDIGO }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Amaka's Closet</span>
              </div>
              <div style={{ padding: '7px 14px', borderRadius: 8, background: INDIGO, color: '#fff', fontSize: 12, fontWeight: 700 }}>Cart · 2</div>
            </div>
            {/* Mini storefront body */}
            <div style={{ background: '#fafafa', padding: '28px 24px 32px' }}>
              <p style={{ fontSize: 12, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>All Products · 8</p>
              <div className="hero-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { name: 'Ankara Wrap Dress', price: '₦15,000', img: 'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=400&q=70' },
                  { name: 'Denim Jacket', price: '₦22,000', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=70' },
                  { name: 'Kente Blouse', price: '₦9,500', img: 'https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=400&q=70' },
                  { name: 'Beaded Necklace', price: '₦6,500', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=70' },
                ].map(p => (
                  <div key={p.name} style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#222', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: INDIGO }}>{p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ padding: '64px 24px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 6vw, 56px)', flexWrap: 'wrap', opacity: 0.55 }}>
          {['No card required', 'Pay on delivery', 'Your brand, not ours', 'Setup in 1 minute'].map(t => (
            <span key={t} style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>{t}</span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: INDIGO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, textAlign: 'center', marginBottom: 64, letterSpacing: '-1px' }}>
            From sign up to first sale,<br />in four steps.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ padding: '0 16px', position: 'relative' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#ccc', marginBottom: 14 }}>{s.num.padStart(2, '0')}</p>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#888', fontSize: 13.5, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#fafafa', padding: '120px 24px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: INDIGO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, textAlign: 'center', marginBottom: 64, letterSpacing: '-1px' }}>
            Everything you need.<br />Nothing you don't.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: '#e8e8e8', borderRadius: 20, overflow: 'hidden' }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#fff', padding: '36px 32px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: '#777', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: INDIGO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, textAlign: 'center', marginBottom: 64, letterSpacing: '-1px' }}>
            Start free.<br />Pay only if you grow.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

            <div style={{ border: '1px solid #eee', borderRadius: 20, padding: '32px 28px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#999', marginBottom: 8 }}>Free</p>
              <p style={{ fontSize: 38, fontWeight: 800, marginBottom: 24 }}>₦0</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28 }}>
                {['15 products', 'Basic storefront', 'Manual order tracking'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <span style={{ color: '#ccc', fontWeight: 700, fontSize: 13 }}>—</span>
                    <span style={{ color: '#555', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 10, border: '1px solid #ddd', color: '#222', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Start free
              </Link>
            </div>

            <div style={{ border: '1px solid #0a0a0a', borderRadius: 20, padding: '32px 28px', background: '#0a0a0a' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#999', marginBottom: 8 }}>Pro</p>
              <p style={{ fontSize: 38, fontWeight: 800, marginBottom: 2, color: '#fff' }}>
                ₦5,000<span style={{ fontSize: 15, fontWeight: 500, color: '#888' }}>/mo</span>
              </p>
              <p style={{ fontSize: 12.5, color: '#777', marginBottom: 24 }}>Billed monthly</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28 }}>
                {['Unlimited products', 'AI tools included', 'Custom domain', 'Lead recovery', 'Priority support'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <span style={{ color: EMERALD, fontWeight: 700, fontSize: 13 }}>+</span>
                    <span style={{ color: '#ddd', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 10, background: '#fff', color: '#0a0a0a', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Go Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY KORMERCE (dark anchor section) */}
      <section style={{ background: DARK_BG, padding: '120px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, textAlign: 'center', marginBottom: 64, color: '#fff', letterSpacing: '-1px' }}>
            Why sellers choose Kormerce
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>
            {whyKormerce.map(w => (
              <div key={w.title}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: EMERALD, marginBottom: 18 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{w.title}</h3>
                <p style={{ color: '#999', fontSize: 14, lineHeight: 1.65 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '120px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-1px' }}>
            Your store is one link away.
          </h2>
          <p style={{ color: '#888', fontSize: 16, marginBottom: 32 }}>
            Free to start. No card. No bank setup.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 100, background: INDIGO, color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Start selling free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11 }}>K</div>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>Kormerce</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="#features" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Pricing</a>
            <Link href="/store/amakas-closet" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Live store</Link>
            <Link href="/login" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Log in</Link>
          </div>
          <p style={{ color: '#bbb', fontSize: 12.5 }}>© 2026 Kormerce</p>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .hide-mobile { display: inline-block !important; }
        }
        @media (max-width: 767px) {
          .mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; }
          .hide-mobile { display: none !important; }
          .hero-product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
