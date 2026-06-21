'use client';
import api from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0d0d14',
  card:        '#13131f',
  cardBorder:  '#1e1e30',
  input:       '#1a1a2e',
  inputBorder: '#2a2a3e',
  inputFocus:  '#4F46E5',
  purple:      '#4F46E5',
  purpleLight: '#8b5cf6',
  purpleDim:   'rgba(79,70,229,0.15)',
  muted:       '#6b7280',
  mutedLight:  '#9ca3af',
  text:        '#ffffff',
  subtext:     '#c4c4d4',
  success:     '#10b981',
  pink:        '#ec4899',
  navBg:       '#0a0a12',
  navBorder:   '#1a1a2e',
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: C.navBg, borderBottom: `1px solid ${C.navBorder}`,
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '0 24px',
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
          Kormerce
        </span>
      </div>
    </nav>
  );
}

// ─── Step dots ────────────────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1].map(i => (
        <div key={i} style={{
          height: 6, borderRadius: 3,
          width: i === current ? 24 : 6,
          background: i === current ? C.purple : C.inputBorder,
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Step 1: Account Created ──────────────────────────────────────────────────
function Step1({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 20, padding: '44px 32px 36px',
        animation: 'fadein 0.4s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: C.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 6px',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ color: C.text, fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Account Created!
        </h1>
        <p style={{ fontSize: 22, marginBottom: 16 }}>🎉</p>
        <p style={{ color: C.subtext, fontSize: 15, lineHeight: 1.7, marginBottom: 28, maxWidth: 300, margin: '0 auto 28px' }}>
          Welcome to the family. Now let's set up your store.
        </p>

        {/* Step dots */}
        <div style={{ marginBottom: 28 }}>
          <StepDots current={0} />
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '15px 0',
            background: C.purple, border: 'none', borderRadius: 10,
            color: C.text, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 20,
          }}
        >
          Continue →
        </button>

        <div style={{ height: 1, background: C.cardBorder, marginBottom: 16 }} />

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: C.purpleLight, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
              Secure &amp; Professional
            </p>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
              Join 5,000+ sellers who launched their automated stores in under 5 minutes.
            </p>
          </div>
        </div>
      </div>

      <p style={{ color: C.muted, fontSize: 13, marginTop: 20 }}>
        Having trouble?{' '}
        <a href="mailto:support@kormerce.io" style={{ color: C.purpleLight, textDecoration: 'none' }}>
          Contact our concierge support
        </a>
      </p>
    </div>
  );
}

