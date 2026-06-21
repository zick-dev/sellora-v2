'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const C = {
  bg:         '#0d0d14',
  card:       '#13131f',
  cardBorder: '#1e1e30',
  input:      '#1a1a2e',
  inputBorder:'#2a2a3e',
  purple:     '#4F46E5',
  purpleLight:'#8b5cf6',
  muted:      '#6b7280',
  mutedLight: '#9ca3af',
  text:       '#ffffff',
  subtext:    '#c4c4d4',
  navBg:      '#0a0a12',
  navBorder:  '#1a1a2e',
  pink:       '#ec4899',
};

export default function SignedOutPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) { router.push('/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  const progress = ((5 - countdown) / 5) * 100;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @keyframes fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        a:hover { opacity: 0.85; }
      `}</style>

      <main style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 440,
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 20, padding: '40px 32px 32px',
          textAlign: 'center',
          animation: 'fadein 0.4s ease',
        }}>
          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `2px solid ${C.cardBorder}`,
            background: C.input,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.subtext} strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
            Successfully Signed Out
          </h1>
          <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
            Your secure session has ended. We've cleared your local data to keep your store management private.
          </p>

          {/* Countdown */}
          <div style={{
            background: C.input, border: `1px solid ${C.inputBorder}`,
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.mutedLight} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2" strokeLinecap="round"/>
            </svg>
            <span style={{ color: C.mutedLight, fontSize: 13 }}>
              Redirecting to login in {countdown}s
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 3, background: C.inputBorder, borderRadius: 2,
            overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
              width: `${progress}%`,
              transition: 'width 1s linear',
            }} />
          </div>

          {/* CTA */}
          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px 0',
            background: C.purple, borderRadius: 10,
            color: C.text, fontWeight: 700, fontSize: 15,
            textDecoration: 'none', marginBottom: 16,
          }}>
            Return to Sign In →
          </Link>

          {/* Security badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(79,70,229,0.08)',
            border: `1px solid rgba(79,70,229,0.2)`,
            borderRadius: 20, padding: '6px 14px',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.purpleLight} strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ color: C.purpleLight, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Secure Cloud Authentication Active
            </span>
          </div>
        </div>

        {/* Footer links */}
        <div style={{ display: 'flex', gap: 20, marginTop: 28 }}>
          {['Help Center', 'Privacy Policy', 'Support'].map((label, i) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <a href="#" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>{label}</a>
              {i < 2 && <span style={{ color: C.inputBorder }}>•</span>}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.navBg, borderTop: `1px solid ${C.navBorder}`,
          padding: '14px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, background: C.purple,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
                  fill="white" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ color: C.mutedLight, fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>
              Kormerce
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>V 2.4.0-Stable</span>
            <span style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Premium Seller Tools</span>
          </div>
        </div>
      </main>
    </>
  );
}