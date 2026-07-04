'use client';

import { useState, useEffect } from 'react';

interface Variant {
  variant_type_1: string | null;
  variant_value_1: string | null;
  variant_type_2: string | null;
  variant_value_2: string | null;
  price: number | null;
  stock: number;
  is_available: boolean;
}

interface VariantBuilderProps {
  storeType: string;
  basePrice: string;
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  C: any;
}

// Suggested variant dimensions per store type
const STORE_TYPE_PRESETS: Record<string, { type1: string; values1: string[]; type2?: string; values2?: string[] }> = {
  clothing: {
    type1: 'Size', values1: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    type2: 'Color', values2: ['Black', 'White', 'Red', 'Blue', 'Green'],
  },
  shoes: {
    type1: 'Size', values1: ['38', '39', '40', '41', '42', '43', '44', '45'],
    type2: 'Color', values2: ['Black', 'White', 'Brown', 'Tan'],
  },
  beauty: {
    type1: 'Shade', values1: ['Light', 'Medium', 'Tan', 'Deep'],
    type2: 'Size', values2: ['Small', 'Regular', 'Large'],
  },
  electronics: {
    type1: 'Storage', values1: ['32GB', '64GB', '128GB', '256GB'],
    type2: 'Color', values2: ['Black', 'White', 'Silver', 'Gold'],
  },
  jewelry: {
    type1: 'Size', values1: ['Small', 'Medium', 'Large'],
    type2: 'Material', values2: ['Gold', 'Silver', 'Rose Gold'],
  },
  food: {
    type1: 'Size', values1: ['Small', 'Medium', 'Large', 'Family Pack'],
    type2: 'Spice Level', values2: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
  },
  general: {
    type1: 'Option', values1: [],
  },
};

