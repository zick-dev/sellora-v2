'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#0d0d14',
  card:      '#13131f',
  cardBorder:'#1e1e30',
  input:     '#1a1a2e',
  inputBorder:'#2a2a3e',
  inputFocus:'#7c3aed',
  purple:    '#7c3aed',
  purpleHov: '#6d28d9',
  purpleLight:'#8b5cf6',
  muted:     '#6b7280',
  mutedLight:'#9ca3af',
  text:      '#ffffff',
  subtext:   '#c4c4d4',
  error:     '#ef4444',
  success:   '#10b981',
  navBg:     '#0a0a12',
  navBorder: '#1a1a2e',
};

// ─── Shared layout components ─────────────────────────────────────────────────

function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: C.navBg,
      borderBottom: `1px solid ${C.navBorder}`,
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: C.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
              fill="white" stroke="white" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ color: C.purple, fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          Sellora
        </span>
      </div>
      <Link href="/login" style={{
        color: C.text, fontSize: 13, fontWeight: 600,
        padding: '7px 16px',
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 8,
        textDecoration: 'none',
        background: 'transparent',
      }}>
        Sign In
      </Link>
    </nav>
  );
}

function PageFooter() {
  return (
    <footer style={{ textAlign: 'center', paddingBottom: 32, marginTop: 8 }}>
      <p style={{ color: C.muted, fontSize: 12 }}>
        © 2024 Sellora • Premium Seller Tools
      </p>
    </footer>
  );
}

// ─── Forgot Password view ─────────────────────────────────────────────────────

function ForgotPasswordView({
  onSuccess,
}: {
  onSuccess: (email: string) => void;
}) {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState(false);

  async function handleSubmit() {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://sellora-v2-production.up.railway.app/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.');
      onSuccess(email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* Back + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <Link href="/login" style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `1px solid ${C.cardBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', color: C.subtext, flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <span style={{ color: C.mutedLight, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Reset Password
        </span>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>
          Forgot your password?
        </h1>
        <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
          No worries — it happens to the best of us. Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 16,
        padding: '28px 28px 24px',
        marginBottom: 24,
      }}>
        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            <span style={{ color: C.error, fontSize: 13 }}>{error}</span>
          </div>
        )}

        {/* Email field */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            color: C.subtext, fontSize: 12, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8,
          }}>
            Email Address
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: C.input,
            border: `1.5px solid ${focused ? C.inputFocus : C.inputBorder}`,
            borderRadius: 10, padding: '0 14px',
            transition: 'border-color 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="3"/>
              <path d="M2 7l10 7 10-7" strokeLinecap="round"/>
            </svg>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="joshua@example.com"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: C.text, fontSize: 14, padding: '13px 0',
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 0',
            background: loading ? '#4c2d9a' : C.purple,
            border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
            color: C.text, fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
              </svg>
              Sending...
            </>
          ) : (
            <>Send reset link <span style={{ fontSize: 16 }}>›</span></>
          )}
        </button>
      </div>

      {/* Secondary links */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '18px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        marginBottom: 24,
      }}>
        <Link href="/login" style={{
          color: C.subtext, fontSize: 14, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Return to Sign In
        </Link>
        <div style={{ width: '100%', height: 1, background: C.cardBorder }} />
        <p style={{ color: C.muted, fontSize: 13 }}>
          Having trouble?{' '}
          <a href="mailto:support@sellora.io" style={{ color: C.purpleLight, textDecoration: 'none' }}>
            Contact support
          </a>
        </p>
        <p style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3" strokeLinecap="round"/>
          </svg>
          Secured by Sellora Cloud Auth
        </p>
      </div>
    </div>
  );
}

// ─── Check Your Email view ────────────────────────────────────────────────────

function CheckEmailView({ email }: { email: string }) {
  const [countdown, setCountdown] = useState(120); // 2:00
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const mins = String(Math.floor(countdown / 60)).padStart(1, '0');
  const secs = String(countdown % 60).padStart(2, '0');

  async function handleResend() {
    if (!canResend) return;
    setResending(true);
    try {
      await fetch('https://sellora-v2-production.up.railway.app/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setCountdown(120);
      setCanResend(false);
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <Link href="/forgot-password" style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `1px solid ${C.cardBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', color: C.subtext,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <span style={{ color: C.mutedLight, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Back to Reset
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '36px 28px 28px',
        textAlign: 'center', marginBottom: 24,
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: `2px solid ${C.purple}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          background: 'rgba(124,58,237,0.1)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          Check your email
        </h2>
        <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>
          We've sent a password reset link to
        </p>
        <p style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 28 }}>
          {email}
        </p>

        <div style={{ height: 1, background: C.cardBorder, marginBottom: 24 }} />

        {/* Resend section */}
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>
          Didn't receive the email?
        </p>

        <button
          onClick={handleResend}
          disabled={!canResend || resending}
          style={{
            background: 'transparent', border: 'none',
            cursor: canResend ? 'pointer' : 'default',
            color: canResend ? C.purpleLight : C.muted,
            fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            margin: '0 auto 12px',
            transition: 'color 0.15s',
          }}
        >
          {resending ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {canResend ? 'Resend link' : `Resend link in ${mins}:${secs}`}
        </button>

        <a href="mailto:support@sellora.io" style={{
          color: C.subtext, fontSize: 13, display: 'block',
          marginBottom: 28, textDecoration: 'none',
        }}>
          Contact Support
        </a>

        {/* Return CTA */}
        <Link href="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '14px 0',
          background: C.purple, borderRadius: 10,
          color: C.text, fontWeight: 700, fontSize: 15,
          textDecoration: 'none', transition: 'background 0.15s',
        }}>
          Return to Sign In <span style={{ fontSize: 16 }}>›</span>
        </Link>
      </div>

      {/* Security badge */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Secured by Sellora Cloud Auth
        </p>
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${C.muted}; }
        a:hover { opacity: 0.85; }
      `}</style>

      <Navbar />

      <main style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '88px 20px 32px',
      }}>
        {sentTo ? (
          <CheckEmailView email={sentTo} />
        ) : (
          <ForgotPasswordView onSuccess={setSentTo} />
        )}

        <PageFooter />
      </main>
    </>
  );
}