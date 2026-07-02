'use client';

import Link from 'next/link';

export default function LegalPageLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <header style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>K</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Kormerce</span>
          </Link>
        </div>
      </header>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111', marginBottom: 6, letterSpacing: '-0.5px' }}>{title}</h1>
        <p style={{ color: '#999', fontSize: 13, marginBottom: 36 }}>Last updated: {updated}</p>
        <div style={{ color: '#333', fontSize: 15, lineHeight: 1.8 }}>
          {children}
        </div>
      </div>
      <style>{`
        .legal-content h2 { font-size: 18px; font-weight: 700; color: #111; margin: 32px 0 12px; }
        .legal-content p { margin: 0 0 14px; }
        .legal-content ul { margin: 0 0 14px; padding-left: 22px; }
        .legal-content li { margin-bottom: 6px; }
        .legal-content strong { color: #111; }
      `}</style>
    </div>
  );
}
