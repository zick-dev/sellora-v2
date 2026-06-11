'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import Link from 'next/link';

// ─── Design tokens (duplicated so this page is self-contained) ────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type StatCard = {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ReactNode;
};

type Order = {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: 'Delivered' | 'Processing' | 'Pending' | 'Shipped';
  time: string;
};

type Lead = {
  id: string;
  name: string;
  product: string;
  time: string;
  avatar: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good day';
  return 'Good evening';
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { bg: string; color: string }> = {
    Delivered:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    Processing: { bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4' },
    Pending:    { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
    Shipped:    { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  };
  const s = map[status];
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20,
      letterSpacing: 0.3,
    }}>
      {status}
    </span>
  );
}

// ─── Placeholder data (replace with real API calls) ───────────────────────────
const PLACEHOLDER_ORDERS: Order[] = [
  { id: '#SEL-88210', customer: 'Amina Johnson',   product: 'Premium Soy Candle',  amount: '₦12,500', status: 'Delivered',  time: '15m ago' },
  { id: '#SEL-88209', customer: 'Chidi Okoro',     product: 'Minimalist Watch',    amount: '₦45,000', status: 'Processing', time: '45m ago' },
  { id: '#SEL-88208', customer: 'Sarah Williams',  product: 'Silk Scarf Set',      amount: '₦8,200',  status: 'Pending',    time: '2h ago'  },
  { id: '#SEL-88207', customer: 'Emmanuel Taiwo',  product: 'Leather Wallet',      amount: '₦15,000', status: 'Shipped',    time: '5h ago'  },
  { id: '#SEL-88206', customer: 'Fatima Musa',     product: 'Earthy Pot Set',      amount: '₦22,000', status: 'Delivered',  time: '1d ago'  },
];