export default function VariantBuilder({ storeType, basePrice, variants, onChange, C }: VariantBuilderProps) {
  const [enabled, setEnabled] = useState(variants.length > 0);
  const preset = STORE_TYPE_PRESETS[storeType] || STORE_TYPE_PRESETS.general;

  const [type1, setType1] = useState(preset.type1);
  const [values1, setValues1] = useState<string[]>([]);
  const [type2, setType2] = useState(preset.type2 || '');
  const [values2, setValues2] = useState<string[]>([]);
  const [useSecondDimension, setUseSecondDimension] = useState(!!preset.type2);
  const [newValue1, setNewValue1] = useState('');
  const [newValue2, setNewValue2] = useState('');

  // Initialize from existing variants when editing
  useEffect(() => {
    if (variants.length > 0) {
      const v1set = new Set(variants.map(v => v.variant_value_1).filter(Boolean));
      const v2set = new Set(variants.map(v => v.variant_value_2).filter(Boolean));
      setValues1(Array.from(v1set) as string[]);
      if (v2set.size > 0) {
        setValues2(Array.from(v2set) as string[]);
        setUseSecondDimension(true);
      }
      if (variants[0].variant_type_1) setType1(variants[0].variant_type_1);
      if (variants[0].variant_type_2) setType2(variants[0].variant_type_2);
    }
  }, []);

  function generateCombinations() {
    if (values1.length === 0) { onChange([]); return; }

    const combos: Variant[] = [];
    if (useSecondDimension && values2.length > 0) {
      for (const v1 of values1) {
        for (const v2 of values2) {
          const existing = variants.find(v => v.variant_value_1 === v1 && v.variant_value_2 === v2);
          combos.push(existing || {
            variant_type_1: type1, variant_value_1: v1,
            variant_type_2: type2, variant_value_2: v2,
            price: null, stock: 0, is_available: true,
          });
        }
      }
    } else {
      for (const v1 of values1) {
        const existing = variants.find(v => v.variant_value_1 === v1 && !v.variant_value_2);
        combos.push(existing || {
          variant_type_1: type1, variant_value_1: v1,
          variant_type_2: null, variant_value_2: null,
          price: null, stock: 0, is_available: true,
        });
      }
    }
    onChange(combos);
  }

  function addValue1() {
    if (!newValue1.trim() || values1.includes(newValue1.trim())) return;
    setValues1([...values1, newValue1.trim()]);
    setNewValue1('');
  }
  function addValue2() {
    if (!newValue2.trim() || values2.includes(newValue2.trim())) return;
    setValues2([...values2, newValue2.trim()]);
    setNewValue2('');
  }
  function removeValue1(v: string) { setValues1(values1.filter(x => x !== v)); }
  function removeValue2(v: string) { setValues2(values2.filter(x => x !== v)); }

  function updateCombo(index: number, field: keyof Variant, value: any) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  const pillStyle = (active: boolean) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 16,
    background: active ? C.purple : C.input,
    border: '1px solid ' + (active ? C.purple : C.inputBorder),
    color: active ? '#fff' : C.text,
    fontSize: 12, fontWeight: 600,
  });

  if (!enabled) {
    return (
      <div style={{ background: C.input, border: '1px dashed ' + C.inputBorder, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>Add variants?</p>
          <p style={{ color: C.muted, fontSize: 12 }}>e.g. Size, Color — each with its own price &amp; stock</p>
        </div>
        <button onClick={() => setEnabled(true)} style={{ padding: '7px 14px', borderRadius: 8, background: C.purple, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          + Add Variants
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Product Variants</p>
        <button onClick={() => { setEnabled(false); onChange([]); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          Remove variants
        </button>
      </div>

      {/* Dimension 1 */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          value={type1}
          onChange={e => setType1(e.target.value)}
          placeholder="Variant type (e.g. Size)"
          style={{ width: '100%', background: C.card, border: '1px solid ' + C.inputBorder, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' as const }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {values1.map(v => (
            <span key={v} style={pillStyle(true)}>
              {v}
              <span onClick={() => removeValue1(v)} style={{ cursor: 'pointer', fontWeight: 800 }}>×</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {(preset.values1 || []).filter(v => !values1.includes(v)).map(v => (
            <button key={v} onClick={() => setValues1([...values1, v])} style={pillStyle(false)}>+ {v}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="text" value={newValue1} onChange={e => setNewValue1(e.target.value)} onKeyDown={e => e.key === 'Enter' && addValue1()} placeholder="Add custom value..." style={{ flex: 1, background: C.card, border: '1px solid ' + C.inputBorder, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 12, outline: 'none' }} />
          <button onClick={addValue1} style={{ padding: '7px 12px', borderRadius: 8, background: C.purple, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
        </div>
      </div>

      {/* Second dimension toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <input type="checkbox" checked={useSecondDimension} onChange={e => setUseSecondDimension(e.target.checked)} style={{ accentColor: C.purple }} />
        <span style={{ color: C.subtext, fontSize: 12 }}>Add a second variant type (e.g. Color)</span>
      </div>

      {useSecondDimension && (
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            value={type2}
            onChange={e => setType2(e.target.value)}
            placeholder="Second variant type (e.g. Color)"
            style={{ width: '100%', background: C.card, border: '1px solid ' + C.inputBorder, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' as const }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {values2.map(v => (
              <span key={v} style={pillStyle(true)}>
                {v}
                <span onClick={() => removeValue2(v)} style={{ cursor: 'pointer', fontWeight: 800 }}>×</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {(preset.values2 || []).filter(v => !values2.includes(v)).map(v => (
              <button key={v} onClick={() => setValues2([...values2, v])} style={pillStyle(false)}>+ {v}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="text" value={newValue2} onChange={e => setNewValue2(e.target.value)} onKeyDown={e => e.key === 'Enter' && addValue2()} placeholder="Add custom value..." style={{ flex: 1, background: C.card, border: '1px solid ' + C.inputBorder, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 12, outline: 'none' }} />
            <button onClick={addValue2} style={{ padding: '7px 12px', borderRadius: 8, background: C.purple, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          </div>
        </div>
      )}

      <button onClick={generateCombinations} disabled={values1.length === 0} style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: values1.length === 0 ? 'rgba(124,58,237,0.3)' : C.purple, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: values1.length === 0 ? 'not-allowed' : 'pointer', marginBottom: 14 }}>
        Generate Combinations
      </button>

      {/* Generated combinations table */}
      {variants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {variants.length} combination{variants.length !== 1 ? 's' : ''} — set price &amp; stock for each
          </p>
          {variants.map((v, i) => (
            <div key={i} style={{ background: C.card, border: '1px solid ' + C.inputBorder, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 700, minWidth: 90 }}>
                {v.variant_value_1}{v.variant_value_2 ? ' / ' + v.variant_value_2 : ''}
              </span>
              <input
                type="number"
                value={v.price ?? ''}
                onChange={e => updateCombo(i, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={'Price (default: ' + (basePrice || '0') + ')'}
                style={{ width: 130, background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 12, outline: 'none' }}
              />
              <input
                type="number"
                value={v.stock}
                onChange={e => updateCombo(i, 'stock', parseInt(e.target.value) || 0)}
                placeholder="Stock"
                style={{ width: 70, background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 6, padding: '6px 8px', color: C.text, fontSize: 12, outline: 'none' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.muted }}>
                <input type="checkbox" checked={v.is_available} onChange={e => updateCombo(i, 'is_available', e.target.checked)} style={{ accentColor: C.purple }} />
                Available
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
