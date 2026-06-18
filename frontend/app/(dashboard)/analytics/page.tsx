'use client';
import { useTheme } from '@/lib/theme';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import api from '@/lib/api';
import Link from 'next/link';


interface Order {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  customer_name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_available: boolean;
  category: string | null;
}

export default function AnalyticsPage() {
  const { C } = useTheme();
  const { store } = useDashboard();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    if (!store?.id) { setLoading(false); return; }
    const load = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/api/orders/' + store.id),
          api.get('/api/products/store/' + store.id),
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [store?.id]);

  // Filter orders by period
  const filteredOrders = orders.filter(o => {
    const days = parseInt(period);
    const orderDate = new Date(o.created_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orderDate >= cutoff;
  });

  const completedOrders = filteredOrders.filter(o => o.status !== 'cancelled');
  const totalRevenue    = completedOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const avgOrderValue   = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
  const conversionRate  = filteredOrders.length > 0
    ? Math.round((completedOrders.length / filteredOrders.length) * 100)
    : 0;

  // Orders by status
  const statusCounts = {
    pending:    filteredOrders.filter(o => o.status === 'pending').length,
    confirmed:  filteredOrders.filter(o => o.status === 'confirmed').length,
    processing: filteredOrders.filter(o => o.status === 'processing').length,
    delivered:  filteredOrders.filter(o => o.status === 'delivered').length,
    cancelled:  filteredOrders.filter(o => o.status === 'cancelled').length,
  };

  // Daily revenue for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      return orderDate === dateStr && o.status !== 'cancelled';
    });
    const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    return {
      day: date.toLocaleDateString('en-NG', { weekday: 'short' }),
      revenue,
      orders: dayOrders.length,
    };
  });

  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);

  // Top products by category
  const categoryCount: Record<string, number> = {};
  products.forEach(p => {
    const cat = p.category || 'Uncategorized';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Track your store performance</p>
        </div>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, background: C.card, borderRadius: 10, padding: 4, border: '1px solid ' + C.cardBorder }}>
          {[
            { key: '7',  label: '7 days'  },
            { key: '30', label: '30 days' },
            { key: '90', label: '90 days' },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key as any)} style={{
              padding: '6px 14px', borderRadius: 7, border: 'none',
              background: period === p.key ? C.purple : 'transparent',
              color: period === p.key ? C.text : C.muted,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',    value: 'N' + totalRevenue.toLocaleString(),          color: C.purple, sub: completedOrders.length + ' orders' },
          { label: 'Avg Order Value',  value: 'N' + Math.round(avgOrderValue).toLocaleString(), color: C.teal,   sub: 'per order' },
          { label: 'Total Orders',     value: String(filteredOrders.length),                  color: C.blue,   sub: cancelledOrders + ' cancelled' },
          { label: 'Conversion Rate',  value: conversionRate + '%',                           color: C.success, sub: 'completed vs total' },
          { label: 'Active Products',  value: String(products.filter(p => p.is_available).length), color: C.amber, sub: products.length + ' total' },
        ].map(card => (
          <div key={card.label} style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 14, padding: '18px 16px' }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{card.label}</p>
            <p style={{ color: card.color, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{card.value}</p>
            <p style={{ color: C.muted, fontSize: 11 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Revenue — Last 7 Days</h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Daily revenue from completed orders</p>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <p style={{ color: C.muted, fontSize: 14 }}>No data yet</p>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Revenue chart will appear once you receive orders</p>
          </div>
        ) : (
          <div>
            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, marginBottom: 8 }}>
              {last7Days.map((day, i) => {
                const height = maxRevenue > 0 ? Math.max((day.revenue / maxRevenue) * 120, 4) : 4;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {day.revenue > 0 && (
                      <p style={{ color: C.purple, fontSize: 9, fontWeight: 700 }}>
                        {'N' + (day.revenue >= 1000 ? Math.round(day.revenue / 1000) + 'k' : day.revenue)}
                      </p>
                    )}
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      height: height,
                      background: day.revenue > 0
                        ? 'linear-gradient(180deg, #7c3aed, #9d5cf5)'
                        : 'rgba(255,255,255,0.05)',
                      transition: 'height 0.3s ease',
                    }} />
                  </div>
                );
              })}
            </div>
            {/* Day labels */}
            <div style={{ display: 'flex', gap: 8 }}>
              {last7Days.map((day, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ color: C.muted, fontSize: 11 }}>{day.day}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Order status breakdown */}
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Order Status</h2>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: C.muted, fontSize: 13 }}>No orders in this period</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'pending',    label: 'Pending',    color: C.purple },
                { key: 'confirmed',  label: 'Confirmed',  color: C.blue   },
                { key: 'processing', label: 'Processing', color: C.amber  },
                { key: 'delivered',  label: 'Delivered',  color: C.success},
                { key: 'cancelled',  label: 'Cancelled',  color: C.red    },
              ].map(s => {
                const count = statusCounts[s.key as keyof typeof statusCounts];
                const pct = filteredOrders.length > 0 ? Math.round((count / filteredOrders.length) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: C.subtext, fontSize: 13 }}>{s.label}</span>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: s.color, width: pct + '%', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories */}
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Products by Category</h2>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: C.muted, fontSize: 13 }}>No products yet</p>
              <Link href="/products" style={{ color: C.purple, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Add products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCategories.map(([cat, count], i) => {
                const pct = Math.round((count / products.length) * 100);
                const colors = [C.purple, C.pink, C.teal, C.amber, C.blue];
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: C.subtext, fontSize: 13 }}>{cat}</span>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{count} products</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: colors[i % colors.length], width: pct + '%', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