const PLACEHOLDER_LEADS: Lead[] = [
  { id: '1', name: 'Kelechi A.',  product: 'Premium Soy Candle', time: '12m ago', avatar: 'K' },
  { id: '2', name: 'Grace E.',    product: 'Minimalist Watch',   time: '45m ago', avatar: 'G' },
  { id: '3', name: 'David C.',    product: 'Silk Scarf Set',     time: '2h ago',  avatar: 'D' },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ card }: { card: StatCard }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBorder}`,
      borderRadius: 14, padding: '20px 20px 16px',
      flex: '1 1 180px', minWidth: 0,
      animation: 'fadein 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${card.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: card.color,
        }}>
          {card.icon}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: card.changeType === 'up' ? C.success : card.changeType === 'down' ? '#ef4444' : C.mutedLight,
          background: card.changeType === 'up' ? 'rgba(16,185,129,0.1)' : card.changeType === 'down' ? 'rgba(239,68,68,0.1)' : C.inputBorder,
          padding: '3px 7px', borderRadius: 20,
        }}>
          {card.change}
        </span>
      </div>
      <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
        {card.label}
      </p>
      <p style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
        {card.value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardOverviewPage() {
  const { user, store } = useDashboard();
  const [orders] = useState<Order[]>(PLACEHOLDER_ORDERS);
  const [leads]  = useState<Lead[]>(PLACEHOLDER_LEADS);

  const STAT_CARDS: StatCard[] = [
    {
      label: 'Total Revenue',
      value: '₦284,500',
      change: '+12.5%',
      changeType: 'up',
      color: C.purpleLight,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: 'New Orders',
      value: '24',
      change: '+4.2%',
      changeType: 'up',
      color: C.pink,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Active Products',
      value: '12',
      change: 'Stable',
      changeType: 'stable',
      color: C.teal,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
      ),
    },
    {
      label: 'Pending Shipments',
      value: '4',
      change: '-2',
      changeType: 'down',
      color: C.orange,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 28,
        flexWrap: 'wrap', gap: 16,
        animation: 'fadein 0.3s ease',
      }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Seller'} 👋
          </h1>
          {store && (
            <p style={{ color: C.muted, fontSize: 14 }}>
              Your store is live at{' '}
              <a
                href={`/store/${store.slug}`}
                target="_blank" rel="noreferrer"
                style={{ color: C.purpleLight, textDecoration: 'none' }}
              >
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/store/{store.slug} ↗ 
              </a>
            </p>
          )}
        </div>
        <Link href={store ? `/store/${store.slug}` : '#'}
          target="_blank" rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px',
            background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
            borderRadius: 10, color: C.text,
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round"/>
            <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
          </svg>
          View Storefront
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        {STAT_CARDS.map(card => <StatCard key={card.label} card={card} />)}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Recent Orders */}
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 14, padding: '20px 0',
          animation: 'fadein 0.45s ease',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px 16px',
            borderBottom: `1px solid ${C.cardBorder}`,
          }}>
            <div>
              <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>Recent Orders</h2>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Monitor your latest store activity</p>
            </div>
            <Link href="/orders" style={{
              color: C.purpleLight, fontSize: 13, textDecoration: 'none', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              View All
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 1fr 90px 90px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.cardBorder}`,
          }}>
            {['Order ID', 'Customer', 'Product', 'Amount', 'Status'].map(h => (
              <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {orders.map((order, i) => (
            <div key={order.id} style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 1fr 90px 90px',
              padding: '14px 20px',
              borderBottom: i < orders.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
              alignItems: 'center',
            }}>
              <span style={{ color: C.purpleLight, fontSize: 13, fontWeight: 600 }}>{order.id}</span>
              <span style={{ color: C.text, fontSize: 13 }}>{order.customer}</span>
              <span style={{ color: C.subtext, fontSize: 13 }}>{order.product}</span>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{order.amount}</span>
              <StatusBadge status={order.status} />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Abandoned Interests */}
          <div style={{
            background: C.card, border: `1px solid ${C.cardBorder}`,
            borderRadius: 14, padding: '18px 18px',
            animation: 'fadein 0.5s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>Abandoned Interests</h3>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>AI detected potential customers</p>
              </div>
              <span style={{
                background: C.pink, color: 'white',
                fontSize: 10, fontWeight: 700,
                padding: '3px 8px', borderRadius: 20,
              }}>
                {leads.length} New Leads
              </span>
            </div>

            {leads.map(lead => (
              <div key={lead.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 12,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: C.purple, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{lead.avatar}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{lead.name}</p>
                  <p style={{ color: C.muted, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lead.product}
                  </p>
                </div>
                <button style={{
                  background: C.success, border: 'none', borderRadius: 8,
                  color: 'white', fontSize: 11, fontWeight: 700,
                  padding: '5px 10px', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round"/>
                  </svg>
                  Follow Up
                </button>
              </div>
            ))}

            <Link href="/leads" style={{
              display: 'block', width: '100%', padding: '10px',
              background: C.input, borderRadius: 10, textAlign: 'center',
              color: C.subtext, fontSize: 13, textDecoration: 'none',
              fontWeight: 600, marginTop: 4,
            }}>
              Recover More Leads
            </Link>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: C.card, border: `1px solid ${C.cardBorder}`,
            borderRadius: 14, padding: '18px',
            animation: 'fadein 0.55s ease',
          }}>
            <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Add Product', href: '/products', icon: '+', color: C.purple },
                { label: 'Export Reports', href: '#', icon: '↓', color: C.teal },
                { label: 'Share Store', href: '#', icon: '↗', color: C.success },
                { label: 'Settings', href: '/storefront', icon: '⚙', color: C.orange },
              ].map(a => (
                <Link key={a.label} href={a.href} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '16px 8px',
                  background: C.input, borderRadius: 10,
                  textDecoration: 'none',
                  border: `1px solid ${C.inputBorder}`,
                }}>
                  <span style={{ color: a.color, fontSize: 18 }}>{a.icon}</span>
                  <span style={{ color: C.subtext, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Seller Tip */}
          <div style={{
            background: C.card, border: `1px solid ${C.cardBorder}`,
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            animation: 'fadein 0.6s ease',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.purpleDim, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.purpleLight,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Seller Tip: AI Recovery
              </p>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                Sellers using Lead Recovery see an average 25% increase in conversions. Follow up with your leads soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}