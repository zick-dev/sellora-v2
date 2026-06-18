'use client';

import { useState, useRef } from 'react';

const C = {
  card:       '#12121a',
  cardBorder: 'rgba(255,255,255,0.08)',
  input:      '#1a1a2e',
  inputBorder:'rgba(255,255,255,0.1)',
  purple:     '#7c3aed',
  muted:      '#6b7280',
  subtext:    '#9ca3af',
  text:       '#ffffff',
  success:    '#10b981',
  red:        '#ef4444',
};

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspectRatio?: string;
  placeholder?: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export default function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspectRatio = '1',
  placeholder = '🖼️',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const [showUrl, setShowUrl]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Cloudinary not configured. Use URL input below.');
      setShowUrl(true);
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'sellora');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
      } else {
        setError('Upload failed. Try again.');
      }
    } catch {
      setError('Upload failed. Check your connection.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          {label}
        </label>
      )}

      {/* Drop zone / preview */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !value && fileRef.current?.click()}
        style={{
          width: '100%',
          aspectRatio,
          maxHeight: aspectRatio === '1' ? 200 : 140,
          borderRadius: 12,
          border: dragging
            ? '2px solid ' + C.purple
            : value
              ? '1px solid ' + C.cardBorder
              : '2px dashed ' + C.inputBorder,
          background: dragging ? 'rgba(124,58,237,0.08)' : C.input,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: value ? 'default' : 'pointer',
          position: 'relative',
          transition: 'all 0.15s',
          marginBottom: 10,
        }}
      >
        {uploading ? (
          <div style={{ textAlign: 'center' }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 8 }} />
            <p style={{ color: C.muted, fontSize: 12 }}>Uploading...</p>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Overlay controls */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1') && (e.currentTarget.style.background = 'rgba(0,0,0,0.5)') as any}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0') && (e.currentTarget.style.background = 'rgba(0,0,0,0)') as any}
            >
              <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} style={{ padding: '8px 14px', borderRadius: 8, background: C.purple, border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Change
              </button>
              <button onClick={e => { e.stopPropagation(); onChange(''); }} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.8)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{placeholder}</div>
            <p style={{ color: C.subtext, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Drop image here or click to upload
            </p>
            <p style={{ color: C.muted, fontSize: 11 }}>PNG, JPG, WebP up to 10MB</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!uploading && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: C.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {value ? '📁 Replace' : '📁 Choose File'}
          </button>
          <button
            onClick={() => setShowUrl(!showUrl)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: C.input, border: '1px solid ' + C.inputBorder, color: C.subtext, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {showUrl ? 'Hide URL' : '🔗 Use URL'}
          </button>
        </div>
      )}

      {/* URL input fallback */}
      {showUrl && (
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          style={{ width: '100%', background: C.input, border: '1px solid ' + C.inputBorder, borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
        />
      )}

      {error && (
        <p style={{ color: C.red, fontSize: 12, marginBottom: 4 }}>{error}</p>
      )}

      {hint && !error && (
        <p style={{ color: C.muted, fontSize: 11 }}>{hint}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}