'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useTheme, DARK } from '@/lib/theme';
import api, { setDashboardActive, setDashboardOfflineMode } from '@/lib/api';

// ─── Store context (shared across dashboard pages) ────────────────────────────
type StoreData = {
  id: string;
  user_id: string;
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

type DashboardSnapshot = {
  user: NonNullable<UserData>;
  store: NonNullable<StoreData>;
  lastSyncedAt: string;
};

type DashboardCacheRecord = DashboardSnapshot & {
  version: 1;
  userId: string;
};

type DashboardTokenClaims = {
  sub?: unknown;
};

const DASHBOARD_CACHE_KEY = 'kormmerce_dashboard_cache_v1';
const DASHBOARD_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every(key => keys.includes(key));
}

function getTokenSubject(token: string): string | null {
  try {
    const subject = jwtDecode<DashboardTokenClaims>(token).sub;
    return typeof subject === 'string' && subject.length > 0 ? subject : null;
  } catch {
    return null;
  }
}

function isSnapshotForSubject(
  snapshot: DashboardSnapshot | null,
  subject: string | null,
): snapshot is DashboardSnapshot {
  return !!subject &&
    snapshot?.user.id === subject &&
    snapshot.store.user_id === subject;
}

function normalizeDashboardUser(value: unknown): NonNullable<UserData> | null {
  if (
    !isObject(value) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.name !== 'string' ||
    value.name.length === 0 ||
    typeof value.email !== 'string' ||
    value.email.length === 0 ||
    !(value.avatar_url === null || typeof value.avatar_url === 'string') ||
    typeof value.auth_provider !== 'string' ||
    typeof value.is_verified !== 'boolean'
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    avatar_url: value.avatar_url,
    auth_provider: value.auth_provider,
    is_verified: value.is_verified,
  };
}

function normalizeDashboardStore(value: unknown): NonNullable<StoreData> | null {
  if (
    !isObject(value) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.user_id !== 'string' ||
    value.user_id.length === 0 ||
    typeof value.store_name !== 'string' ||
    value.store_name.length === 0 ||
    typeof value.slug !== 'string' ||
    value.slug.length === 0 ||
    !(value.description === null || typeof value.description === 'string') ||
    !(value.logo_url === null || typeof value.logo_url === 'string')
  ) {
    return null;
  }

  return {
    id: value.id,
    user_id: value.user_id,
    store_name: value.store_name,
    slug: value.slug,
    description: value.description,
    logo_url: value.logo_url,
  };
}

function removeDashboardCache() {
  try {
    localStorage.removeItem(DASHBOARD_CACHE_KEY);
  } catch (error) {
    console.error('Unable to remove the dashboard cache.', error);
  }
}

function readDashboardCache(subject: string | null): DashboardSnapshot | null {
  if (!subject) return null;

  let raw: string | null;
  try {
    raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
  } catch (error) {
    console.error('Unable to read the dashboard cache.', error);
    return null;
  }
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    console.warn('Discarding malformed dashboard cache.');
    removeDashboardCache();
    return null;
  }

  if (!isObject(value)) {
    removeDashboardCache();
    return null;
  }
  if (value.userId !== subject) return null;

  const expectedRecordKeys = ['version', 'userId', 'user', 'store', 'lastSyncedAt'];
  const expectedUserKeys = ['id', 'name', 'email', 'avatar_url', 'auth_provider', 'is_verified'];
  const expectedStoreKeys = ['id', 'user_id', 'store_name', 'slug', 'description', 'logo_url'];
  const user = normalizeDashboardUser(value.user);
  const store = normalizeDashboardStore(value.store);
  const lastSyncedAt = typeof value.lastSyncedAt === 'string'
    ? value.lastSyncedAt
    : null;
  const syncedAt = lastSyncedAt
    ? Date.parse(lastSyncedAt)
    : Number.NaN;

  if (
    value.version !== 1 ||
    !hasOnlyKeys(value, expectedRecordKeys) ||
    !isObject(value.user) ||
    !hasOnlyKeys(value.user, expectedUserKeys) ||
    !isObject(value.store) ||
    !hasOnlyKeys(value.store, expectedStoreKeys) ||
    !user ||
    !store ||
    user.id !== subject ||
    store.user_id !== subject ||
    !Number.isFinite(syncedAt) ||
    new Date(syncedAt).toISOString() !== lastSyncedAt ||
    syncedAt > Date.now() ||
    Date.now() - syncedAt > DASHBOARD_CACHE_MAX_AGE_MS
  ) {
    removeDashboardCache();
    return null;
  }

  return {
    user,
    store,
    lastSyncedAt: new Date(syncedAt).toISOString(),
  };
}

