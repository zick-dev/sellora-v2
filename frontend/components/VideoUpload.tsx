'use client';

import { useState, useRef } from 'react';

const C = {
  card:       '#12121a',
  cardBorder: 'rgba(255,255,255,0.08)',
  input:      '#1a1a2e',
  inputBorder:'rgba(255,255,255,0.1)',
  purple:     '#4F46E5',
  muted:      '#6b7280',
  subtext:    '#9ca3af',
  text:       '#ffffff',
  red:        '#ef4444',
};

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  maxDurationSec?: number;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export default function VideoUpload({
  value,
  onChange,
  label,
  hint,
  maxDurationSec = 10,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function checkVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error('Could not read video metadata.'));
      video.src = URL.createObjectURL(file);
    });
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be under 50MB.');
      return;
    }

    try {
      const duration = await checkVideoDuration(file);
      if (duration > maxDurationSec + 0.5) {
        setError(`Video must be ${maxDurationSec} seconds or shorter. Yours is ${duration.toFixed(1)}s.`);
        return;
      }
    } catch {
      setError('Could not verify video length. Please try another file.');
      return;
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Cloudinary not configured.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'kormerce/banners');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
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

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !value && fileRef.current?.click()}
        style={{
          width: '100%', height: 140, borderRadius: 12,
          border: dragging ? '2px solid ' + C.purple : value ? '1px solid ' + C.cardBorder : '2px dashed ' + C.inputBorder,
          background: dragging ? 'rgba(79,70,229,0.08)' : C.input,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: value ? 'default' : 'pointer', position: 'relative', marginBottom: 10,
        }}
      >
        {uploading ? (
          <div style={{ textAlign: 'center' }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(79,70,229,0.2)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite', display: 'inline-block', marginBottom: 8 }} />
            <p style={{ color: C.muted, fontSize: 12 }}>Uploading video...</p>
          </div>
        ) : value ? (
          <>
            <video src={value} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(0,0,0,0)', opacity: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
              <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} style={{ padding: '8px 14px', borderRadius: 8, background: C.purple, border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Change</button>
              <button onClick={e => { e.stopPropagation(); onChange(''); }} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.8)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
            <p style={{ color: C.subtext, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Drop video here or click to upload</p>
            <p style={{ color: C.muted, fontSize: 11 }}>{`Max ${maxDurationSec} seconds, up to 50MB`}</p>
          </div>
        )}
      </div>

      {!uploading && (
        <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: C.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
          {value ? '🎬 Replace Video' : '🎬 Choose Video File'}
        </button>
      )}

      {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 4 }}>{error}</p>}
      {hint && !error && <p style={{ color: C.muted, fontSize: 11 }}>{hint}</p>}

      <input ref={fileRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
