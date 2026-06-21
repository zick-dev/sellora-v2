'use client';

import { useRouter } from 'next/navigation';

const C = {
  card:       '#12121a',
  cardBorder: 'rgba(255,255,255,0.08)',
  purple:     '#4F46E5',
  pink:       '#ec4899',
  text:       '#ffffff',
  subtext:    '#9ca3af',
  muted:      '#6b7280',
};

interface ProLockProps {
  title?: string;
  description?: string;
  features?: string[];
}

export default function ProLock({
  title = 'This is a Pro feature',
  description = 'Upgrade to Kormerce Pro to unlock this and more powerful tools to grow your business.',
  features = [],
}: ProLockProps) {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 520, margin: '40px auto 0', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(236,72,153,0.06))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 24, padding: '40px 28px' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #4F46E5, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>
          🔒
        </div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 10 }}>{title}</h1>
        <p style={{ color: C.subtext, fontSize: 15, lineHeight: 1.6, marginBottom: features.length ? 24 : 28, maxWidth: 380, margin: '0 auto' }}>
          {description}
        </p>

        {features.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, marginTop: 24, textAlign: 'left', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: C.purple, fontSize: 16 }}>✓</span>
                <span style={{ color: C.text, fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => router.push('/upgrade')} style={{ padding: '14px 32px', background: 'linear-gradient(90deg, #4F46E5, #ec4899)', border: 'none', borderRadius: 12, color: C.text, fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 4 }}>
          ⭐ Upgrade to Pro
        </button>
      </div>
    </div>
  );
}