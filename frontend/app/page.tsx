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
                <div key={i} className="p-8 bg-gray-900 rounded-lg text-center w-64 mb-8 transition-transform hover:scale-105">
                  <div className="w-12 h-12 mx-auto mb-4 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" color="#fff" className="w-full h-full" d="M12 19l9 2L9 3l11 8-11 8z" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 line-height-6">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-12 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-gray-400 mb-8">Trusted by thousands of sellers worldwide</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-1">1</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-1">2</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-1">3</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-1">4</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-1">5</div>
            </div>
            <p style={{ fontSize: 13, marginTop: '12px', color: TEXT_SECONDARY }}>★★★★★</p>
          </div>
        </section>

        {/* PRICING CALL TO ACTION */}
        <section className="py-24 bg-gray-900 border-t border-gray-700 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Start your free trial</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">14-day free trial • No credit card required • Cancel anytime</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup" className="px-8 py-4 bg-indigo-600 rounded-lg text-white font-bold text-base">Get Your Free Trial</Link>
            <Link href="/pricing" className="px-8 py-4 border-2 border-white rounded-lg text-white font-semibold text-base">View Pricing</Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-700 py-12 bg-gray-900">        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-indigo-600 mb-4">Kormerce</span>
            <p className="text-gray-400 leading-relaxed">Operating system for modern sellers. Build, sell, and scale your business.</p>
          </div>
            <h4 className="text-sm font-bold mb-4">Product</h4>
            <ul className="list-disc pl-6">
              <li className="mb-4 hover:text-white cursor-pointer"><a href="/features" className="text-gray-400 hover:text-white text-decoration-none">Features</a></li>
              <li className="mb-4 hover:text-white cursor-pointer"><a href="/pricing" className="text-gray-400 hover:text-white text-decoration-none">Pricing</a></li>
              <li className="mb-4 hover:text-white cursor-pointer"><a href="/signup" className="text-gray-400 hover:text-white text-decoration-none">Sign up</a></li>
            </ul>
        </div>
            <h4 className="text-sm font-bold mb-4">Company</h4>
            <ul className="list-disc pl-6">
              <li>
                <a href="#" >About</a>
              </li>
              <li>
                <a href="#" >Blog</a>
            </ul>
        </div>
            <h4 className="text-sm font-bold mb-4">Legal</h4>
            <ul className="list-disc pl-6">
              <li>
                <a href="/terms" >Terms</a>
              </li>
              <li>
                <a href="/privacy" >Privacy</a>
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