function writeDashboardCache(snapshot: DashboardSnapshot) {
  const record: DashboardCacheRecord = {
    version: 1,
    userId: snapshot.user.id,
    user: snapshot.user,
    store: snapshot.store,
    lastSyncedAt: snapshot.lastSyncedAt,
  };

  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('Unable to save the dashboard cache.', error);
  }
}

function isFreshDashboardSnapshot(snapshot: DashboardSnapshot) {
  const syncedAt = Date.parse(snapshot.lastSyncedAt);
  return Number.isFinite(syncedAt) &&
    syncedAt <= Date.now() &&
    Date.now() - syncedAt <= DASHBOARD_CACHE_MAX_AGE_MS;
}

const DashboardContext = createContext<{
  store: StoreData;
  user: UserData;
  loading: boolean;
  setUser: (user: UserData) => void;
}>({ store: null, user: null, loading: true, setUser: () => {} });

export const useDashboard = () => useContext(DashboardContext);

function DashboardStatus({
  mode,
  lastSyncedAt,
  retrying,
  onRetry,
}: {
  mode: 'online' | 'offline' | 'unavailable';
  lastSyncedAt: string | null;
  retrying: boolean;
  onRetry: () => void;
}) {
  const { C } = useTheme();
  if (mode === 'online') return null;

  const message = mode === 'offline'
    ? lastSyncedAt
      ? "Connection temporarily unavailable. You're viewing your last synchronized dashboard information. Changes cannot currently be saved."
      : 'Connection temporarily unavailable. No verified dashboard snapshot is available for this account.'
    : 'Dashboard information could not be verified. Changes are disabled until the backend can confirm your account.';

  return (
    <div role="status" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      padding: '12px 16px',
      marginBottom: 20,
      borderRadius: 10,
      border: `1px solid ${mode === 'offline' ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`,
      background: mode === 'offline' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
    }}>
      <div>
        <p style={{ color: C.text, fontSize: 13, lineHeight: 1.5 }}>{message}</p>
        {mode === 'offline' && lastSyncedAt && (
          <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
            Offline · read-only · Last synchronized {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        style={{
          flexShrink: 0,
          border: 'none',
          borderRadius: 8,
          padding: '8px 12px',
          background: C.purple,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          cursor: retrying ? 'wait' : 'pointer',
          opacity: retrying ? 0.7 : 1,
        }}
      >
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}

function DashboardUnavailable({ mode }: { mode: 'offline' | 'unavailable' }) {
  const { C } = useTheme();
  return (
    <section style={{
      maxWidth: 560,
      margin: '48px auto',
      padding: 24,
      borderRadius: 14,
      border: `1px solid ${C.sidebarBorder}`,
      background: C.sidebar,
      textAlign: 'center',
    }}>
      <h1 style={{ color: C.text, fontSize: 20, marginBottom: 8 }}>
        {mode === 'offline' ? 'Dashboard snapshot unavailable' : 'Dashboard could not be verified'}
      </h1>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
        {mode === 'offline'
          ? 'There is no recent verified dashboard information saved for this account. Retry when your connection is available.'
          : 'Your dashboard data is hidden until the backend can confirm your account. No changes are enabled.'}
      </p>
    </section>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
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
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Account',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round"/>
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
            <svg width="20" height="26" viewBox="0 0 130 170" fill="none">
              <path d="M12,0 L12,160" stroke="white" strokeWidth="28" strokeLinecap="round"/>
              <path d="M14,80 L100,12" stroke="white" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="92,-2 118,20 92,28" fill="#00C77A" stroke="#00C77A" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M14,80 L100,152" stroke="white" strokeWidth="28" strokeLinecap="round"/>
              <circle cx="86" cy="156" r="4.5" fill="white" opacity="0.55"/>
              <circle cx="100" cy="156" r="4.5" fill="white" opacity="0.55"/>
              <circle cx="114" cy="156" r="4.5" fill="white" opacity="0.55"/>
            </svg>
          </div>
          <span style={{ color: C.purple, fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
            ormerce
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
              <svg width="18" height="24" viewBox="0 0 130 170" fill="none">
                <path d="M12,0 L12,160" stroke="white" strokeWidth="28" strokeLinecap="round"/>
                <path d="M14,80 L100,12" stroke="white" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/>
                <polygon points="92,-2 118,20 92,28" fill="#00C77A" stroke="#00C77A" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M14,80 L100,152" stroke="white" strokeWidth="28" strokeLinecap="round"/>
                <circle cx="86" cy="156" r="4.5" fill="white" opacity="0.55"/>
                <circle cx="100" cy="156" r="4.5" fill="white" opacity="0.55"/>
                <circle cx="114" cy="156" r="4.5" fill="white" opacity="0.55"/>
              </svg>
            </div>
            <span style={{ color: C.purple, fontWeight: 800, fontSize: 16 }}>ormerce</span>
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
            KORMERCE CLOUD • v2.4.0
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
          <svg width="16" height="22" viewBox="0 0 130 170" fill="none">
            <path d="M12,0 L12,160" stroke="white" strokeWidth="28" strokeLinecap="round"/>
            <path d="M14,80 L100,12" stroke="white" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="92,-2 118,20 92,28" fill="#00C77A" stroke="#00C77A" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M14,80 L100,152" stroke="white" strokeWidth="28" strokeLinecap="round"/>
            <circle cx="86" cy="156" r="4.5" fill="white" opacity="0.55"/>
            <circle cx="100" cy="156" r="4.5" fill="white" opacity="0.55"/>
            <circle cx="114" cy="156" r="4.5" fill="white" opacity="0.55"/>
          </svg>
        </div>
        <span style={{ color: C.purple, fontWeight: 800, fontSize: 15 }}>ormerce</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle />
        {/* Avatar */}
        <Link href="/settings" style={{
          width: 30, height: 30, borderRadius: '50%',
          background: C.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative', cursor: 'pointer',
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
        </Link>
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
      <Link href="/settings" style={{
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
      </Link>
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
  const [mode, setMode] = useState<'loading' | 'online' | 'offline' | 'unavailable'>('loading');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(false);
  const lastVerifiedSnapshot = useRef<DashboardSnapshot | null>(null);
  const dashboardLoadGeneration = useRef(0);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setDashboardActive(true);
    const handleConnectionLoss = () => {
      let subject: string | null = null;
      try {
        const token = localStorage.getItem('access_token');
        subject = token ? getTokenSubject(token) : null;
      } catch (error) {
        console.error('Unable to select the dashboard cache after a connection loss.', error);
      }

      const cachedSnapshot = readDashboardCache(subject);
      const inMemorySnapshot = isSnapshotForSubject(lastVerifiedSnapshot.current, subject) &&
        isFreshDashboardSnapshot(lastVerifiedSnapshot.current)
        ? lastVerifiedSnapshot.current
        : null;
      const snapshot = cachedSnapshot ?? inMemorySnapshot;
      if (snapshot) {
        setUser(snapshot.user);
        setStore(snapshot.store);
        setLastSyncedAt(snapshot.lastSyncedAt);
      } else {
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
      }
      setMode('offline');
    };

    window.addEventListener('kormmerce:dashboard-offline', handleConnectionLoss);
    return () => {
      window.removeEventListener('kormmerce:dashboard-offline', handleConnectionLoss);
      setDashboardActive(false);
    };
  }, []);

  const loadDashboard = useCallback(async (isRetry = false) => {
    const loadGeneration = ++dashboardLoadGeneration.current;
    if (isRetry) setRetrying(true);
    let tokenAtLoad: string | null = null;
    let subject: string | null = null;
    let cachedSnapshot: DashboardSnapshot | null = null;
    let authenticatedUser: NonNullable<UserData> | null = null;
    let storeRequestStarted = false;
    const isCurrentAccount = () => {
      if (!tokenAtLoad || !subject) return false;
      try {
        const currentToken = localStorage.getItem('access_token');
        if (currentToken === tokenAtLoad) return true;
        if (currentToken && getTokenSubject(currentToken) === subject) {
          tokenAtLoad = currentToken;
          return true;
        }
      } catch (error) {
        console.error('Unable to verify the current dashboard account.', error);
      }
      return false;
    };

    try {
      tokenAtLoad = localStorage.getItem('access_token');
      if (!tokenAtLoad) {
        setDashboardOfflineMode(false);
        router.push('/');
        return;
      }

      subject = getTokenSubject(tokenAtLoad);
      cachedSnapshot = readDashboardCache(subject);
      const userResponse = await api.get('/api/auth/me', { timeout: 10000 });
      if (
        loadGeneration !== dashboardLoadGeneration.current ||
        !subject ||
        !isCurrentAccount()
      ) {
        if (loadGeneration === dashboardLoadGeneration.current) {
          lastVerifiedSnapshot.current = null;
          setDashboardOfflineMode(true);
          setUser(null);
          setStore(null);
          setLastSyncedAt(null);
          setMode('unavailable');
        }
        return;
      }

      authenticatedUser = normalizeDashboardUser(userResponse.data);
      if (!authenticatedUser) {
        setDashboardOfflineMode(true);
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
        setMode('unavailable');
        return;
      }

      storeRequestStarted = true;
      const storeResponse = await api.get('/api/store/me', { timeout: 10000 });
      if (
        loadGeneration !== dashboardLoadGeneration.current ||
        !subject ||
        !isCurrentAccount()
      ) {
        if (loadGeneration === dashboardLoadGeneration.current) {
          lastVerifiedSnapshot.current = null;
          setDashboardOfflineMode(true);
          setUser(null);
          setStore(null);
          setLastSyncedAt(null);
          setMode('unavailable');
        }
        return;
      }

      const storeData = normalizeDashboardStore(storeResponse.data);
      if (!storeData || storeData.user_id !== authenticatedUser.id) {
        setDashboardOfflineMode(true);
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
        setMode('unavailable');
        return;
      }

      if (
        loadGeneration !== dashboardLoadGeneration.current ||
        !subject ||
        authenticatedUser.id !== subject ||
        !isCurrentAccount()
      ) {
        if (loadGeneration === dashboardLoadGeneration.current) {
          lastVerifiedSnapshot.current = null;
          setDashboardOfflineMode(true);
          setUser(null);
          setStore(null);
          setLastSyncedAt(null);
          setMode('unavailable');
        }
        return;
      }

      const snapshot: DashboardSnapshot = {
        user: authenticatedUser,
        store: storeData,
        lastSyncedAt: new Date().toISOString(),
      };
      lastVerifiedSnapshot.current = snapshot;
      if (isSnapshotForSubject(snapshot, subject)) writeDashboardCache(snapshot);

      setDashboardOfflineMode(false);
      setUser(snapshot.user);
      setStore(snapshot.store);
      setLastSyncedAt(snapshot.lastSyncedAt);
      setMode('online');
    } catch (error) {
      if (loadGeneration !== dashboardLoadGeneration.current) return;

      if (
        !isCurrentAccount()
      ) {
        lastVerifiedSnapshot.current = null;
        setDashboardOfflineMode(true);
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
        setMode('unavailable');
        return;
      }

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      if (status === 401) {
        setDashboardOfflineMode(false);
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
        router.push('/');
        return;
      }

      if (status === 404 && authenticatedUser && storeRequestStarted) {
        setDashboardOfflineMode(false);
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
        router.push('/onboarding');
        return;
      }

      const isTransientFailure = axios.isAxiosError(error) &&
        (!error.response || (status !== undefined && status >= 500));
      setDashboardOfflineMode(true);

      if (isTransientFailure) {
        const inMemorySnapshot = isSnapshotForSubject(lastVerifiedSnapshot.current, subject) &&
          isFreshDashboardSnapshot(lastVerifiedSnapshot.current)
          ? lastVerifiedSnapshot.current
          : null;
        const snapshot = isSnapshotForSubject(cachedSnapshot, subject)
          ? cachedSnapshot
          : inMemorySnapshot;
        if (snapshot) {
          setUser(snapshot.user);
          setStore(snapshot.store);
          setLastSyncedAt(snapshot.lastSyncedAt);
        } else {
          setUser(null);
          setStore(null);
          setLastSyncedAt(null);
        }
        setMode('offline');
      } else {
        setUser(null);
        setStore(null);
        setLastSyncedAt(null);
        setMode('unavailable');
      }
    } finally {
      if (loadGeneration === dashboardLoadGeneration.current) {
        setLoading(false);
        setRetrying(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const handleAccountChange = (event: StorageEvent) => {
      if (event.key !== 'access_token') return;

      lastVerifiedSnapshot.current = null;
      setUser(null);
      setStore(null);
      setLastSyncedAt(null);
      setMode('unavailable');
      if (event.newValue) {
        void loadDashboard();
      } else {
        setDashboardOfflineMode(false);
        router.push('/');
      }
    };

    window.addEventListener('storage', handleAccountChange);
    return () => window.removeEventListener('storage', handleAccountChange);
  }, [loadDashboard, router]);

  function handleLogout() {
    setDashboardOfflineMode(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/signed-out');
  }

  function retryDashboard() {
    void loadDashboard(true);
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

      <DashboardContext.Provider value={{ store, user, loading, setUser }}>
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
              <DashboardStatus
                mode={mode === 'loading' ? 'unavailable' : mode}
                lastSyncedAt={lastSyncedAt}
                retrying={retrying}
                onRetry={retryDashboard}
              />
              {mode === 'unavailable' || (mode === 'offline' && (!user || !store))
                ? <DashboardUnavailable mode={mode === 'offline' ? 'offline' : 'unavailable'} />
                : children}
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
                <DashboardStatus
                  mode={mode === 'loading' ? 'unavailable' : mode}
                  lastSyncedAt={lastSyncedAt}
                  retrying={retrying}
                  onRetry={retryDashboard}
                />
                {mode === 'unavailable' || (mode === 'offline' && (!user || !store))
                  ? <DashboardUnavailable mode={mode === 'offline' ? 'offline' : 'unavailable'} />
                  : children}
              </main>
              <footer style={{
                borderTop: `1px solid ${C.sidebarBorder}`,
                padding: '12px 32px',
                textAlign: 'center',
              }}>
                <p style={{ color: C.muted, fontSize: 12 }}>© 2026 Kormerce • Premium Seller Tools</p>
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