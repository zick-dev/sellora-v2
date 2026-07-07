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
  products: { id: string; name: string; price: number; category: string | null; description: string | null; stock: number; is_available: boolean }[];
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
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
          store_id: storeId,
          store_name: storeName,
          products: (() => {
            // Category-lock: if the buyer's message references a category the
            // store actually sells (e.g. "tv" matching category "Tvs"), include
            // EVERY product in that category -- not subject to relevance
            // scoring or the slice cap. This makes it structurally impossible
            // for the AI to miss/deny an entire product category, which prompt
            // wording alone could not reliably guarantee.
            const lowerMsg = userMsg.toLowerCase();
            const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

            // Intent/synonym expansion: buyers often describe a need rather
            // than naming a category outright (e.g. "keep my room cool"
            // instead of "fan" or "air conditioner"). Map common intent
            // phrases to the category substrings they should match.
            const INTENT_SYNONYMS: Record<string, string[]> = {
              cool: ['fan', 'air condition', 'ac'], cooling: ['fan', 'air condition'],
              hot: ['fan', 'air condition'], heat: ['fan', 'air condition'],
              temperature: ['fan', 'air condition'], climate: ['air condition'],
              breeze: ['fan'], ventilat: ['fan'],
              watch: ['tv'], movie: ['tv'], movies: ['tv'], entertainment: ['tv'],
              stream: ['tv'], screen: ['tv', 'laptop'],
              internet: ['router', 'wifi'], wifi: ['router'], network: ['router'], connection: ['router'],
              work: ['laptop'], study: ['laptop'], computer: ['laptop'],
              clean: ['vacuum'], vacuum: ['vacuum'],
              music: ['speaker'], sound: ['speaker'], audio: ['speaker'],
              call: ['phone accessor'], charge: ['charger'], charging: ['charger'],
            };
            const expandedTerms: string[] = [lowerMsg];
            Object.entries(INTENT_SYNONYMS).forEach(([trigger, targets]) => {
              if (lowerMsg.includes(trigger)) expandedTerms.push(...targets);
            });

            const matchedCategories = allCategories.filter(cat => {
              const catLower = cat.toLowerCase();
              const catSingular = catLower.endsWith('s') ? catLower.slice(0, -1) : catLower;
              return expandedTerms.some(term =>
                lowerMsg.includes(catLower) ||
                (catSingular.length > 2 && lowerMsg.includes(catSingular)) ||
                catLower.includes(term) || term.includes(catLower)
              );
            });
            // Also match directly on product names, since a store's
            // category naming may not match the synonym target (e.g. fans
            // filed under "Home Electronics" rather than a "Fans" category).
            const nameMatchTerms = expandedTerms.filter(t => t !== lowerMsg);
            const categoryLocked = products.filter(p => {
              const inMatchedCategory = p.category && matchedCategories.includes(p.category);
              const nameMatches = nameMatchTerms.some(t => p.name.toLowerCase().includes(t));
              return inMatchedCategory || nameMatches;
            });

            // Prioritize products relevant to the buyer's message so large
            // catalogs (60+ products) don't silently hide items past a
            // blind slice. Falls back to the first 20 if nothing matches.
            const msgWords = lowerMsg.split(/\s+/).filter((w: string) => w.length >= 2);
            const scored = products.map(p => {
              const haystack = (p.name + ' ' + (p.category || '')).toLowerCase();
              const score = msgWords.filter((w: string) => haystack.includes(w)).length;
              return { p, score };
            });
            const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.p);
            const rest = scored.filter(s => s.score === 0).map(s => s.p);
            const relevanceRanked = [...matched, ...rest];

            // Category-locked products go first and are never cut, then fill
            // remaining slots with relevance-ranked products (deduplicated).
            const lockedIds = new Set(categoryLocked.map(p => p.id));
            const fillerSlots = Math.max(25 - categoryLocked.length, 5);
            const filler = relevanceRanked.filter(p => !lockedIds.has(p.id)).slice(0, fillerSlots);
            return [...categoryLocked, ...filler];
          })().map(p => ({
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
