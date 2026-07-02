'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface Props {
  storeId: string;
  storeName: string;
  accentColor: string;
  products: { name: string; price: number; category: string | null; description: string | null; stock: number; is_available: boolean }[];
  deliveryFee?: number;
  freeDeliveryAbove?: number;
  whatsapp?: string | null;
  currencySymbol: string;
}

export default function StorefrontChat({ storeId, storeName, accentColor, products, deliveryFee, freeDeliveryAbove, whatsapp, currencySymbol }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/ai/storefront-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          store_id: storeId,
          store_name: storeName,
          products: products.slice(0, 20).map(p => ({
            name: p.name,
            price: p.price,
            category: p.category,
            description: p.description,
            in_stock: p.stock > 0 && p.is_available,
          })),
          delivery_fee: deliveryFee,
          free_delivery_above: freeDeliveryAbove,
          currency: currencySymbol,
          whatsapp: whatsapp,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that. Please try again or contact us on WhatsApp." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }

  const accent = accentColor || '#4F46E5';

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 80, right: 20, zIndex: 300,
            width: 50, height: 50, borderRadius: '50%',
            background: accent, border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 0, right: 0, zIndex: 300,
          width: '100%', maxWidth: 400,
          height: '70vh', maxHeight: 520,
          background: '#fff', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
              }}>
                {storeName[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ color: '#111', fontSize: 14, fontWeight: 700 }}>{storeName}</p>
                <p style={{ color: '#999', fontSize: 11 }}>Ask me anything about our products</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              width: 28, height: 28, borderRadius: '50%', background: '#f5f5f5',
              border: 'none', cursor: 'pointer', color: '#666', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>👋</p>
                <p style={{ color: '#111', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Welcome to {storeName}!</p>
                <p style={{ color: '#999', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
                  Ask about products, sizes, pricing, or delivery. I'll reply instantly.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'What products do you have?',
                    'How much is delivery?',
                    'Do you have this in other sizes?',
                    'What are your best sellers?',
                  ].map(q => (
                    <button key={q} onClick={() => setInput(q)} style={{
                      padding: '8px 12px', borderRadius: 10, fontSize: 12, color: accent,
                      background: accent + '10', border: '1px solid ' + accent + '20',
                      cursor: 'pointer', textAlign: 'left',
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: msg.role === 'user' ? accent : '#f5f5f5',
                  color: msg.role === 'user' ? '#fff' : '#111',
                  fontSize: 13, lineHeight: 1.5,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: msg.role === 'ai' ? 4 : 14,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 14, background: '#f5f5f5', fontSize: 13, color: '#999' }}>
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  <span className="chat-dot" style={{ animationDelay: '0s' }}>●</span>
                  <span className="chat-dot" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="chat-dot" style={{ animationDelay: '0.4s' }}>●</span>
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about products, sizes, delivery..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1px solid #e5e5e5', background: '#fff',
                  color: '#111', fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: !input.trim() || loading ? '#e5e5e5' : accent,
                  border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>

          <style>{`.chat-dot { animation: chatPulse 1s infinite; } @keyframes chatPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
        </div>
      )}
    </>
  );
}
