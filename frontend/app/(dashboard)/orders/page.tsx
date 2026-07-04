'use client';
import { useTheme } from '@/lib/theme';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDashboard } from '../layout';


interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_note: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_number: string | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  abandoned: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Abandoned' },
  awaiting_verification: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Awaiting Verification' },
  pending:    { color: '#4F46E5', bg: 'rgba(79,70,229,0.1)',  border: 'rgba(79,70,229,0.2)',  label: 'Pending' },
  confirmed:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  label: 'Confirmed' },
  processing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  label: 'Processing' },
  delivered:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  label: 'Delivered' },
  cancelled:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   label: 'Cancelled' },
};

const NEXT_STATUS: Record<string, string[]> = {
  awaiting_verification: ['confirmed', 'cancelled'],
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['delivered', 'cancelled'],
  delivered:  [],
  cancelled:  [],
};

const AVATAR_COLORS = [
  'linear-gradient(135deg, #4F46E5, #9d5cf5)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #10b981, #059669)',
];

export default function OrdersPage() {
  const { C } = useTheme();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const { store } = useDashboard();
  const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: 'GH₵', KES: 'KSh', ZAR: 'R', TRY: '₺' };
  const sym = CURRENCY_SYMBOLS[(store as any)?.base_currency || 'NGN'] || ((store as any)?.base_currency || 'NGN') + ' ';
  const [filter, setFilter]     = useState('all');
  const [view, setView] = useState<'orders' | 'customers'>('orders');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const storeRes = await api.get('/api/store/me');
        const ordersRes = await api.get(`/api/orders/${storeRes.data.id}`);
        setOrders(ordersRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_MESSAGES: Record<string, string> = {
    confirmed: "Hi {name}! \ud83d\udc4b Your order #{orderNum} has been confirmed and is being prepared. We'll update you again soon!",
    processing: "Hi {name}! \ud83d\udce6 Your order #{orderNum} is being packed and will be on its way shortly.",
    delivered: "Hi {name}! \u2705 Your order #{orderNum} has been delivered. Thank you for shopping with us \u2014 we'd love to hear your feedback!",
    cancelled: "Hi {name}, your order #{orderNum} has been cancelled. If you have any questions, feel free to reach out to us here.",
  };

  function notifyBuyer(order: any, status: string) {
    const template = STATUS_MESSAGES[status];
    if (!template || !order.customer_phone) return;
    const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();
    const text = template.replace('{name}', order.customer_name).replace('{orderNum}', orderNum);
    const clean = order.customer_phone.replace(/\s+/g, '').replace(/^0/, '234');
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const res = await api.put(`/api/orders/${orderId}/status`, { status });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? res.data : o)
      );
      setExpanded(null);
      if (STATUS_MESSAGES[status]) {
        notifyBuyer(res.data, status);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  }

  function openWhatsApp(phone: string, name: string) {
    const clean = phone.replace(/\s+/g, '').replace(/^0/, '234');
    const msg = encodeURIComponent(
      `Hi ${name}! 👋 Thank you for your order on our store. We're processing it now and will keep you updated. Feel free to ask if you have any questions! 😊`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  }

  const filters = ['all', 'abandoned', 'awaiting_verification', 'pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

  const ABANDONED_HOURS = 24;
  const isAbandoned = (o: any) => {
    if (o.is_demo) return false;
    if (!['pending', 'awaiting_verification'].includes(o.status)) return false;
    const age = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
    return age >= ABANDONED_HOURS;
  };
  const abandonedOrders = orders.filter(isAbandoned);

  const counts = filters.reduce((acc, f) => {
    if (f === 'all') acc[f] = orders.length;
    else if (f === 'abandoned') acc[f] = abandonedOrders.length;
    else acc[f] = orders.filter(o => o.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === 'all'
    ? orders
    : filter === 'abandoned'
    ? abandonedOrders
    : orders.filter(o => o.status === filter);

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: 300,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid rgba(79,70,229,0.2)',
        borderTopColor: C.purple,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{
            color: C.text, fontSize: 24,
            fontWeight: 800, marginBottom: 0,
          }}>
            {view === 'orders' ? 'Orders' : 'Customers'}
          </h1>
          <div style={{ display: 'flex', gap: 4, background: C.card, borderRadius: 10, padding: 3, border: '1px solid ' + C.cardBorder }}>
            <button onClick={() => setView('orders')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === 'orders' ? C.purple : 'transparent', color: view === 'orders' ? '#fff' : C.muted }}>Orders</button>
            <button onClick={() => setView('customers')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === 'customers' ? C.purple : 'transparent', color: view === 'customers' ? '#fff' : C.muted }}>Customers</button>
          </div>
        </div>
        <p style={{ color: C.muted, fontSize: 14 }}>
          {orders.length} total · {counts.pending} pending
        </p>
      </div>

      {/* Filter pills */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20,
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {filters.map(f => {
          const sc = STATUS_CONFIG[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', cursor: 'pointer',
                border: active
                  ? f === 'all'
                    ? 'none'
                    : `1px solid ${sc?.border}`
                  : `1px solid rgba(255,255,255,0.08)`,
                background: active
                  ? f === 'all'
                    ? C.purple
                    : sc?.bg
                  : 'transparent',
                color: active
                  ? f === 'all' ? C.text : sc?.color
                  : C.muted,
                transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
              {counts[f] > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 11,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 10, padding: '1px 6px',
                }}>
                  {counts[f]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {view === 'orders' && (<>
      {/* Abandoned orders alert banner */}
      {filter !== 'abandoned' && abandonedOrders.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
                {abandonedOrders.length} abandoned order{abandonedOrders.length !== 1 ? 's' : ''}
              </p>
              <p style={{ color: C.muted, fontSize: 12 }}>
                Orders stuck for 24+ hours. Follow up on WhatsApp to recover sales.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilter('abandoned')}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', cursor: 'pointer',
            }}
          >
            View & Recover →
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, padding: '60px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <h3 style={{
            color: C.text, fontSize: 18,
            fontWeight: 700, marginBottom: 8,
          }}>
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h3>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: filter === 'all' ? 16 : 0 }}>
            {filter === 'all'
              ? 'Share your store link to start receiving orders'
              : `No orders with ${filter} status`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={async () => {
                setCreatingDemo(true);
                try {
                  const storeRes = await api.get('/api/store/me');
                  const res = await api.post(`/api/orders/demo/${storeRes.data.id}`);
                  setOrders(prev => [res.data, ...prev]);
                } catch (err: any) {
                  alert(err.response?.data?.detail || 'Add a product first to preview a demo order.');
                }
                setCreatingDemo(false);
              }}
              disabled={creatingDemo}
              style={{
                padding: '10px 20px', borderRadius: 10, background: 'rgba(79,70,229,0.1)',
                border: '1px solid rgba(79,70,229,0.2)', color: C.purple, fontSize: 13,
                fontWeight: 700, cursor: creatingDemo ? 'not-allowed' : 'pointer',
              }}
            >
              {creatingDemo ? 'Creating...' : '✨ See a Demo Order'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((order, idx) => {
            const sc = STATUS_CONFIG[order.status];
            const isExpanded = expanded === order.id;
            const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const nextStatuses = NEXT_STATUS[order.status] || [];

            return (
              <div
                key={order.id}
                style={{
                  background: C.card,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: 14, overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Main row */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 12, padding: '14px 16px', cursor: 'pointer',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: avatarGradient, flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    color: C.text, fontSize: 15, fontWeight: 700,
                  }}>
                    {order.customer_name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <p style={{
                        color: C.text, fontSize: 14, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {order.customer_name}
                      </p>
                      {order.order_number && (
                        <span style={{
                          color: C.muted, fontSize: 11,
                          fontFamily: 'monospace',
                        }}>
                          #{order.order_number}
                        </span>
                      )}
                      {(order as any).is_demo && (
                        <span style={{
                          background: 'rgba(79,70,229,0.12)', color: C.purple,
                          fontSize: 10, fontWeight: 800, padding: '2px 8px',
                          borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          Demo
                        </span>
                      )}
                    </div>
                    <p style={{ color: C.muted, fontSize: 12 }}>
                      {order.customer_phone}
                    </p>
                  </div>

                  {/* Amount + status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                      color: C.text, fontSize: 14,
                      fontWeight: 700, marginBottom: 4,
                    }}>
                      {sym}{Number(order.total_price).toLocaleString()}
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 8,
                      color: sc?.color,
                      background: sc?.bg,
                      border: `1px solid ${sc?.border}`,
                    }}>
                      {sc?.label}
                    </span>
                  </div>

                  {/* Chevron */}
                  <div style={{
                    color: C.muted, fontSize: 12,
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                  }}>
                    ▼
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    borderTop: `1px solid ${C.cardBorder}`,
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {/* Customer note */}
                    {order.customer_note && (
                      <div style={{
                        background: C.input,
                        border: `1px solid rgba(255,255,255,0.08)`,
                        borderRadius: 10, padding: '10px 14px',
                        marginBottom: 12,
                      }}>
                        <p style={{
                          color: C.muted, fontSize: 11,
                          marginBottom: 4, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          Customer Note
                        </p>
                        <p style={{ color: C.subtext, fontSize: 13 }}>
                          "{order.customer_note}"
                        </p>
                      </div>
                    )}

                    {/* Order details */}
                    <div style={{
                      display: 'flex', gap: 16,
                      marginBottom: 14, fontSize: 13,
                    }}>
                      <div>
                        <span style={{ color: C.muted }}>Qty: </span>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                          {order.quantity}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: C.muted }}>Unit: </span>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                          {sym}{Number(order.unit_price).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: C.muted }}>Total: </span>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                          {sym}{Number(order.total_price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment method badge */}
                    {(order as any).payment_method === 'bank_transfer' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 10px', borderRadius: 20 }}>
                            Bank Transfer
                          </span>
                          {order.status === 'awaiting_verification' && (
                            <span style={{ fontSize: 11, color: C.muted }}>Awaiting receipt verification</span>
                          )}
                        </div>
                        {(order as any).transfer_receipt_url && (
                          <div style={{ marginBottom: 4 }}>
                            <p style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>Transfer Receipt:</p>
                            <a href={(order as any).transfer_receipt_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                              <img src={(order as any).transfer_receipt_url} alt="Transfer receipt" style={{ maxWidth: 200, maxHeight: 160, borderRadius: 10, border: '1px solid ' + C.cardBorder, objectFit: 'cover', cursor: 'pointer' }} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex', gap: 8, flexWrap: 'wrap',
                    }}>
                      {/* WhatsApp button */}
                      <button
                        onClick={() => openWhatsApp(
                          order.customer_phone,
                          order.customer_name
                        )}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 8,
                          background: 'rgba(37,211,102,0.1)',
                          border: '1px solid rgba(37,211,102,0.2)',
                          color: C.green, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        WhatsApp
                      </button>

                      {['pending','confirmed','processing'].includes(order.status) && (
                        <button
                          onClick={() => {
                            const clean = order.customer_phone.replace(/^0/, '234');
                            const msg = encodeURIComponent(
                              'Hi ' + order.customer_name + ', reminder about order #' + (order.order_number || order.id.slice(0,8).toUpperCase()) + '. Let us know when you are ready for delivery. Thank you!'
                            );
                            window.open('https://wa.me/' + clean + '?text=' + msg, '_blank');
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            color: C.amber, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remind
                        </button>
                      )}

                      {/* Status buttons */}
                      {nextStatuses.map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={updating === order.id}
                          style={{
                            padding: '8px 14px', borderRadius: 8,
                            fontSize: 13, fontWeight: 600,
                            cursor: updating === order.id
                              ? 'not-allowed' : 'pointer',
                            opacity: updating === order.id ? 0.5 : 1,
                            background: s === 'cancelled'
                              ? 'rgba(239,68,68,0.1)'
                              : 'rgba(79,70,229,0.1)',
                            border: s === 'cancelled'
                              ? '1px solid rgba(239,68,68,0.2)'
                              : '1px solid rgba(79,70,229,0.2)',
                            color: s === 'cancelled' ? C.red : C.purple,
                            textTransform: 'capitalize',
                          }}
                        >
                          {updating === order.id
                            ? '...'
                            : `Mark as ${s}`
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      </>)}

      {/* CUSTOMERS VIEW */}
      {view === 'customers' && (() => {
        const customerMap: Record<string, { name: string; phone: string; orders: number; totalSpent: number; lastOrder: string; statuses: string[] }> = {};
        orders.forEach(o => {
          if ((o as any).is_demo) return;
          const key = (o as any).customer_phone || 'unknown';
          if (!customerMap[key]) {
            customerMap[key] = { name: (o as any).customer_name || 'Unknown', phone: key, orders: 0, totalSpent: 0, lastOrder: o.created_at, statuses: [] };
          }
          customerMap[key].orders += 1;
          customerMap[key].totalSpent += Number(o.total_price);
          customerMap[key].statuses.push(o.status);
          if (new Date(o.created_at) > new Date(customerMap[key].lastOrder)) customerMap[key].lastOrder = o.created_at;
        });
        const customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
        if (customers.length === 0) return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
            <p style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>No customers yet</p>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Customers will appear here automatically when orders come in.</p>
          </div>
        );
        return (
          <div>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{customers.length} customer{customers.length !== 1 ? 's' : ''} · Auto-built from order history</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {customers.map((c, i) => {
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const delivered = c.statuses.filter(s => s === 'delivered').length;
                return (
                  <div key={c.phone} style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                        {c.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{c.name}</p>
                        <p style={{ color: C.muted, fontSize: 12 }}>{c.phone}</p>
                      </div>
                      <button
                        onClick={() => { const clean = c.phone.replace(/^0/, '234'); window.open('https://wa.me/' + clean, '_blank'); }}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25d366', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >WhatsApp</button>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>Orders</p>
                        <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{c.orders}</p>
                      </div>
                      <div>
                        <p style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>Delivered</p>
                        <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700 }}>{delivered}</p>
                      </div>
                      <div>
                        <p style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>Total Spent</p>
                        <p style={{ color: C.purple, fontSize: 14, fontWeight: 700 }}>{sym + c.totalSpent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>Last Order</p>
                        <p style={{ color: C.text, fontSize: 13 }}>{new Date(c.lastOrder).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}