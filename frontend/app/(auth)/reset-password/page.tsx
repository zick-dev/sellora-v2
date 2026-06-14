'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0d0d14',
  card:        '#13131f',
  cardBorder:  '#1e1e30',
  input:       '#1a1a2e',
  inputBorder: '#2a2a3e',
  inputFocus:  '#7c3aed',
  purple:      '#7c3aed',
  purpleHov:   '#6d28d9',
  purpleLight: '#8b5cf6',
  muted:       '#6b7280',
  mutedLight:  '#9ca3af',
  text:        '#ffffff',
  subtext:     '#c4c4d4',
  error:       '#ef4444',
  success:     '#10b981',
  navBg:       '#0a0a12',
  navBorder:   '#1a1a2e',
};

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: 'Weak',   color: C.error };
  if (score <= 3) return { score: 3, label: 'Fair',   color: '#f59e0b' };
  return               { score: 5, label: 'Strong', color: C.success };
}

// ─── Shared nav ───────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: C.navBg, borderBottom: `1px solid ${C.navBorder}`,
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: C.purple,
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
        padding: '7px 16px', border: `1px solid ${C.cardBorder}`,
        borderRadius: 8, textDecoration: 'none',
      }}>
        Sign In
      </Link>
    </nav>
  );
}

// ─── Invalid / expired token state ───────────────────────────────────────────
function InvalidTokenView() {
  return (
    <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '40px 28px',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          border: `2px solid ${C.error}`,
          background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
          Link expired
        </h2>
        <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          This password reset link has expired or already been used. Request a new one and check your inbox.
        </p>
        <Link href="/forgot-password" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '13px 0',
          background: C.purple, borderRadius: 10,
          color: C.text, fontWeight: 700, fontSize: 14,
          textDecoration: 'none',
        }}>
          Request a new link
        </Link>
        <Link href="/login" style={{
          display: 'block', marginTop: 14,
          color: C.mutedLight, fontSize: 13, textDecoration: 'none',
        }}>
          ← Return to Sign In
        </Link>
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────
function SuccessView() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/login'), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '40px 28px',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: `2px solid ${C.success}`,
          background: 'rgba(16,185,129,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ color: C.text, fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
          Password updated!
        </h2>
        <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Your password has been reset successfully. Redirecting you to sign in…
        </p>

        {/* Auto-redirect progress bar */}
        <div style={{
          height: 3, background: C.inputBorder, borderRadius: 2,
          overflow: 'hidden', marginBottom: 24,
        }}>
          <div style={{
            height: '100%', background: C.success, borderRadius: 2,
            animation: 'progress 4s linear forwards',
          }} />
        </div>

        <Link href="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '13px 0',
          background: C.purple, borderRadius: 10,
          color: C.text, fontWeight: 700, fontSize: 14,
          textDecoration: 'none',
        }}>
          Sign In now →
        </Link>
      </div>
    </div>
  );
}

// ─── Main reset form ──────────────────────────────────────────────────────────
function ResetForm({ token }: { token: string }) {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [focusPw, setFocusPw]     = useState(false);
  const [focusCf, setFocusCf]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [expired, setExpired]     = useState(false);

  const strength = getStrength(password);
  const match = confirm.length > 0 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit() {
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://sellora-v2-production.up.railway.app/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422) {
        const msg = (data.detail || '').toLowerCase();
        if (msg.includes('expir') || msg.includes('invalid')) {
          setExpired(true); return;
        }
        throw new Error(data.detail || 'Something went wrong.');
      }
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (expired) return <InvalidTokenView />;
  if (success)  return <SuccessView />;

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* Back + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <Link href="/login" style={{
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
          New Password
        </span>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Set a new password
        </h1>
        <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.6 }}>
          Choose something strong. You won't need to remember it if you use a password manager.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 16, padding: '28px 28px 24px',
        marginBottom: 24,
      }}>
        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            <span style={{ color: C.error, fontSize: 13 }}>{error}</span>
          </div>
        )}

        {/* New password */}
        <div style={{ marginBottom: 8 }}>
          <label style={{
            color: C.subtext, fontSize: 12, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase',
            display: 'block', marginBottom: 8,
          }}>
            New Password
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: C.input,
            border: `1.5px solid ${focusPw ? C.inputFocus : C.inputBorder}`,
            borderRadius: 10, padding: '0 14px',
            transition: 'border-color 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
            </svg>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusPw(true)}
              onBlur={() => setFocusPw(false)}
              placeholder="Min. 8 characters"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: C.text, fontSize: 14, padding: '13px 0',
                letterSpacing: password ? 2 : 0,
              }}
            />
            <button
              onClick={() => setShowPw(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.muted }}
            >
              {showPw ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= strength.score ? strength.color : C.inputBorder,
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <p style={{ color: strength.color, fontSize: 11, fontWeight: 600 }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 24, marginTop: 16 }}>
          <label style={{
            color: C.subtext, fontSize: 12, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase',
            display: 'block', marginBottom: 8,
          }}>
            Confirm Password
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: C.input,
            border: `1.5px solid ${
              mismatch ? C.error : match ? C.success : focusCf ? C.inputFocus : C.inputBorder
            }`,
            borderRadius: 10, padding: '0 14px',
            transition: 'border-color 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={mismatch ? C.error : match ? C.success : C.muted} strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
            </svg>
            <input
              type={showCf ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onFocus={() => setFocusCf(true)}
              onBlur={() => setFocusCf(false)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Repeat your password"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: C.text, fontSize: 14, padding: '13px 0',
                letterSpacing: confirm ? 2 : 0,
              }}
            />
            {match && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {!match && (
              <button
                onClick={() => setShowCf(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.muted }}
              >
                {showCf ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            )}
          </div>
          {mismatch && (
            <p style={{ color: C.error, fontSize: 12, marginTop: 5 }}>Passwords don't match</p>
          )}
        </div>

        {/* Requirements checklist */}
        <div style={{
          background: C.input, borderRadius: 10, padding: '12px 14px',
          marginBottom: 20,
        }}>
          {[
            { label: 'At least 8 characters', ok: password.length >= 8 },
            { label: 'One uppercase letter',  ok: /[A-Z]/.test(password) },
            { label: 'One number',            ok: /[0-9]/.test(password) },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 6,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: r.ok ? 'rgba(16,185,129,0.15)' : 'transparent',
                border: `1.5px solid ${r.ok ? C.success : C.inputBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {r.ok && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ color: r.ok ? C.subtext : C.muted, fontSize: 12, transition: 'color 0.15s' }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 0',
            background: loading ? '#4c2d9a' : C.purple,
            border: 'none', borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
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
              Updating password…
            </>
          ) : (
            'Set new password →'
          )}
        </button>
      </div>

      {/* Footer link */}
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
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { from { width: 0% } to { width: 100% } }
        input::placeholder { color: ${C.muted}; }
        a:hover { opacity: 0.85; }
      `}</style>

      <Navbar />

      <main style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '88px 20px 32px',
      }}>
        {!token ? (
          <InvalidTokenView />
        ) : (
          <ResetForm token={token} />
        )}

        <footer style={{ textAlign: 'center', paddingBottom: 32, marginTop: 24 }}>
          <p style={{ color: C.muted, fontSize: 12 }}>© 2024 Sellora • Premium Seller Tools</p>
        </footer>
      </main>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d0d14' }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
