'use client';

import { useState } from 'react';

const C = {
  bg:         '#0a0a0f',
  card:       '#12121a',
  cardBorder: 'rgba(255,255,255,0.08)',
  input:      '#1a1a2e',
  inputBorder:'rgba(255,255,255,0.1)',
  inputFocus: '#7c3aed',
  purple:     '#7c3aed',
  pink:       '#ec4899',
  success:    '#10b981',
  amber:      '#f59e0b',
  muted:      '#6b7280',
  subtext:    '#9ca3af',
  text:       '#ffffff',
};

type Tool = 'reply' | 'faq' | 'promo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>('reply');

  // Reply suggester state
  const [customerMsg, setCustomerMsg]     = useState('');
  const [replyTone, setReplyTone]         = useState('friendly');
  const [replyResult, setReplyResult]     = useState('');
  const [replyLoading, setReplyLoading]   = useState(false);

  // FAQ generator state
  const [storeDesc, setStoreDesc]         = useState('');
  const [faqResult, setFaqResult]         = useState('');
  const [faqLoading, setFaqLoading]       = useState(false);

  // Promo message state
  const [productName, setProductName]     = useState('');
  const [productPrice, setProductPrice]   = useState('');
  const [promoResult, setPromoResult]     = useState('');
  const [promoLoading, setPromoLoading]   = useState(false);

  const [copied, setCopied] = useState('');

  async function callClaude(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || 'No response generated.';
  }

  async function generateReply() {
    if (!customerMsg.trim()) return;
    setReplyLoading(true);
    setReplyResult('');
    try {
      const result = await callClaude(
        `You are a helpful WhatsApp seller assistant in Nigeria. 
A customer sent this message: "${customerMsg}"
Write a ${replyTone} reply in 2-3 sentences. 
Be concise, professional, and use Nigerian context where appropriate.
Only output the reply message, nothing else.`
      );
      setReplyResult(result);
    } catch {
      setReplyResult('Failed to generate reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  }

  async function generateFAQ() {
    if (!storeDesc.trim()) return;
    setFaqLoading(true);
    setFaqResult('');
    try {
      const result = await callClaude(
        `You are a helpful assistant for Nigerian WhatsApp/Instagram sellers.
Based on this store description: "${storeDesc}"
Generate 5 frequently asked questions with answers that this store would typically receive from customers.
Format as:
Q: [question]
A: [answer]

Keep answers concise and relevant to Nigerian e-commerce context.`
      );
      setFaqResult(result);
    } catch {
      setFaqResult('Failed to generate FAQ. Please try again.');
    } finally {
      setFaqLoading(false);
    }
  }

  async function generatePromo() {
    if (!productName.trim()) return;
    setPromoLoading(true);
    setPromoResult('');
    try {
      const result = await callClaude(
        `You are a marketing copywriter for Nigerian WhatsApp/Instagram sellers.
Write a compelling promotional message for:
Product: ${productName}
${productPrice ? `Price: ₦${productPrice}` : ''}

Write a short, engaging WhatsApp/Instagram caption that:
- Grabs attention immediately
- Highlights the value
- Creates urgency
- Ends with a clear call to action
- Uses relevant emojis
- Is suitable for Nigerian market

Only output the promotional message, nothing else.`
      );
      setPromoResult(result);
    } catch {
      setPromoResult('Failed to generate promo. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  const tools = [
    {
      id: 'reply' as Tool,
      icon: '💬',
      label: 'Reply Suggester',
      desc: 'Generate smart replies to customer messages',
    },
    {
      id: 'faq' as Tool,
      icon: '❓',
      label: 'FAQ Generator',
      desc: 'Create FAQs for your store',
    },
    {
      id: 'promo' as Tool,
      icon: '📣',
      label: 'Promo Writer',
      desc: 'Write promotional messages for products',
    },
  ];

  const inputStyle = {
    width: '100%', background: C.input,
    border: `1.5px solid ${C.inputBorder}`,
    borderRadius: 10, padding: '12px 14px',
    color: C.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: C.subtext, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 8,
  };

  function ResultBox({
    result, loading, copyKey
  }: {
    result: string;
    loading: boolean;
    copyKey: string;
  }) {
    if (loading) return (
      <div style={{
        background: C.input, border: `1px solid ${C.inputBorder}`,
        borderRadius: 12, padding: '20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '2px solid rgba(124,58,237,0.3)',
          borderTopColor: C.purple,
          animation: 'spin 0.8s linear infinite',
          display: 'inline-block', flexShrink: 0,
        }} />
        <span style={{ color: C.muted, fontSize: 14 }}>
          Claude is thinking...
        </span>
      </div>
    );

    if (!result) return null;

    return (
      <div style={{
        background: 'rgba(124,58,237,0.05)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 12, padding: '16px',
        position: 'relative',
      }}>
        <p style={{
          color: C.text, fontSize: 14, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', marginBottom: 12,
        }}>
          {result}
        </p>
        <button
          onClick={() => copyText(result, copyKey)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: copied === copyKey
              ? 'rgba(16,185,129,0.1)'
              : 'rgba(124,58,237,0.1)',
            border: copied === copyKey
              ? '1px solid rgba(16,185,129,0.2)'
              : '1px solid rgba(124,58,237,0.2)',
            color: copied === copyKey ? C.success : C.purple,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {copied === copyKey ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 80px', maxWidth: 640 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800 }}>
            AI Tools
          </h1>
          <span style={{
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            borderRadius: 6, padding: '2px 8px',
            fontSize: 11, fontWeight: 700, color: C.text,
          }}>
            POWERED BY CLAUDE
          </span>
        </div>
        <p style={{ color: C.muted, fontSize: 14 }}>
          Save time with AI-powered tools built for African sellers
        </p>
      </div>

      {/* Tool selector */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 24,
      }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              padding: '14px 10px', borderRadius: 14,
              border: activeTool === tool.id
                ? '2px solid rgba(124,58,237,0.5)'
                : `1px solid ${C.cardBorder}`,
              background: activeTool === tool.id
                ? 'rgba(124,58,237,0.08)' : C.card,
              cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{tool.icon}</div>
            <p style={{
              color: activeTool === tool.id ? C.text : C.subtext,
              fontSize: 12, fontWeight: 700, marginBottom: 2,
            }}>
              {tool.label}
            </p>
            <p style={{
              color: C.muted, fontSize: 10, lineHeight: 1.4,
            }}>
              {tool.desc}
            </p>
          </button>
        ))}
      </div>

      {/* ── Reply Suggester ─────────────────────────────────────── */}
      {activeTool === 'reply' && (
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{
            color: C.text, fontSize: 16,
            fontWeight: 700, marginBottom: 4,
          }}>
            💬 Reply Suggester
          </h2>
          <p style={{
            color: C.muted, fontSize: 13,
            marginBottom: 20, lineHeight: 1.5,
          }}>
            Paste a customer message and get a smart reply instantly
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Customer Message</label>
              <textarea
                value={customerMsg}
                onChange={e => setCustomerMsg(e.target.value)}
                placeholder="e.g. Hello, is this item still available? Can you do delivery to Abuja?"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Reply Tone</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['friendly', 'professional', 'urgent', 'casual'].map(tone => (
                  <button
                    key={tone}
                    onClick={() => setReplyTone(tone)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: replyTone === tone
                        ? 'none'
                        : `1px solid ${C.cardBorder}`,
                      background: replyTone === tone
                        ? C.purple : 'transparent',
                      color: replyTone === tone ? C.text : C.muted,
                      fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateReply}
              disabled={replyLoading || !customerMsg.trim()}
              style={{
                width: '100%', padding: '13px 0',
                background: replyLoading || !customerMsg.trim()
                  ? 'rgba(124,58,237,0.3)' : C.purple,
                border: 'none', borderRadius: 10,
                color: C.text, fontSize: 14, fontWeight: 700,
                cursor: replyLoading || !customerMsg.trim()
                  ? 'not-allowed' : 'pointer',
              }}
            >
              {replyLoading ? 'Generating...' : '✨ Generate Reply'}
            </button>

            <ResultBox
              result={replyResult}
              loading={replyLoading}
              copyKey="reply"
            />
          </div>
        </div>
      )}

      {/* ── FAQ Generator ───────────────────────────────────────── */}
      {activeTool === 'faq' && (
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{
            color: C.text, fontSize: 16,
            fontWeight: 700, marginBottom: 4,
          }}>
            ❓ FAQ Generator
          </h2>
          <p style={{
            color: C.muted, fontSize: 13,
            marginBottom: 20, lineHeight: 1.5,
          }}>
            Describe your store and get ready-made FAQs to share with customers
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Store Description</label>
              <textarea
                value={storeDesc}
                onChange={e => setStoreDesc(e.target.value)}
                placeholder="e.g. We sell Nigerian fashion — Ankara tops, skirts, and accessories. We deliver nationwide and accept bank transfer."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <button
              onClick={generateFAQ}
              disabled={faqLoading || !storeDesc.trim()}
              style={{
                width: '100%', padding: '13px 0',
                background: faqLoading || !storeDesc.trim()
                  ? 'rgba(124,58,237,0.3)' : C.purple,
                border: 'none', borderRadius: 10,
                color: C.text, fontSize: 14, fontWeight: 700,
                cursor: faqLoading || !storeDesc.trim()
                  ? 'not-allowed' : 'pointer',
              }}
            >
              {faqLoading ? 'Generating...' : '✨ Generate FAQs'}
            </button>

            <ResultBox
              result={faqResult}
              loading={faqLoading}
              copyKey="faq"
            />
          </div>
        </div>
      )}

      {/* ── Promo Writer ─────────────────────────────────────────── */}
      {activeTool === 'promo' && (
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{
            color: C.text, fontSize: 16,
            fontWeight: 700, marginBottom: 4,
          }}>
            📣 Promo Writer
          </h2>
          <p style={{
            color: C.muted, fontSize: 13,
            marginBottom: 20, lineHeight: 1.5,
          }}>
            Generate engaging promotional messages for WhatsApp and Instagram
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Ankara Wrap Dress"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Price
                <span style={{
                  color: C.muted, fontWeight: 400,
                  textTransform: 'none', marginLeft: 6,
                }}>
                  optional
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14,
                  top: '50%', transform: 'translateY(-50%)',
                  color: C.muted, fontSize: 14,
                }}>
                  ₦
                </span>
                <input
                  type="number"
                  value={productPrice}
                  onChange={e => setProductPrice(e.target.value)}
                  placeholder="8500"
                  style={{ ...inputStyle, paddingLeft: 28 }}
                />
              </div>
            </div>

            <button
              onClick={generatePromo}
              disabled={promoLoading || !productName.trim()}
              style={{
                width: '100%', padding: '13px 0',
                background: promoLoading || !productName.trim()
                  ? 'rgba(124,58,237,0.3)'
                  : `linear-gradient(90deg, ${C.purple}, ${C.pink})`,
                border: 'none', borderRadius: 10,
                color: C.text, fontSize: 14, fontWeight: 700,
                cursor: promoLoading || !productName.trim()
                  ? 'not-allowed' : 'pointer',
              }}
            >
              {promoLoading ? 'Generating...' : '✨ Write Promo Message'}
            </button>

            <ResultBox
              result={promoResult}
              loading={promoLoading}
              copyKey="promo"
            />
          </div>
        </div>
      )}

      {/* Info banner */}
      <div style={{
        background: 'rgba(124,58,237,0.05)',
        border: '1px solid rgba(124,58,237,0.15)',
        borderRadius: 12, padding: '14px 16px',
        marginTop: 20, display: 'flex',
        alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
        <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>
            Powered by Claude AI
          </span>{' '}
          — All AI tools use Anthropic&#39;s Claude model to generate
          contextually relevant content for African sellers.
          Results are suggestions — always review before sending.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}