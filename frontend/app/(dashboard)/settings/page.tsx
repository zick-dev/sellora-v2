'use client';
import { useTheme } from '@/lib/theme';

import { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';


export default function SettingsPage() {
  const { C } = useTheme();
  const { user } = useDashboard();
  const { logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>('profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);
  const [profileError, setProfileError]   = useState('');

  // Password form
  const [passwordForm, setPasswordForm] = useState({ current: '', new_password: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved]   = useState(false);
  const [passwordError, setPasswordError]   = useState('');
  const [showPasswords, setShowPasswords]   = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  async function handleProfileSave() {
    if (!profileForm.name.trim()) { setProfileError('Name is required.'); return; }
    setProfileSaving(true);
    setProfileError('');
    try {
      await api.put('/api/auth/me', { name: profileForm.name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  }
  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/api/auth/me');
      logout();
      window.location.href = '/signup';
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

  async function handlePasswordSave() {
    if (!passwordForm.current || !passwordForm.new_password || !passwordForm.confirm) {
      setPasswordError('All fields are required.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    setPasswordError('');
    try {
      await api.put('/api/auth/change-password', {
        current_password: passwordForm.current,
        new_password: passwordForm.new_password,
      });
      setPasswordSaved(true);
      setPasswordForm({ current: '', new_password: '', confirm: '' });
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  const inputBase = {
    width: '100%', background: C.input,
    border: '1.5px solid ' + C.inputBorder,
    borderRadius: 10, padding: '12px 14px',
    color: C.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: C.subtext, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 8,
  };

  const tabs = [
    { key: 'profile',  label: 'Profile',       icon: '👤' },
    { key: 'password', label: 'Password',       icon: '🔒' },
    { key: 'danger',   label: 'Danger Zone',    icon: '⚠️' },
  ];

  return (
    <div style={{ maxWidth: 580, padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Account Settings</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Manage your account details and security</p>
      </div>

      {/* Avatar */}
      <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user?.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div>
          <p style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{user?.name}</p>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>{user?.email}</p>
          <span style={{
            background: user?.auth_provider === 'google' ? 'rgba(66,133,244,0.1)' : 'rgba(124,58,237,0.1)',
            border: user?.auth_provider === 'google' ? '1px solid rgba(66,133,244,0.2)' : '1px solid rgba(124,58,237,0.2)',
            color: user?.auth_provider === 'google' ? '#4285f4' : C.purple,
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
          }}>
            {user?.auth_provider === 'google' ? '🔵 Google Account' : '✉️ Email Account'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.card, borderRadius: 12, padding: 4, border: '1px solid ' + C.cardBorder }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === tab.key ? (tab.key === 'danger' ? C.red : C.purple) : 'transparent', color: activeTab === tab.key ? C.text : C.muted, fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
            <span style={{ marginRight: 4 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Profile Information</h2>
          {profileError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
              {profileError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} style={inputBase} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={profileForm.email} disabled style={{ ...inputBase, opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Email cannot be changed</p>
            </div>
            <button onClick={handleProfileSave} disabled={profileSaving} style={{ width: '100%', padding: '13px 0', background: profileSaving ? 'rgba(124,58,237,0.4)' : C.purple, border: 'none', borderRadius: 10, color: C.text, fontSize: 14, fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer' }}>
              {profileSaving ? 'Saving...' : profileSaved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div style={{ background: C.card, border: '1px solid ' + C.cardBorder, borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Change Password</h2>
          {user?.auth_provider === 'google' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔵</div>
              <p style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Google Account</p>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                You signed in with Google. Password management is handled by Google — you cannot set a password here.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Choose a strong password with at least 8 characters.</p>
              {passwordError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                  {passwordError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input type={showPasswords ? 'text' : 'password'} value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} style={inputBase} />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} style={inputBase} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} style={inputBase} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showPasswords} onChange={e => setShowPasswords(e.target.checked)} />
                  <span style={{ color: C.muted, fontSize: 13 }}>Show passwords</span>
                </label>
                <button onClick={handlePasswordSave} disabled={passwordSaving} style={{ width: '100%', padding: '13px 0', background: passwordSaving ? 'rgba(124,58,237,0.4)' : C.purple, border: 'none', borderRadius: 10, color: C.text, fontSize: 14, fontWeight: 700, cursor: passwordSaving ? 'not-allowed' : 'pointer' }}>
                  {passwordSaving ? 'Updating...' : passwordSaved ? '✓ Password Updated!' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Sign out all devices */}
          <div style={{ background: C.card, border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sign Out</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Sign out of your Sellora account on this device.</p>
            <button
              onClick={() => logout()}
              style={{ padding: '11px 20px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>

          {/* Delete account */}
          <div style={{ background: C.card, border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: C.red, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Delete Account</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Permanently delete your account and all store data. This action cannot be undone.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...labelStyle, color: C.red }}>Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                style={{ ...inputBase, border: '1.5px solid rgba(239,68,68,0.3)' }}
              />
            </div>
            <button
              disabled={deleteConfirm !== 'DELETE'}
              onClick={() => setShowFinalConfirm(true)}
              style={{
                padding: '11px 20px', borderRadius: 10,
                background: deleteConfirm === 'DELETE' ? C.red : 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: deleteConfirm === 'DELETE' ? 'white' : C.red,
                fontSize: 14, fontWeight: 700,
                cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
              }}
            >
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* Final confirmation popup */}
      {showFinalConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => !deleting && setShowFinalConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: C.card, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '32px 28px', maxWidth: 400, width: '100%', zIndex: 1 }}>
            <div style={{ fontSize: 44, marginBottom: 12, textAlign: 'center' }}>⚠️</div>
            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>
              Are you absolutely sure?
            </h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 8, textAlign: 'center' }}>
              This will <strong style={{ color: C.red }}>permanently delete</strong> your account, your store, all products, all orders, and all customer leads.
            </p>
            <p style={{ color: C.red, fontSize: 13, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
              This action cannot be undone.
            </p>
            {deleteError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: C.red, fontSize: 13, marginBottom: 16 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ padding: '13px 0', background: deleting ? 'rgba(239,68,68,0.5)' : C.red, border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {deleting ? (
                  <>
                    <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Deleting everything...
                  </>
                ) : 'Yes, permanently delete my account'}
              </button>
              <button
                onClick={() => setShowFinalConfirm(false)}
                disabled={deleting}
                style={{ padding: '11px 0', background: 'transparent', border: '1px solid ' + C.cardBorder, borderRadius: 10, color: C.muted, fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel, keep my account
              </button>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
