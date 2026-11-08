"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import MobileDemoPhone from '@/components/MobileDemoPhone';
import { detectProPricing, ProPricing } from '@/lib/proPricing';

const INDIGO = '#4F46E5';
const EMERALD = '#10B981';
const DARK = '#0a0a0f';
const DARK_CARD = '#1a1a26';
const TEXT_PRIMARY = '#f8fafc';
const TEXT_SECONDARY = '#cbd5e1';
const BORDER = '#374151';

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [pricing, setPricing] = useState<ProPricing>({ amount: 15, currency: 'USD', display: '$15/month', region: 'global' });

  useEffect(() => { detectProPricing().then(setPricing); }, []);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides = ['hero', 'preview', 'mobile', 'features', 'pricing'];

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 6000);
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
    { title: 'Abandoned order recovery', desc: 'Recover lost sales automatically.' },
  ];

  return (
    <div style={{ flexDirection: 'column', overflow: 'hidden' }}>
      {/* HEADER */}
      <header style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10, background: DARK, padding: '16px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 130 170" fill="none">
              <path d="M12,0 L12,160" stroke="#818cf8" strokeWidth="28" strokeLinecap="round"/>
              <path d="M14,80 L100,12" stroke="#818cf8" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="40,72 48,67 76,26 68,32" fill="transparent"/>
              <polygon points="92,-2 118,20 92,28" fill="#00C77A" stroke="#00C77A" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M14,80 L100,152" stroke="#818cf8" strokeWidth="28" strokeLinecap="round"/>
              <circle cx="86" cy="156" r="4.5" fill="#818cf8" opacity="0.55"/>
              <circle cx="100" cy="156" r="4.5" fill="#818cf8" opacity="0.55"/>
              <circle cx="114" cy="156" r="4.5" fill="#818cf8" opacity="0.55"/>
            </svg>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: '#818cf8' }}>Kormerce</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#818cf8', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            <Link href="/signup" style={{ color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'linear-gradient(135deg, ' + INDIGO + ', #6366F1)', padding: '8px 16px', borderRadius: 6 }}>
              Go Pro
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, width: '100%', padding: '40px 24px' }}>

        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', marginBottom: '64px', maxWidth: 880, marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: -0.5 }}>Start selling in minutes</h1>
          <p style={{ fontSize: 18, color: TEXT_SECONDARY, marginBottom: 32, lineHeight: 1.6 }}>Turn your social media followers into paying customers. No coding, no warehouse - just sell anywhere.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 6, background: 'linear-gradient(135deg, ' + INDIGO + ', #6366F1)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Get Started</Link>
            <Link href="/features" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 6, border: '1px solid ' + BORDER, color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Features</Link>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section style={{ marginBottom: '64px' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} style={{ padding: '32px 24px', background: DARK_CARD, borderRadius: 12, textAlign: 'center', width: '250px', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                  <div style={{ width: 48, height: 48, margin: '0 auto 24px', background: 'linear-gradient(135deg, ' + INDIGO + ', #6366F1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>}
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" color="#fff" style={{ width: '100%', height: '100%' }}>}
                      <path d="M12 19l9 2L9 3l11 8-11 8z"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.3px' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: '1.5' }}>{f.desc}</p>
                </div>
              ))}}
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section style={{ marginBottom: '64px' }}>}
          <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>}
            <p style={{ fontSize: 16, color: TEXT_SECONDARY, marginBottom: '16px' }}>Trusted by thousands of sellers worldwide</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>}
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</div>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</div>
            </div>
            <p style={{ fontSize: 13, marginTop: '12px', color: TEXT_SECONDARY }}>★★★★★</p>
          </div>
        </section>

        {/* PRICING CALL TO ACTION */}
        <section style={{ background: linear-gradient(135deg, #1e293b, #0f172a), borderTop: '1px solid rgba(255,255,255,0.05)', padding: '64px 24px', textAlign: 'center', maxWidth: 880, marginLeft: 'auto', marginRight: 'auto' }}>}
          <h2 style={{ fontSize: 40px, fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.3px' }}>Start your free trial</h2>
          <p style={{ fontSize: 18px, color: TEXT_SECONDARY, marginBottom: '32px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>14-day free trial • No credit card required • Cancel anytime</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>}
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 8, background: 'linear-gradient(135deg, ' + INDIGO + ', #6366F1)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>Get Your Free Trial</Link>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 8, border: '1px solid ' + BORDER, color: '#fff', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>View Pricing</Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', background: DARK, marginTop: 'auto', fontSize: 13 }}>}
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit', gap: '24px', justifyItems: 'center', alignItems: 'start', width: '100%' }}>}
          <div style={{ textAlign: 'center' }}>}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#818cf8', marginBottom: '12x' }}>Kormerce</span>
            <p style={{ color: TEXT_SECONDARY, lineHeight: '1.6' }}>Operating system for modern sellers. Build, sell, and scale your business.</p>
          </div>
          <div>}
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: '16x' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>}
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="/features" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>Features</a>
              </li>
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="/pricing" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>Pricing</a>
              </li>
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="/signup" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>Sign up</a>
              </li>
            </ul>
          </div>
          <div>}
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: '16x' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>}
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="#" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>About</a>
              </li>
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="#" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>Blog</a>
              </li>
            </ul>
          </div>
          <div>}
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: '16x' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>}
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="/terms" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>Terms</a>
              </li>
              <li style={{ marginBottom: '8x', color: TEXT_SECONDARY, cursor: 'pointer' }} onMouseOver={{{ e: any => e.target.style.color = '#fff' }} onMouseOut={{{ e: any => e.target.style.color = TEXT_SECONDARY }}>
                <a href="/privacy" style={{ color: TEXT_SECONDARY, textDecoration: 'none' }}>Privacy</a>
              </li>
            </ul>
          </div>
        </div>
        <div style={{ maxWidth: 1120, margin: '24px auto 0', textAlign: 'center', color: TEXT_SECONDARY }}>}
          &copy; {new Date().getFullYear()} Kormerce. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
