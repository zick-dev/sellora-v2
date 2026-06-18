'use client';
import { useTheme } from '@/lib/theme';
import api from '@/lib/api';
import { useState } from 'react';

type Tool = 'reply' | 'faq' | 'promo';

export default function AIToolsPage() {
  const { C } = useTheme();
  const [activeTool, setActiveTool] = useState<Tool>('reply');

  const [customerMsg, setCustomerMsg]   = useState('');
  const [replyTone, setReplyTone]       = useState('friendly');
  const [replyResult, setReplyResult]   = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const [storeDesc, setStoreDesc]   = useState('');
  const [faqResult, setFaqResult]   = useState('');
  const [faqLoading, setFaqLoading] = useState(false);

  const [productName, setProductName]   = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [promoResult, setPromoResult]   = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [copied, setCopied]             = useState('');
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  async function callAI(prompt: string): Promise<string> {
    try {
      const res = await api.post('/api/ai/generate', { prompt });
      return res.data.text || 'No response generated.';
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || '';
      if (status === 403 || detail.toLowerCase().includes('pro') || detail.toLowerCase().includes('upgrade')) {
        setShowUpgradePopup(true);
        return '';
      }
      throw new Error(detail || 'AI generation failed.');
    }
  }

  async function generateReply() {
    if (!customerMsg.trim()) return;
    setReplyLoading(true); setReplyResult('');
    try {
      const prompt = 'You are a helpful WhatsApp seller assistant in Nigeria.\nA customer sent this message: "' + customerMsg + '"\nWrite a ' + replyTone + ' reply in 2-3 sentences.\nBe concise, professional, and use Nigerian context where appropriate.\nOnly output the reply message, nothing else.';
      const result = await callAI(prompt);
      setReplyResult(result);
    } catch (err: any) {
      setReplyResult(err.message || 'Failed to generate reply.');
    } finally { setReplyLoading(false); }
  }

  async function generateFAQ() {
    if (!storeDesc.trim()) return;
    setFaqLoading(true); setFaqResult('');
    try {
      const prompt = 'You are a helpful assistant for Nigerian WhatsApp/Instagram sellers.\nBased on this store description: "' + storeDesc + '"\nGenerate 5 frequently asked questions with answers that this store would typically receive from customers.\nFormat as:\nQ: [question]\nA: [answer]\n\nKeep answers concise and relevant to Nigerian e-commerce context.';
      const result = await callAI(prompt);
      setFaqResult(result);
    } catch (err: any) {
      setFaqResult(err.message || 'Failed to generate FAQs.');
    } finally { setFaqLoading(false); }
  }

  async function generatePromo() {
    if (!productName.trim()) return;
    setPromoLoading(true); setPromoResult('');
    try {
      const priceStr = productPrice ? 'Price: N' + productPrice : '';
      const prompt = 'You are a marketing copywriter for Nigerian WhatsApp/Instagram sellers.\nWrite a compelling promotional message for:\nProduct: ' + productName + '\n' + priceStr + '\n\nWrite a short, engaging WhatsApp/Instagram caption that:\n- Grabs attention immediately\n- Highlights the value\n- Creates urgency\n- Ends with a clear call to action\n- Uses relevant emojis\n- Is suitable for Nigerian market\n\nOnly output the promotional message, nothing else.';
      const result = await callAI(prompt);
      setPromoResult(result);
    } catch (err: any) {
      setPromoResult(err.message || 'Failed to generate promo.');
    } finally { setPromoLoading(false); }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function isRealResult(result: string) {
    if (!result) return false;
    const errorKeywords = ['failed', 'upgrade', 'pro plan', 'coming soon', 'error'];
    return !errorKeywords.some(k => result.toLowerCase().includes(k));
  }

  const tools = [
    { id: 'reply' as Tool, icon: '💬', label: 'Reply Suggester', desc: 'Generate smart replies to customer messages' },
    { id: 'faq'   as Tool, icon: '❓', label: 'FAQ Generator',   desc: 'Create FAQs for your store' },
    { id: 'promo' as Tool, icon: '📣', label: 'Promo Writer',    desc: 'Write promotional messages for products' },
  ];

  const inputStyle = {
    width: '100%', background: C.input,
    border: '1.5px solid ' + C.inputBorder,
    borderRadius: 10, padding: '12px 14px',
    color: C.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: C.subtext, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 8,
  };

  function ResultBox({ result, loading, copyKey }: { result: string; loading: boolean; copyKey: string }) {
    if (loading) return (
      <div style={{ background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ color: C.muted, fontSize: 14 }}>Gemini is thinking...</span>
      </div>
    );
    if (!result) return null;
    const isReal = isRealResult(result);
    return (
      <div style={{ background: isReal ? 'rgba(124,58,237,0.05)' : 'rgba(239,68,68,0.05)', border: '1px solid ' + (isReal ? 'rgba(124,58,237,0.2)' : 'rgba(239,68,68,0.2)'), borderRadius: 12, padding: 16 }}>
        <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: isReal ? 12 : 0 }}>{result}</p>
        {isReal && (
          <button onClick={() => copyText(result, copyKey)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: copied === copyKey ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', border: '1px solid ' + (copied === copyKey ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)'), color: copied === copyKey ? C.success : C.purple, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {copied === copyKey ? '✓ Copied!' : '📋 Copy'}
          </button>
        )}
      </div>
    );
  }

  function GenBtn({ onClick, disabled, loading, label, gradient }: { onClick: () => void; disabled: boolean; loading: boolean; label: string; gradient?: boolean }) {
    return (
      <button onClick={onClick} disabled={disabled}
        style={{ width: '100%', padding: '13px 0', background: disabled ? 'rgba(124,58,237,0.3)' : gradient ? 'linear-gradient(90deg, ' + C.purple + ', ' + C.pink + ')' : C.purple, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Generating...' : label}
      </button>
    );
  }

  return (
    <div style={{ padding: '0 0 80px', maxWidth: 640 }}>

      {/* Upgrade Popup */}
      {showUpgradePopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setShowUpgradePopup(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '100%', textAlign: 'center', zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h2 style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Pro Feature</h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              AI Tools are available on the <strong style={{ color: C.purple }}>Pro plan</strong>. Upgrade to unlock unlimited AI-powered replies, FAQs, and promo messages.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/upgrade" style={{ display: 'block', padding: '13px 0', background: 'linear-gradient(90deg, ' + C.purple + ', ' + C.pink + ')', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Upgrade to Pro →
              </a>
              <button onClick={() => setShowUpgradePopup(false)} style={{ padding: '11px 0', background: 'transparent', border: '1px solid ' + C.cardBorder, borderRadius: 10, color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800 }}>AI Tools</h1>
          <span style={{ background: 'linear-gradient(135deg, ' + C.purple + ', ' + C.pink + ')', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            GEMINI AI
          </span>
        </div>
        <p style={{ color: C.muted, fontSize: 14 }}>Save time with AI-powered tools built for African sellers</p>
      </div>

      {/* Tool selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {tools.map(tool => (
          <button key={tool.id} onClick={() => setActiveTool(tool.id)}
            style={{ padding: '14px 10px', borderRadius: 14, border: activeTool === tool.id ? '2px solid rgba(124,58,237,0.5)' : '1px solid ' + C.cardBorder, background: activeTool === tool.id ? 'rgba(124,58,237,0.08)' : C.card, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{tool.icon}</div>
            <p style={{ color: activeTool === tool.id ? C.text : C.subtext, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{tool.label}</p>
            <p style={{ color: C.muted, fontSize: 10, lineHeight: 1.4 }}>{tool.desc}</p>
          </button>
        ))}
      </div>

      {/* Reply Suggester */}
      {activeTool === 'reply' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💬 Reply Suggester</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Paste a customer message and get a smart reply instantly</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Customer Message</label>
              <textarea value={customerMsg} onChange={e => setCustomerMsg(e.target.value)} placeholder="e.g. Hello, is this item still available? Can you do delivery to Abuja?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Reply Tone</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['friendly', 'professional', 'urgent', 'casual'].map(tone => (
                  <button key={tone} onClick={() => setReplyTone(tone)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: replyTone === tone ? 'none' : '1px solid ' + C.cardBorder, background: replyTone === tone ? C.purple : 'transparent', color: replyTone === tone ? '#fff' : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                    {tone}
                  </button>
                ))}
              </div>
            </div>
            <GenBtn onClick={generateReply} disabled={replyLoading || !customerMsg.trim()} loading={replyLoading} label="✨ Generate Reply" />
            <ResultBox result={replyResult} loading={replyLoading} copyKey="reply" />
          </div>
        </div>
      )}

      {/* FAQ Generator */}
      {activeTool === 'faq' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>❓ FAQ Generator</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Describe your store and get ready-made FAQs to share with customers</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Store Description</label>
              <textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} placeholder="e.g. We sell Nigerian fashion — Ankara tops, skirts, and accessories. We deliver nationwide and accept bank transfer." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <GenBtn onClick={generateFAQ} disabled={faqLoading || !storeDesc.trim()} loading={faqLoading} label="✨ Generate FAQs" />
            <ResultBox result={faqResult} loading={faqLoading} copyKey="faq" />
          </div>
        </div>
      )}

      {/* Promo Writer */}
      {activeTool === 'promo' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📣 Promo Writer</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Generate engaging promotional messages for WhatsApp and Instagram</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Product Name</label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Ankara Wrap Dress" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Price <span style={{ color: C.muted, fontWeight: 400, textTransform: 'none', marginLeft: 6 }}>optional</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14 }}>₦</span>
                <input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="8500" style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
            </div>
            <GenBtn onClick={generatePromo} disabled={promoLoading || !productName.trim()} loading={promoLoading} label="✨ Write Promo Message" gradient />
            <ResultBox result={promoResult} loading={promoLoading} copyKey="promo" />
          </div>
        </div>
      )}

      {/* Info banner */}
      <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: '14px 16px', marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
        <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>Powered by Gemini AI</span>{' '}
          — All AI tools use Google Gemini to generate contextually relevant content for African sellers. Results are suggestions — always review before sending.
        </p>
      </div>

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
