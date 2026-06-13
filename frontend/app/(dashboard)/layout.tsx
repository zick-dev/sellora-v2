'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme, DARK } from '@/lib/theme';

// ─── Store context (shared across dashboard pages) ────────────────────────────
type StoreData = {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
} | null;

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  auth_provider: string;
  is_verified: boolean;
} | null;

const DashboardContext = createContext<{
  store: StoreData;
  user: UserData;
  loading: boolean;
}>({ store: null, user: null, loading: true });

export const useDashboard = () => useContext(DashboardContext);

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
  href: '/analytics',
  label: 'Analytics',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round"/>
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round"/>
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round"/>
    </svg>
  ),
  },
  {
    href: '/products',
    label: 'Products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: true,
  },
  {
    href: '/storefront',
    label: 'My Store',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/leads',
    label: 'Lead Recovery',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" strokeLinecap="round"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'AI Tools',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: true,
  },
  {
  href: '/settings',
  label: 'Settings',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round"/>
    </svg>
  ),
  },
  {
      href: '/upgrade',
      label: 'Upgrade',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
];

// ─── Theme toggle button ──────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme, C } = useTheme();
  return (
    <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ width: 34, height: 34, borderRadius: 9, background: C.purpleDim, border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}


// ─── Sidebar (desktop) ────────────────────────────────────────────────────────
function Sidebar({
  user,
  store,
  onLogout,
}: {
  user: UserData;
  store: StoreData;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const { C } = useTheme();

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: C.sidebar,
      borderRight: `1px solid ${C.sidebarBorder}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${C.sidebarBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: C.purple,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
                fill="white" stroke="white" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: C.purple, fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
            Sellora
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <p style={{
          color: C.muted, fontSize: 10, fontWeight: 700,
          letterSpacing: 1.5, textTransform: 'uppercase',
          padding: '4px 8px 10px',
        }}>
          Menu
        </p>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              textDecoration: 'none',
              background: active ? C.purpleDim : 'transparent',
              color: active ? C.purpleLight : C.mutedLight,
              transition: 'all 0.15s',
              position: 'relative',
            }}>
              {item.icon}
              <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
              {item.badge && (
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: C.purple,
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{
        borderTop: `1px solid ${C.sidebarBorder}`,
        padding: '12px',
      }}>
        {/* View My Store */}
        {store && (
          <a
            href={`/store/${store.slug}`}
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', color: C.mutedLight,
              fontSize: 13, fontWeight: 400,
              transition: 'color 0.15s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round"/>
              <polyline points="15 3 21 3 21 9" strokeLinecap="round"/>
              <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round"/>
            </svg>
            View My Store
          </a>
        )}

        {/* User row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 12px', gap: 10,
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: C.purple, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name ?? 'Seller'}
            </p>
            <p style={{ color: C.muted, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email ?? ''}
            </p>
          </div>
          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, padding: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────
function MobileDrawer({
  open,
  onClose,
  user,
  store,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: UserData;
  store: StoreData;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const { C } = useTheme();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: 280, background: C.sidebar,
        borderRight: `1px solid ${C.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: `1px solid ${C.sidebarBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: C.purple,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
                  fill="white" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ color: C.purple, fontWeight: 800, fontSize: 16 }}>Sellora</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* User card */}
        <div style={{
          margin: '12px', padding: '12px 14px',
          background: C.card, borderRadius: 12,
          border: `1px solid ${C.cardBorder}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: C.purple, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
          }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </span>
            )}
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 9, height: 9, borderRadius: '50%',
              background: C.success, border: '1.5px solid ' + C.sidebar,
            }} />
          </div>
          <div>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{user?.name ?? 'Seller'}</p>
            <p style={{ color: C.muted, fontSize: 12 }}>{user?.email ?? ''}</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
          <p style={{
            color: C.muted, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase',
            padding: '8px 8px 10px',
          }}>Menu</p>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 14px', borderRadius: 12, marginBottom: 4,
                textDecoration: 'none',
                background: active ? C.purpleDim : 'transparent',
                color: active ? C.purpleLight : C.mutedLight,
              }}>
                {item.icon}
                <span style={{ fontSize: 15, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {item.badge && (
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: C.purple, marginLeft: 'auto',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${C.sidebarBorder}`, padding: '12px' }}>
          {store && (
            <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 14px', borderRadius: 12, marginBottom: 4,
                textDecoration: 'none', color: C.mutedLight, fontSize: 14,
              }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round"/>
                <polyline points="15 3 21 3 21 9" strokeLinecap="round"/>
                <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round"/>
              </svg>
              View My Store
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
              </svg>
            </a>
          )}
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 14px', borderRadius: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ef4444', fontSize: 14, width: '100%',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
            Logout
          </button>
          <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 12, letterSpacing: 0.5 }}>
            SELLORA CLOUD • v2.4.0
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Top bar (mobile) ─────────────────────────────────────────────────────────
function Topbar({
  user,
  store,
  onMenuClick,
}: {
  user: UserData;
  store: StoreData;
  onMenuClick: () => void;
}) {
  const { C } = useTheme();
  return (
    <header style={{
      height: 56, background: C.topbar,
      borderBottom: `1px solid ${C.sidebarBorder}`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <button onClick={onMenuClick} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.mutedLight, padding: 4,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
          <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
          <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
        </svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: C.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
              fill="white" stroke="white" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ color: C.purple, fontWeight: 800, fontSize: 15 }}>Sellora</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle />
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: C.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </span>
          )}
          <div style={{
            position: 'absolute', bottom: 1, right: 0,
            width: 8, height: 8, borderRadius: '50%',
            background: C.success, border: '1.5px solid ' + C.topbar,
          }} />
        </div>
      </div>
    </header>
  );
}

// ─── Desktop topbar ───────────────────────────────────────────────────────────
function DesktopTopbar({ user, store }: { user: UserData; store: StoreData }) {
  const { C } = useTheme();
  return (
    <header style={{
      height: 56, background: C.topbar,
      borderBottom: `1px solid ${C.sidebarBorder}`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'flex-end', padding: '0 24px', gap: 14,
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <ThemeToggle />

      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: C.purple,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative', cursor: 'pointer',
      }}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
            {user?.name?.[0]?.toUpperCase() ?? 'S'}
          </span>
        )}
        <div style={{
          position: 'absolute', bottom: 1, right: 0,
          width: 9, height: 9, borderRadius: '50%',
          background: C.success, border: '1.5px solid ' + C.topbar,
        }} />
      </div>
    </header>
  );
}

// ─── Layout root ──────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { C } = useTheme();
  const [user, setUser]       = useState<UserData>(null);
  const [store, setStore]     = useState<StoreData>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load user + store on mount
  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('access_token');
      if (!token) { router.push('/login'); return; }

      try {
        const [userRes, storeRes] = await Promise.all([
          fetch('http://localhost:8000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:8000/api/store/me', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (userRes.status === 401) { router.push('/login'); return; }

        if (storeRes.status === 401) { router.push('/login'); return; }
        if (storeRes.status === 404) { router.push('/onboarding'); return; }

        const userData  = await userRes.json();
        const storeData = await storeRes.json();

        setUser(userData);
        setStore(storeData);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/signed-out');
  }

  if (loading) {
    return (
      <>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${C.bg}; }`}</style>
        <div style={{
          minHeight: '100vh', background: C.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: C.purple,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'pulse 1.2s ease-in-out infinite',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
                  fill="white" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: C.muted, fontSize: 13 }}>Loading your dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }
        a:hover { opacity: 0.85; }
      `}</style>

      <DashboardContext.Provider value={{ store, user, loading }}>
        {isMobile ? (
          // ── Mobile layout ──────────────────────────────────────
          <div style={{ minHeight: '100vh', background: C.bg }}>
            <Topbar user={user} store={store} onMenuClick={() => setDrawerOpen(true)} />
            <MobileDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              user={user}
              store={store}
              onLogout={handleLogout}
            />
            <main style={{ padding: '20px 16px 100px' }}>
              {children}
            </main>
            {/* Mobile bottom nav */}
            <nav style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: C.sidebar, borderTop: `1px solid ${C.sidebarBorder}`,
              display: 'flex', padding: '8px 0 12px',
              zIndex: 20,
            }}>
              {NAV_ITEMS.filter(item => [
                  '/dashboard',
                  '/products',
                  '/orders',
                  '/leads',
                  '/ai',
                ].includes(item.href)).map(item => (
                  <MobileNavItem key={item.href} item={item} />
                ))}
            </nav>
          </div>
        ) : (
          // ── Desktop layout ─────────────────────────────────────
          <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
            <Sidebar user={user} store={store} onLogout={handleLogout} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <DesktopTopbar user={user} store={store} />
              <main style={{ flex: 1, padding: '32px 32px', overflowY: 'auto' }}>
                {children}
              </main>
              <footer style={{
                borderTop: `1px solid ${C.sidebarBorder}`,
                padding: '12px 32px',
                textAlign: 'center',
              }}>
                <p style={{ color: C.muted, fontSize: 12 }}>© 2024 Sellora • Premium Seller Tools</p>
              </footer>
            </div>
          </div>
        )}
      </DashboardContext.Provider>
    </>
  );
}

// ─── Mobile bottom nav item ───────────────────────────────────────────────────
function MobileNavItem({ item }: { item: typeof NAV_ITEMS[0] }) {
  const pathname = usePathname();
  const { C } = useTheme();
  const active = pathname === item.href;
  return (
    <Link href={item.href} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 3,
      textDecoration: 'none',
      color: active ? C.purpleLight : C.muted,
    }}>
      {item.icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
    </Link>
  );
}

// re-export token colors so child pages can import them
export const C = DARK;