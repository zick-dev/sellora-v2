'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

const C = {
  bg:         '#0a0a0f',
  card:       '#12121a',
  cardBorder: 'rgba(255,255,255,0.08)',
  input:      '#1a1a2e',
  purple:     '#7c3aed',
  pink:       '#ec4899',
  green:      '#25d366',
  success:    '#10b981',
  amber:      '#f59e0b',
  red:        '#ef4444',
  muted:      '#6b7280',
  subtext:    '#9ca3af',
  text:       '#ffffff',
};

interface Lead {
  id: string;
  product_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  is_converted: boolean;
  follow_up_sent: boolean;
  created_at: string;
  product_name: string | null;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c3aed, #9d5cf5)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #10b981, #059669)',
];

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'all' | 'new' | 'followed'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const storeRes = await api.get('/api/store/me');
        const leadsRes = await api.get(`/api/abandoned/${storeRes.data.id}`);
        setLeads(leadsRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  async function markFollowUp(id: string) {
    setUpdating(id);
    try {
      const res = await api.put(`/api/abandoned/${id}/follow-up`);
      setLeads(prev =>
        prev.map(l => l.id === id ? { ...l, follow_up_sent: true } : l)
      );
    } catch {
      alert('Failed to update lead.');
    } finally {
      setUpdating(null);
    }
  }

  function openWhatsApp(phone: string, productName: string) {
    const clean = phone.replace(/\s+/g, '').replace(/^0/, '234');
    const msg = encodeURIComponent(
      `Hi! 👋 We noticed you were interested in *${productName}* on our store. It's still available! Would you like to place an order? 😊`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  }

  function timeAgo(dateString: string): string {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / 1000
    );
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  const filtered = leads.filter(l => {
    if (filter === 'new') return !l.follow_up_sent;
    if (filter === 'followed') return l.follow_up_sent;
    return true;
  });

  const newCount      = leads.filter(l => !l.follow_up_sent).length;
  const followedCount = leads.filter(l => l.follow_up_sent).length;

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: 300,
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid rgba(124,58,237,0.2)',
        borderTopColor: C.purple,
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          color: C.text, fontSize: 24,
          fontWeight: 800, marginBottom: 4,
        }}>
          Lead Recovery
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>
          {leads.length} potential customers who showed interest
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 20,
      }}>
        {[
          {
            label: 'Total Leads',
            value: leads.length,
            color: C.purple,
            bg: 'rgba(124,58,237,0.1)',
            border: 'rgba(124,58,237,0.2)',
          },
          {
            label: 'Need Follow-up',
            value: newCount,
            color: C.amber,
            bg: 'rgba(245,158,11,0.1)',
            border: 'rgba(245,158,11,0.2)',
          },
          {
            label: 'Followed Up',
            value: followedCount,
            color: C.success,
            bg: 'rgba(16,185,129,0.1)',
            border: 'rgba(16,185,129,0.2)',
          },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: 12, padding: '14px',
              textAlign: 'center',
            }}
          >
            <p style={{
              color: stat.color, fontSize: 24,
              fontWeight: 800, marginBottom: 2,
            }}>
              {stat.value}
            </p>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: `All (${leads.length})` },
          { key: 'new', label: `New (${newCount})` },
          { key: 'followed', label: `Followed (${followedCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              border: filter === f.key
                ? 'none' : `1px solid ${C.cardBorder}`,
              background: filter === f.key
                ? C.purple : 'transparent',
              color: filter === f.key ? C.text : C.muted,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, padding: '60px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <h3 style={{
            color: C.text, fontSize: 18,
            fontWeight: 700, marginBottom: 8,
          }}>
            {filter === 'all' ? 'No leads yet' : `No ${filter} leads`}
          </h3>
          <p style={{ color: C.muted, fontSize: 14, maxWidth: 300, margin: '0 auto' }}>
            {filter === 'all'
              ? 'When customers browse your store and show interest in products, they\'ll appear here'
              : `No leads in this category`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((lead, idx) => (
            <div
              key={lead.id}
              style={{
                background: C.card,
                border: `1px solid ${lead.follow_up_sent
                  ? C.cardBorder
                  : 'rgba(245,158,11,0.2)'}`,
                borderRadius: 14, padding: '16px',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                gap: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  color: C.text, fontSize: 16, fontWeight: 700,
                }}>
                  {lead.customer_name
                    ? lead.customer_name[0].toUpperCase()
                    : '?'
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 2,
                  }}>
                    <p style={{
                      color: C.text, fontSize: 14, fontWeight: 600,
                    }}>
                      {lead.customer_name || 'Anonymous visitor'}
                    </p>
                    <span style={{
                      color: C.muted, fontSize: 11,
                    }}>
                      {timeAgo(lead.created_at)}
                    </span>
                  </div>

                  {lead.customer_phone && (
                    <p style={{
                      color: C.muted, fontSize: 12, marginBottom: 4,
                    }}>
                      {lead.customer_phone}
                    </p>
                  )}

                  {/* Product badge */}
                  {lead.product_name && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.15)',
                      borderRadius: 6, padding: '3px 8px',
                      marginBottom: 10,
                    }}>
                      <span style={{ fontSize: 10 }}>🛍️</span>
                      <span style={{
                        color: C.purple, fontSize: 11, fontWeight: 600,
                      }}>
                        {lead.product_name}
                      </span>
                    </div>
                  )}

                  {/* Status + actions */}
                  <div style={{
                    display: 'flex', gap: 8,
                    alignItems: 'center', flexWrap: 'wrap',
                  }}>
                    {lead.follow_up_sent ? (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 6, padding: '4px 10px',
                        color: C.success, fontSize: 11, fontWeight: 600,
                      }}>
                        ✓ Follow-up sent
                      </span>
                    ) : (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 6, padding: '4px 10px',
                        color: C.amber, fontSize: 11, fontWeight: 600,
                      }}>
                        ● Needs follow-up
                      </span>
                    )}

                    {/* WhatsApp button */}
                    {lead.customer_phone && (
                      <button
                        onClick={() => openWhatsApp(
                          lead.customer_phone!,
                          lead.product_name || 'our product'
                        )}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 6,
                          background: 'rgba(37,211,102,0.1)',
                          border: '1px solid rgba(37,211,102,0.2)',
                          color: C.green, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        WhatsApp
                      </button>
                    )}

                    {/* Mark follow-up */}
                    {!lead.follow_up_sent && (
                      <button
                        onClick={() => markFollowUp(lead.id)}
                        disabled={updating === lead.id}
                        style={{
                          padding: '5px 12px', borderRadius: 6,
                          background: 'rgba(124,58,237,0.1)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          color: C.purple, fontSize: 12, fontWeight: 600,
                          cursor: updating === lead.id
                            ? 'not-allowed' : 'pointer',
                          opacity: updating === lead.id ? 0.5 : 1,
                        }}
                      >
                        {updating === lead.id ? '...' : 'Mark Followed Up'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips banner */}
      {leads.length > 0 && newCount > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.05)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 12, padding: '14px 16px',
          marginTop: 20, display: 'flex',
          alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
            <span style={{ color: C.text, fontWeight: 600 }}>
              Pro tip:
            </span>{' '}
            Customers who showed interest but didn&#39;t order are
            {' '}{newCount}x more likely to buy when followed up within
            24 hours. Use the WhatsApp button to reach out now!
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}