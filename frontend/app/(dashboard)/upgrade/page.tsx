'use client';
import { useTheme } from '@/lib/theme';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import api from '@/lib/api';
import { detectProPricing, ProPricing } from '@/lib/proPricing';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';


interface SubStatus {
  plan: string;
  is_pro: boolean;
  expires_at: string | null;
  days_left: number;
}

export default function UpgradePage() {
  const { C } = useTheme();
  const { user } = useDashboard();
  const [status, setStatus]   = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const [pricing, setPricing] = useState<ProPricing>({ amount: 15, currency: 'USD', display: '$15/month', region: 'global' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/subscription/status');
        setStatus(res.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
    detectProPricing().then(setPricing);
  }, []);

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref:     'kormerce-pro-' + Date.now(),
    amount:     pricing.amount,
    currency:   pricing.currency,
    payment_options: 'card,ussd,banktransfer',
    customer: {
      email:        user?.email || '',
      name:         user?.name || '',
      phone_number: '',
    },
    customizations: {
      title:       'Kormerce Pro',
      description: 'Monthly subscription — unlimited products, AI tools & more',
      logo:        'https://kormerce.io/logo.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  async function handlePayment() {
    setError('');
    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === 'successful' || response.status === 'completed') {
          setVerifying(true);
          try {
            await api.post('/api/subscription/verify', {
              transaction_id: response.transaction_id,
              tx_ref:         response.tx_ref,
            });
            setSuccess(true);
            const res = await api.get('/api/subscription/status');
            setStatus(res.data);
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Payment verification failed. Contact support.');
          } finally {
            setVerifying(false);
          }
        }
      },
      onClose: () => {},
    });
  }

  const FREE_FEATURES = [
    '1 store',
    'Up to 15 products',
    'Basic orders management',
    'Public storefront',
    'WhatsApp and Instagram contact',
    'Banner, logo and custom theme',
    'Category management',
  ];

  const PRO_FEATURES = [
    'Everything in Free',
    'Unlimited products',
    'AI Reply Suggester',
    'AI FAQ Generator',
    'AI Promo Writer',
    'Lead Recovery',
    'Advanced Analytics',
    'Priority support',
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(79,70,229,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 20, padding: '6px 16px', marginBottom: 16 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ color: C.purple, fontSize: 13, fontWeight: 600 }}>Kormerce Pro</span>
        </div>
        <h1 style={{ color: C.text, fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Supercharge Your Store
        </h1>
        <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
          Unlock AI tools, unlimited products and advanced analytics to grow your business faster.
        </p>
      </div>

      {/* Current plan banner */}
      {status?.is_pro && (
        <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(236,72,153,0.08))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⭐</div>
            <div>
              <p style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Kormerce Pro — Active</p>
              <p style={{ color: C.muted, fontSize: 13 }}>{status.days_left} days remaining</p>
            </div>
          </div>
          <button onClick={handlePayment} style={{ padding: '10px 20px', borderRadius: 10, background: C.purple, border: 'none', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Extend Subscription
          </button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <p style={{ color: C.success, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Welcome to Kormerce Pro!</p>
          <p style={{ color: C.muted, fontSize: 14 }}>All Pro features are now unlocked. Enjoy!</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>

        {/* Free plan */}
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 20, padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Free</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ color: C.text, fontSize: 36, fontWeight: 800 }}>$0</span>
              <span style={{ color: C.muted, fontSize: 14 }}>/month</span>
            </div>
            <p style={{ color: C.muted, fontSize: 13 }}>Perfect to get started</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.success, fontSize: 14 }}>✓</span>
                <span style={{ color: C.subtext, fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', padding: '12px 0', background: 'rgba(255,255,255,0.05)', borderRadius: 10, textAlign: 'center', color: C.muted, fontSize: 14, fontWeight: 600 }}>
            {status?.is_pro ? 'Previous Plan' : 'Current Plan'}
          </div>
        </div>

        {/* Pro plan */}
        <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(236,72,153,0.06))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
          {/* Popular badge */}
          <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(90deg, #4F46E5, #ec4899)', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: C.text }}>
            POPULAR
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: C.purple, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pro</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ color: C.text, fontSize: 36, fontWeight: 800 }}>{pricing.currency === 'NGN' ? '₦' + pricing.amount.toLocaleString() : '$' + pricing.amount}</span>
              <span style={{ color: C.muted, fontSize: 14 }}>/month</span>
            </div>
            <p style={{ color: C.muted, fontSize: 13 }}>For serious sellers</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.purple, fontSize: 14 }}>✓</span>
                <span style={{ color: f === 'Everything in Free' ? C.muted : C.text, fontSize: 13, fontWeight: f === 'Everything in Free' ? 400 : 500 }}>{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handlePayment}
            disabled={verifying}
            style={{ width: '100%', padding: '14px 0', background: verifying ? 'rgba(79,70,229,0.4)' : 'linear-gradient(90deg, #4F46E5, #ec4899)', border: 'none', borderRadius: 10, color: C.text, fontSize: 15, fontWeight: 800, cursor: verifying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {verifying ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Verifying payment...
              </span>
            ) : status?.is_pro ? (
              `⭐ Extend Pro — ${pricing.currency === 'NGN' ? '₦' + pricing.amount.toLocaleString() : '$' + pricing.amount}`
            ) : (
              `⭐ Upgrade to Pro — ${pricing.currency === 'NGN' ? '₦' + pricing.amount.toLocaleString() : '$' + pricing.amount}`
            )}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
        <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { q: 'How do I pay?', a: 'We accept card payments, USSD, and bank transfer via Flutterwave — Nigeria\'s most trusted payment platform.' },
            { q: 'Can I cancel anytime?', a: 'Yes. Your Pro access continues until the end of your billing period. No automatic renewal.' },
            { q: 'What happens when my plan expires?', a: 'You\'ll be downgraded to the Free plan. Your data and store remain safe — you just lose access to Pro features.' },
            { q: 'Is my payment secure?', a: 'Yes. All payments are processed by Flutterwave and are fully encrypted. We never store your card details.' },
          ].map(item => (
            <div key={item.q} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{item.q}</p>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
