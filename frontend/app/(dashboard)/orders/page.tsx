'use client';
import { useTheme } from '@/lib/theme';

import { useEffect, useState } from 'react';
import api from '@/lib/api';


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
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const res = await api.put(`/api/orders/${orderId}/status`, { status });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? res.data : o)
      );
      setExpanded(null);
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

  const filters = ['all', 'awaiting_verification', 'pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

  const counts = filters.reduce((acc, f) => {
    acc[f] = f === 'all'
      ? orders.length
      : orders.filter(o => o.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === 'all'
    ? orders
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
        <h1 style={{
          color: C.text, fontSize: 24,
          fontWeight: 800, marginBottom: 4,
        }}>
          Orders
        </h1>
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
          <p style={{ color: C.muted, fontSize: 14 }}>
            {filter === 'all'
              ? 'Share your store link to start receiving orders'
              : `No orders with ${filter} status`
            }
          </p>
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
                      ₦{Number(order.total_price).toLocaleString()}
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
                          ₦{Number(order.unit_price).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: C.muted }}>Total: </span>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                          ₦{Number(order.total_price).toLocaleString()}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}