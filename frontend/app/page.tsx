'use client';

import { useState } from 'react';
import Link from 'next/link';

const INDIGO = '#4F46E5';
const INDIGO_DARK = '#3730A3';
const EMERALD = '#10B981';
const DARK_BG = '#0d0d14';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    { icon: '🔗', title: 'Your own branded store link', desc: 'Share a store link that shows your brand — no Kormerce watermark.' },
    { icon: '🚚', title: 'Pay on delivery — no card needed', desc: 'Accept orders without requiring cards or bank setup.' },
    { icon: '✨', title: 'AI tools', desc: 'Auto-reply suggestions, FAQ generator, promo writer.' },
    { icon: '💰', title: 'Delivery fee control', desc: 'Set delivery fees or a free-delivery threshold per store.' },
    { icon: '🌗', title: 'Dark / Light dashboard', desc: 'Manage your store in the theme you prefer.' },
    { icon: '💬', title: 'WhatsApp-first experience', desc: 'Checkout and order updates optimized for chat-based buyers.' },
  ];

  const steps = [
    { num: '1', title: 'Sign up free', desc: 'Create your account in under a minute. No card required.' },
    { num: '2', title: 'Add your products', desc: 'Upload photos, set prices, and organize by category.' },
    { num: '3', title: 'Share your store link', desc: 'Send it on WhatsApp, Instagram, or anywhere your customers are.' },
    { num: '4', title: 'Get orders, get paid', desc: 'Manage orders and get paid on delivery — no processor needed.' },
  ];

  const whyKormerce = [
    { title: 'Built for pay-on-delivery markets', desc: 'No card, no bank API, no friction for your customers.' },
    { title: 'Your brand, not ours', desc: 'Every storefront is fully white-labeled to the seller.' },
    { title: 'AI that actually helps', desc: 'Reply faster, write promos, and answer FAQs without the busywork.' },
    { title: 'Free to start, no catch', desc: '15 products free, forever. Upgrade only when you are ready.' },
  ];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif', color: '#111' }}>

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>K</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#111', letterSpacing: '-0.3px' }}>Kormerce</span>
          </div>

          <nav style={{ display: 'none', gap: 28, alignItems: 'center' }} className="desktop-nav">
            <a href="#features" style={{ color: '#444', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#444', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Pricing</a>
            <Link href="/login" style={{ color: '#444', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Login</Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/signup" className="hide-mobile" style={{ padding: '9px 18px', borderRadius: 8, background: INDIGO, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Start Selling Free
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, background: '#fff' }}>
            <a href="#features" onClick={() => setMenuOpen(false)} style={{ color: '#333', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ color: '#333', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Pricing</a>
            <Link href="/login" style={{ color: '#333', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>Login</Link>
            <Link href="/signup" style={{ padding: '12px 0', borderRadius: 8, background: INDIGO, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Start Selling Free
            </Link>
          </div>
        )}
      </header>

      <section style={{ background: '#fff', padding: '60px 20px 70px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48 }}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 18, color: '#111' }}>
              Turn your WhatsApp &amp; Instagram chats into a <span style={{ color: INDIGO }}>real online store</span>
            </h1>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.6, marginBottom: 28, maxWidth: 480 }}>
              Start selling in minutes — no card required. Accept pay-on-delivery orders and use AI tools to manage messages, promos, and FAQs.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <Link href="/signup" style={{ padding: '14px 28px', borderRadius: 10, background: INDIGO, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Start Selling Free
              </Link>
              <Link href="/store/amakas-closet" style={{ padding: '14px 28px', borderRadius: 10, background: '#fff', color: INDIGO, fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1.5px solid ' + INDIGO }}>
                See a Live Store
              </Link>
            </div>
            <p style={{ color: '#999', fontSize: 13 }}>No card needed · Pay on delivery · Setup in under 1 minute</p>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 28, border: '1px solid #eee', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: INDIGO, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Amaka's Closet</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }} />
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ height: 8, width: '70%', background: '#e5e5e5', borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ height: 10, width: '40%', background: INDIGO, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ background: EMERALD, borderRadius: 10, padding: '10px 0', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                  View Cart · ₦12,500
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#fafafa', padding: '64px 20px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#111' }}>How it works</h2>
          <p style={{ color: '#777', textAlign: 'center', marginBottom: 44, fontSize: 15 }}>From sign up to your first sale, in four simple steps.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {steps.map(s => (
              <div key={s.num} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: EMERALD, color: '#fff', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#111' }}>{s.title}</h3>
                <p style={{ color: '#777', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" style={{ background: '#fff', padding: '70px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#111' }}>Everything you need to sell</h2>
          <p style={{ color: '#777', textAlign: 'center', marginBottom: 44, fontSize: 15 }}>Built specifically for chat-first, pay-on-delivery sellers.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#fafafa', borderRadius: 16, border: '1px solid #f0f0f0', padding: '24px 22px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#111' }}>{f.title}</h3>
                <p style={{ color: '#777', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ background: '#fafafa', padding: '70px 20px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#111' }}>Simple, fair pricing</h2>
          <p style={{ color: '#777', textAlign: 'center', marginBottom: 44, fontSize: 15 }}>Start free. Upgrade only when your store grows.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eee', padding: '28px 26px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Free</p>
              <p style={{ fontSize: 34, fontWeight: 900, color: '#111', marginBottom: 18 }}>₦0</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {['15 products limit', 'Basic storefront', 'Manual order tracking'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: EMERALD, fontWeight: 800 }}>✓</span>
                    <span style={{ color: '#444', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10, border: '1.5px solid #ddd', color: '#333', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Start Selling Free
              </Link>
            </div>

            <div style={{ background: '#fff', borderRadius: 18, border: '2px solid ' + INDIGO, padding: '28px 26px', position: 'relative', boxShadow: '0 12px 40px rgba(79,70,229,0.12)' }}>
              <div style={{ position: 'absolute', top: -12, right: 20, background: EMERALD, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
                MOST POPULAR
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: INDIGO, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Pro</p>
              <p style={{ fontSize: 34, fontWeight: 900, color: '#111', marginBottom: 2 }}>₦5,000<span style={{ fontSize: 15, fontWeight: 600, color: '#999' }}>/month</span></p>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 18 }}>Billed monthly (NGN)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {['Unlimited products', 'AI tools', 'Custom domain', 'Lead recovery', 'Priority support'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: EMERALD, fontWeight: 800 }}>✓</span>
                    <span style={{ color: '#444', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10, background: INDIGO, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Go Pro
              </Link>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, marginTop: 24 }}>Switch or cancel anytime. No card required to start.</p>
        </div>
      </section>

      <section style={{ background: DARK_BG, padding: '70px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#fff' }}>Why sellers choose Kormerce</h2>
          <p style={{ color: '#999', textAlign: 'center', marginBottom: 44, fontSize: 15 }}>Built around how African social commerce actually works.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {whyKormerce.map(w => (
              <div key={w.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 22px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: EMERALD, marginBottom: 14 }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{w.title}</h3>
                <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg, ' + INDIGO + ', ' + INDIGO_DARK + ')', padding: '70px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-0.5px' }}>
            Ready to turn your chats into sales?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 28 }}>
            No card needed · Pay on delivery · Get started in under 1 minute.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '15px 36px', borderRadius: 10, background: '#fff', color: INDIGO, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            Start Selling Free
          </Link>
        </div>
      </section>

      <footer style={{ background: DARK_BG, padding: '48px 20px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', marginBottom: 36 }}>
            <div style={{ maxWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>K</div>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Kormerce</span>
              </div>
              <p style={{ color: '#777', fontSize: 13, lineHeight: 1.6 }}>The simplest way to turn your social chats into a real online store.</p>
            </div>

            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Product</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href="#features" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>Features</a>
                  <a href="#pricing" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>Pricing</a>
                  <Link href="/store/amakas-closet" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>Live Store</Link>
                </div>
              </div>
              <div>
                <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Company</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ color: '#999', fontSize: 13 }}>About</span>
                  <span style={{ color: '#999', fontSize: 13 }}>Careers</span>
                  <span style={{ color: '#999', fontSize: 13 }}>Blog</span>
                </div>
              </div>
              <div>
                <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Support</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ color: '#999', fontSize: 13 }}>Help Center</span>
                  <span style={{ color: '#999', fontSize: 13 }}>Contact</span>
                  <span style={{ color: '#999', fontSize: 13 }}>Terms</span>
                  <span style={{ color: '#999', fontSize: 13 }}>Privacy</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: 12 }}>© 2026 Kormerce</p>
          </div>
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
        }
      `}</style>
    </div>
  );
}
