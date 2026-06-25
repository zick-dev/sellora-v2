'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';


const INDIGO = '#4F46E5';
const EMERALD = '#10B981';
const DARK_BG = '#0d0d14';
const SLIDE_DURATION = 6000;

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides = ['hero', 'preview', 'features', 'pricing'];

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeSlide, paused, slides.length]);

  function goTo(i: number) { setActiveSlide(i); }
  function next() { setActiveSlide(prev => (prev + 1) % slides.length); }
  function prev() { setActiveSlide(prev => (prev - 1 + slides.length) % slides.length); }

  const features = [
    { title: 'Your own branded link', desc: 'No watermark. Your name, your brand.' },
    { title: 'Pay on delivery', desc: 'No card or bank setup needed.' },
    { title: 'AI that helps you sell', desc: 'Auto-replies, FAQs, promo writing.' },
    { title: 'Full delivery control', desc: 'Set your own fee and free-delivery line.' },
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      color: '#0a0a0a', background: 'transparent',
      height: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* HEADER */}
      <header style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10, background: 'transparent' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="https://res.cloudinary.com/dkun9hvkf/image/upload/v1782429673/visily-image_3_evsmr4.png" alt="Kormerce" style={{ height: 42, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(79,70,229,0.4))' }} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', color: '#818cf8' }}>Kormerce</span>
          </div>
          <Link href="/login" style={{ color: '#818cf8', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </div>
      </header>

      {/* CAROUSEL — fills remaining space */}
      <main
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', minHeight: 0, overflowY: 'auto', overflow: 'hidden' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Duotone photo background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1662858557337-48c9ecf07ee0?w=1600&auto=format&fit=crop&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          filter: 'grayscale(100%) contrast(1.2)',
          animation: 'kenBurns 28s ease-in-out infinite alternate',
        }} />
        {/* Indigo shadow/midtone layer */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: '#4F46E5',
          mixBlendMode: 'multiply',
          opacity: 0.85,
        }} />
        {/* Emerald highlight layer */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(160deg, transparent 30%, #10B981 100%)',
          mixBlendMode: 'screen',
          opacity: 0.25,
        }} />
        {/* Semi-opaque indigo veil for readability */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'linear-gradient(180deg, rgba(79,70,229,0.35) 0%, rgba(13,13,20,0.45) 100%)',
        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
        }} />

        <button onClick={prev} className="carousel-arrow" aria-label="Previous"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.4"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={next} className="carousel-arrow" aria-label="Next"
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <div style={{ width: '100%', maxWidth: 920, maxHeight: '88%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5 }}>
          <div style={{
            width: '100%', padding: 'clamp(24px, 4vh, 48px) clamp(20px, 4vw, 48px)',
            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 28,
            boxShadow: '0 20px 60px -16px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.04)',
          }}>

          {/* SLIDE 0 — Hero */}
          {activeSlide === 0 && (
            <div key="hero" className="slide-fade" style={{ textAlign: 'center', maxWidth: 620 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.15)', marginBottom: 'clamp(14px, 3vh, 26px)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: EMERALD }} />
                <span style={{ fontSize: 12.5, color: INDIGO, fontWeight: 600 }}>Built for WhatsApp &amp; Instagram sellers</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 5.5vw, 52px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-1.5px', marginBottom: 'clamp(12px, 2.5vh, 22px)', color: '#111' }}>
                Your chats, now a<br />real <span style={{ color: INDIGO }}>online store</span>.
              </h1>
              <p style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', color: '#3f3f46', lineHeight: 1.55, marginBottom: 'clamp(18px, 3.5vh, 30px)', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                No card to start. No bank setup. Just a store link you can share today, and orders you get paid for on delivery.
              </p>
              <Link href="/signup" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, background: 'linear-gradient(135deg, ' + INDIGO + ', #6366F1)', color: '#fff', fontSize: 14.5, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 24px -6px rgba(79,70,229,0.45)' }}>
                Start selling free
              </Link>
            </div>
          )}

          {/* SLIDE 1 — Storefront preview */}
          {activeSlide === 1 && (
            <div key="preview" className="slide-fade" style={{ width: '100%', maxWidth: 760 }}>
              <div style={{ borderRadius: '14px 14px 0 0', background: '#f0f0f2', border: '1px solid #e4e4e7', borderBottom: 'none', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 7, padding: '3px 13px', fontSize: 11.5, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    kormerce.com/store/amakas-closet
                  </div>
                </div>
              </div>
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '0 0 14px 14px', overflow: 'hidden', boxShadow: '0 20px 50px -18px rgba(0,0,0,0.16)' }}>
                <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: INDIGO }} />
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>Amaka's Closet</span>
                  </div>
                  <div style={{ padding: '5px 11px', borderRadius: 7, background: INDIGO, color: '#fff', fontSize: 11, fontWeight: 700 }}>Cart · 2</div>
                </div>
                <div style={{ background: '#fafafa', padding: '20px 20px 24px' }}>
                  <div className="hero-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 11 }}>
                    {[
                      { name: 'Ankara Wrap Dress', price: '₦15,000', img: 'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=400&q=70' },
                      { name: 'Denim Jacket', price: '₦22,000', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=70' },
                      { name: 'Kente Blouse', price: '₦9,500', img: 'https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=400&q=70' },
                      { name: 'Beaded Necklace', price: '₦6,500', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=70' },
                    ].map(p => (
                      <div key={p.name} style={{ background: '#fff', borderRadius: 10, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                          <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#222', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 800, color: INDIGO }}>{p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2 — Features */}
          {activeSlide === 2 && (
            <div key="features" className="slide-fade" style={{ width: '100%' }}>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 30px)', fontWeight: 800, textAlign: 'center', marginBottom: 'clamp(24px, 4vh, 40px)', letterSpacing: '-0.5px', color: '#111' }}>
                Everything you need. <span style={{ color: INDIGO }}>Nothing you don't.</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {features.map(f => (
                  <div key={f.title} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(79,70,229,0.12)', borderRadius: 14, padding: '20px 20px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: EMERALD, marginBottom: 12 }} />
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 7, color: '#111' }}>{f.title}</h3>
                    <p style={{ color: '#52525b', fontSize: 12.5, lineHeight: 1.55 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 3 — Pricing */}
          {activeSlide === 3 && (
            <div key="pricing" className="slide-fade" style={{ width: '100%' }}>
              <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 30px)', fontWeight: 800, textAlign: 'center', marginBottom: 'clamp(24px, 4vh, 40px)', letterSpacing: '-0.5px', color: '#111' }}>
                Start free. <span style={{ color: INDIGO }}>Pay only if you grow.</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 600, margin: '0 auto' }}>
                <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 18, padding: '22px 20px' }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#71717a', marginBottom: 5 }}>Free</p>
                  <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 14, color: '#111' }}>₦0</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {['15 products', 'Basic storefront', 'Manual tracking'].map(f => (
                      <div key={f} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ color: '#a1a1aa', fontWeight: 700, fontSize: 11 }}>—</span>
                        <span style={{ color: '#3f3f46', fontSize: 12.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 9, border: '1.5px solid ' + INDIGO, color: INDIGO, fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                    Start free
                  </Link>
                </div>
                <div style={{ border: '1px solid ' + INDIGO, borderRadius: 18, padding: '22px 20px', background: 'linear-gradient(160deg, #1e1b4b, #0d0d14)', position: 'relative', boxShadow: '0 16px 40px -10px rgba(79,70,229,0.4)' }}>
                  <div style={{ position: 'absolute', top: -10, right: 16, background: EMERALD, color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em' }}>POPULAR</div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#a5b4fc', marginBottom: 5 }}>Pro</p>
                  <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 1, color: '#fff' }}>
                    ₦5,000<span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>/mo</span>
                  </p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>Billed monthly</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {['Unlimited products', 'AI tools included', 'Custom domain'].map(f => (
                      <div key={f} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ color: EMERALD, fontWeight: 700, fontSize: 11 }}>+</span>
                        <span style={{ color: '#e4e4e7', fontSize: 12.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 9, background: 'linear-gradient(135deg, ' + INDIGO + ', #6366F1)', color: '#fff', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                    Go Pro
                  </Link>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </main>

      {/* DOTS */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', gap: 8, padding: '10px 0 16px', minHeight: 28, background: 'transparent', position: 'relative', zIndex: 10 }}>
        {slides.map((s, i) => (
          <button
            key={s}
            onClick={() => goTo(i)}
            aria-label={'Go to slide ' + (i + 1)}
            style={{
              width: activeSlide === i ? 22 : 8, height: 8, borderRadius: 100,
              background: activeSlide === i ? '#fff' : 'rgba(255,255,255,0.3)',
              border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0,
            }}
          />
        ))}
      </div>

      <style>{`
        html, body { overflow: hidden; height: 100%; margin: 0; }
        @media (max-width: 640px) {
          .hero-product-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .carousel-arrow { display: none !important; }
        }
        @media (max-height: 700px) {
          .slide-fade h1 { font-size: clamp(22px, 6vw, 34px) !important; }
          .slide-fade h2 { font-size: clamp(18px, 4vw, 24px) !important; margin-bottom: 16px !important; }
          .slide-fade p { font-size: 13px !important; }
        }
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-2%, -1%); }
        }
        .slide-fade { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

      `}</style>
    </div>
  );
}
