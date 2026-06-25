'use client';

/**
 * IconBackground.tsx
 * ──────────────────
 * Animated floating feature icons background, similar to WhatsApp's
 * pattern but with Kormerce-relevant commerce/chat icons.
 * 
 * Used on: landing page, signup, login.
 * Renders as an absolute-positioned layer behind content.
 */

const ICONS = [
  // Shopping bag
  'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  // Chat bubble
  'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  // Store
  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  // Truck
  'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  // Star
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  // Tag/price
  'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  // Phone
  'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  // Globe
  'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  // Heart
  'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  // Zap/AI
  'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  // Camera
  'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  // Clipboard
  'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z',
];

// Pre-computed positions for 20 icon instances (spread across the viewport)
const POSITIONS = [
  { x: 5, y: 8, delay: 0, dur: 18, size: 22 },
  { x: 15, y: 65, delay: 2, dur: 22, size: 18 },
  { x: 25, y: 30, delay: 5, dur: 20, size: 24 },
  { x: 35, y: 80, delay: 1, dur: 19, size: 16 },
  { x: 45, y: 15, delay: 4, dur: 21, size: 20 },
  { x: 55, y: 55, delay: 3, dur: 23, size: 22 },
  { x: 65, y: 90, delay: 6, dur: 18, size: 18 },
  { x: 75, y: 40, delay: 2, dur: 20, size: 24 },
  { x: 85, y: 70, delay: 5, dur: 22, size: 16 },
  { x: 92, y: 20, delay: 1, dur: 19, size: 20 },
  { x: 10, y: 45, delay: 3, dur: 21, size: 18 },
  { x: 20, y: 88, delay: 4, dur: 23, size: 22 },
  { x: 40, y: 50, delay: 0, dur: 20, size: 16 },
  { x: 50, y: 5, delay: 6, dur: 18, size: 20 },
  { x: 60, y: 35, delay: 2, dur: 22, size: 24 },
  { x: 70, y: 75, delay: 5, dur: 19, size: 18 },
  { x: 80, y: 10, delay: 1, dur: 21, size: 22 },
  { x: 90, y: 50, delay: 3, dur: 20, size: 16 },
  { x: 30, y: 60, delay: 4, dur: 23, size: 20 },
  { x: 48, y: 92, delay: 6, dur: 18, size: 18 },
];

interface Props {
  opacity?: number;
  color?: string;
}

export default function IconBackground({ opacity = 0.18, color = '#4F46E5' }: Props) {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        {POSITIONS.map((pos, i) => {
          const icon = ICONS[i % ICONS.length];
          return (
            <svg
              key={i}
              className={`float-icon float-icon-${i % 4}`}
              width={pos.size}
              height={pos.size}
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                opacity,
                animationDelay: `${pos.delay}s`,
                animationDuration: `${pos.dur}s`,
                filter: `drop-shadow(0 0 6px ${color})`,
              }}
            >
              <path d={icon} />
            </svg>
          );
        })}
      </div>
      <style>{`
        @keyframes floatA { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(8deg); } }
        @keyframes floatB { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(10px) rotate(-6deg); } }
        @keyframes floatC { 0%,100% { transform: translateX(0) rotate(0deg); } 50% { transform: translateX(12px) rotate(5deg); } }
        @keyframes floatD { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(-8px, -10px) rotate(-4deg); } }
        .float-icon-0 { animation: floatA infinite ease-in-out; }
        .float-icon-1 { animation: floatB infinite ease-in-out; }
        .float-icon-2 { animation: floatC infinite ease-in-out; }
        .float-icon-3 { animation: floatD infinite ease-in-out; }
      `}</style>
    </>
  );
}