// ─── Step 2: Create Your Store ────────────────────────────────────────────────
function Step2({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const [storeName, setStoreName]       = useState('');
  const [slug, setSlug]                 = useState('');
  const [slugEdited, setSlugEdited]     = useState(false);
  const [description, setDescription]  = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const [focusName, setFocusName]       = useState(false);
  const [focusSlug, setFocusSlug]       = useState(false);
  const [focusDesc, setFocusDesc]       = useState(false);
  const [editingSlug, setEditingSlug]   = useState(false);

  // Auto-generate slug from store name
  function toSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function handleStoreName(val: string) {
    setStoreName(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

  function handleSlugEdit(val: string) {
    setSlug(toSlug(val));
    setSlugEdited(true);
  }

  async function handleLaunch() {
  if (!storeName.trim()) { setError('Store name is required.'); return; }
  if (!slug.trim()) { setError('Store URL is required.'); return; }
  setError('');
  setLoading(true);
  try {
    await api.post('/api/store/setup', {
      store_name: storeName,
      slug,
      description,
    });
    router.push('/dashboard');
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Failed to create store.');
  } finally {
    setLoading(false);
  }
}
  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', animation: 'fadein 0.35s ease' }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.inputBorder, borderRadius: 2, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
          width: '100%', transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.subtext, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6, padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StepDots current={1} />
          <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
            STEP 02 / 02
          </span>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 20, padding: '32px 28px 28px',
        marginBottom: 20,
      }}>
        <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
          Create Your Store
        </h1>
        <p style={{ color: C.subtext, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Give your business a home on the web. You can change these details later.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#ef4444', fontSize: 13 }}>{error}</span>
          </div>
        )}

        {/* Store Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            color: C.subtext, fontSize: 12, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8,
          }}>
            Store Name
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: C.input,
            border: `1.5px solid ${focusName ? C.inputFocus : C.inputBorder}`,
            borderRadius: 10, padding: '0 14px', transition: 'border-color 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              value={storeName}
              onChange={e => handleStoreName(e.target.value)}
              onFocus={() => setFocusName(true)}
              onBlur={() => setFocusName(false)}
              placeholder="e.g. Luxe Threads"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: C.text, fontSize: 14, padding: '13px 0',
              }}
            />
          </div>
        </div>

        {/* Store URL */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{
              color: C.subtext, fontSize: 12, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              Your Store URL
            </label>
            <a href={slug ? `/store/${slug}` : '#'}
              target="_blank" rel="noreferrer"
              style={{
                color: C.purpleLight, fontSize: 11, fontWeight: 600,
                textDecoration: 'none', letterSpacing: 0.3,
                opacity: slug ? 1 : 0.4, pointerEvents: slug ? 'auto' : 'none',
              }}
            >
              Live Preview ↗
            </a>
          </div>

          <div style={{
            background: C.input,
            border: `1.5px solid ${focusSlug ? C.inputFocus : C.inputBorder}`,
            borderRadius: 10, padding: '12px 14px', transition: 'border-color 0.15s',
          }}>
            {editingSlug ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round"/>
                </svg>
                <span style={{ color: C.muted, fontSize: 13 }}>kormerce.io/</span>
                <input
                  autoFocus
                  type="text"
                  value={slug}
                  onChange={e => handleSlugEdit(e.target.value)}
                  onFocus={() => setFocusSlug(true)}
                  onBlur={() => { setFocusSlug(false); setEditingSlug(false); }}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.purple, fontSize: 13, fontWeight: 600,
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round"/>
                  </svg>
                  <span style={{ color: C.muted, fontSize: 13 }}>kormerce.io/</span>
                  <span style={{ color: C.purple, fontSize: 13, fontWeight: 600 }}>
                    {slug || <span style={{ color: C.muted, fontWeight: 400 }}>your-store</span>}
                  </span>
                </div>
                <button
                  onClick={() => setEditingSlug(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.purpleLight, fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
                  </svg>
                  Edit
                </button>
              </div>
            )}
          </div>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            This is the unique link you'll share with customers on WhatsApp and Instagram.
          </p>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{
              color: C.subtext, fontSize: 12, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              Store Description
            </label>
            <span style={{ color: C.muted, fontSize: 11 }}>OPTIONAL</span>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onFocus={() => setFocusDesc(true)}
            onBlur={() => setFocusDesc(false)}
            placeholder="Tell your customers what you sell and why they'll love your products..."
            rows={4}
            style={{
              width: '100%', background: C.input,
              border: `1.5px solid ${focusDesc ? C.inputFocus : C.inputBorder}`,
              borderRadius: 10, padding: '12px 14px',
              color: C.text, fontSize: 14, lineHeight: 1.6,
              outline: 'none', resize: 'vertical',
              fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Launch CTA */}
        <button
          onClick={handleLaunch}
          disabled={loading}
          style={{
            width: '100%', padding: '16px 0',
            background: loading ? '#4c2d9a' : `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
            border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
            color: C.text, fontSize: 15, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: 0.3, opacity: loading ? 0.8 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
              </svg>
              Launching…
            </>
          ) : (
            <>Launch My Store 🚀 ›</>
          )}
        </button>

        <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
          By clicking "Launch My Store", you agree to our{' '}
          <a href="#" style={{ color: C.purpleLight, textDecoration: 'none' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="#" style={{ color: C.purpleLight, textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </div>

      {/* Trust badges */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        flexWrap: 'wrap',
      }}>
        {[
          { icon: '🔒', label: 'SSL Secured' },
          { icon: '📱', label: 'Mobile Optimised' },
          { icon: '✨', label: 'AI Powered' },
        ].map(b => (
          <span key={b.label} style={{
            color: C.muted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>{b.icon}</span> {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @keyframes fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: ${C.muted}; }
        a:hover { opacity: 0.85; }
      `}</style>

      <Navbar />

      <main style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px 40px',
      }}>
        {step === 0 ? (
          <Step1 onContinue={() => setStep(1)} />
        ) : (
          <Step2 onBack={() => setStep(0)} />
        )}

        <footer style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
          <p style={{ color: C.muted, fontSize: 12 }}>© 2024 Kormerce • Premium Seller Tools</p>
        </footer>
      </main>
    </>
  );
}