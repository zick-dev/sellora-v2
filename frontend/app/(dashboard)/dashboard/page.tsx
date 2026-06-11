'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import Link from 'next/link';
import api from '@/lib/api';

const C = {
  bg:          '#0d0d14',
  card:        '#13131f',
  cardBorder:  '#1e1e30',
  input:       '#1a1a2e',
  inputBorder: '#2a2a3e',
  purple:      '#7c3aed',
  purpleLight: '#8b5cf6',
  purpleDim:   'rgba(124,58,237,0.12)',
  muted:       '#6b7280',
  mutedLight:  '#9ca3af',
  text:        '#ffffff',
  subtext:     '#c4c4d4',
  success:     '#10b981',
  pink:        '#ec4899',
  orange:      '#f59e0b',
  teal:        '#06b6d4',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good day';
  return 'Good evening';
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    delivered:  { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    processing: { bg: 'rgba(6,182,212,0.12)',  color: '#06b6d4' },
    pending:    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    confirmed:  { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
    cancelled:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  };
  const s = map[status] || { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20,
      letterSpacing: 0.3, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

export default function DashboardOverviewPage() {
  const { user, store } = useDashboard();

  const [orders, setOrders]     = useState<any[]>([]);
  const [leads, setLeads]       = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!store?.id) { setLoading(false); return; }
    const load = async () => {
      try {
        const [ordersRes, leadsRes, productsRes] = await Promise.all([
          api.get('/api/orders/' + store.id),
          api.get('/api/abandoned/' + store.id),
          api.get('/api/products/store/' + store.id),
        ]);
        setOrders(ordersRes.data);
        setLeads(leadsRes.data);
        setProducts(productsRes.data);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    load();
  }, [store?.id]);

  const totalRevenue   = orders.filter((o: any) => o.status !== 'cancelled').reduce((sum: number, o: any) => sum + Number(o.total_price), 0);
  const pendingCount   = orders.filter((o: any) => o.status === 'pending').length;
  const activeProducts = products.filter((p: any) => p.is_available).length;
  const newLeads       = leads.filter((l: any) => !l.follow_up_sent).length;
  const recentOrders   = orders.slice(0, 5);
  const recentLeads    = leads.filter((l: any) => !l.follow_up_sent).slice(0, 3);
  const storeUrl       = store ? '/store/' + store.slug : '#';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 28,
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Seller'} 👋
          </h1>
          {store && (
            <p style={{ color: C.muted, fontSize: 14 }}>
              Your store is live at{' '}
              <a href={storeUrl} target="_blank" rel="noreferrer"
                style={{ color: C.purpleLight, textDecoration: 'none' }}>
                localhost:3000/store/{store.slug}
              </a>
            </p>
          )}
        </div>
        <Link href={storeUrl} target="_blank" rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px',
            background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
            borderRadius: 10, color: C.text,
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}>
          View Storefront
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',   value: loading ? '—' : ('N' + totalRevenue.toLocaleString()),  sub: orders.length > 0 ? orders.length + ' orders' : 'No orders yet' },
          { label: 'Pending Orders',  value: loading ? '—' : String(pendingCount),                   sub: pendingCount > 0 ? 'Need attention' : 'All clear' },
          { label: 'Active Products', value: loading ? '—' : String(activeProducts),                 sub: products.length > 0 ? products.length + ' total' : 'No products yet' },
          { label: 'New Leads',       value: loading ? '—' : String(newLeads),                       sub: newLeads > 0 ? 'Need follow-up' : 'All followed up' },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              {card.label}
            </p>
            <p style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
              {card.value}
            </p>
            <p style={{ color: C.muted, fontSize: 12 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="dash-grid">

        {/* Recent Orders */}
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 14, padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px', borderBottom: '1px solid ' + C.cardBorder }}>
            <div>
              <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Recent Orders</h2>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Monitor your latest store activity</p>
            </div>
            <Link href="/orders" style={{ color: C.purpleLight, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
              <p style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No orders yet</p>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Share your store link to start receiving orders</p>
              <Link href={storeUrl} target="_blank" style={{ display: 'inline-block', padding: '9px 18px', borderRadius: 8, background: C.purple, color: C.text, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View Your Store
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 400 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 90px', padding: '10px 20px', borderBottom: '1px solid ' + C.cardBorder }}>
                  {['Order ID', 'Customer', 'Amount', 'Status'].map(h => (
                    <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {recentOrders.map((order: any, i: number) => (
                  <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 90px', padding: '14px 20px', borderBottom: i < recentOrders.length - 1 ? '1px solid ' + C.cardBorder : 'none', alignItems: 'center' }}>
                    <span style={{ color: C.purpleLight, fontSize: 13, fontWeight: 600 }}>
                      {'#' + (order.order_number || order.id.slice(0, 8).toUpperCase())}
                    </span>
                    <div>
                      <p style={{ color: C.text, fontSize: 13 }}>{order.customer_name}</p>
                      <p style={{ color: C.muted, fontSize: 11 }}>{timeAgo(order.created_at)}</p>
                    </div>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
                      {'N' + Number(order.total_price).toLocaleString()}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Leads */}
          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 14, padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>Abandoned Leads</h3>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>Potential customers to follow up</p>
              </div>
              {newLeads > 0 && (
                <span style={{ background: C.pink, color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                  {newLeads + ' New'}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              </div>
            ) : recentLeads.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
                <p style={{ color: C.muted, fontSize: 13 }}>No leads yet</p>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Leads appear when customers browse your store</p>
              </div>
            ) : (
              <div>
                {recentLeads.map((lead: any) => (
                  <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.purple, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
                        {lead.customer_name ? lead.customer_name[0].toUpperCase() : '?'}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{lead.customer_name || 'Anonymous'}</p>
                      <p style={{ color: C.muted, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.product_name || 'Unknown product'}</p>
                    </div>
                    {lead.customer_phone && (
                      <button
                        onClick={() => {
                          const clean = lead.customer_phone.replace(/\s+/g, '').replace(/^0/, '234');
                          const msg = encodeURIComponent('Hi! We noticed you were interested in ' + (lead.product_name || 'our product') + '. Still available!');
                          window.open('https://wa.me/' + clean + '?text=' + msg, '_blank');
                        }}
                        style={{ background: C.success, border: 'none', borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 700, padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>
                        Follow Up
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Link href="/leads" style={{ display: 'block', width: '100%', padding: '10px', background: C.input, borderRadius: 10, textAlign: 'center', color: C.subtext, fontSize: 13, textDecoration: 'none', fontWeight: 600, marginTop: 4 }}>
              View All Leads
            </Link>
          </div>

          {/* Quick Actions */}
          <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 14, padding: '18px' }}>
            <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Add Product', href: '/products',  color: C.purple  },
                { label: 'View Orders', href: '/orders',    color: C.teal    },
                { label: 'Share Store', href: storeUrl,     color: C.success },
                { label: 'Settings',   href: '/storefront', color: C.orange  },
              ].map(a => (
                <Link key={a.label} href={a.href} target={a.label === 'Share Store' ? '_blank' : undefined}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 8px', background: C.input, borderRadius: 10, textDecoration: 'none', border: '1px solid ' + C.inputBorder }}>
                  <span style={{ color: a.color, fontSize: 13, fontWeight: 700 }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Getting started tip */}
          {!loading && orders.length === 0 && (
            <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.purpleDim, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purpleLight, fontSize: 16 }}>
                💡
              </div>
              <div>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Getting Started</p>
                <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                  Add products to your store, then share your store link on WhatsApp and Instagram to start receiving orders!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card {
          background: #13131f;
          border: 1px solid #1e1e30;
          border-radius: 14px;
          padding: 20px 20px 16px;
          flex: 1 1 140px;
          min-width: 0;
        }
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .dash-grid {
            grid-template-columns: 1fr;
          }
          .stat-card {
            flex: 1 1 calc(50% - 7px);
          }
        }
        @media (max-width: 480px) {
          .stat-card {
            flex: 1 1 100%;
          }
        }
      `}</style>
    </div>
  );
}
