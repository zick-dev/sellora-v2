/**
 * app/(auth)/login/page.tsx
 * ──────────────────────────
 * Login page matching Visily Screen 1.
 *
 * Features:
 * - Continue with Google button
 * - Email + password form
 * - Forgot password link
 * - Redirect to signup if no account
 * - Shows loading states and error messages
 */

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/auth";
import { Eye, EyeOff, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login, googleAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Welcome back!");
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
  setGoogleLoading(true);
  setError('');
  try {
    const result = await googleAuth(response.access_token);
    toast.success('Welcome to Sellora!');
     // Small delay to ensure token is saved to localStorage
    window.location.href = '/dashboard';
    
    // Smart redirect based on user state
    if (result.has_store) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
  } catch {
    setError('Google sign-in failed — try again');
    setGoogleLoading(false);
  }
},
    onError: () => {
      setError("Google sign-in failed — try again");
      setGoogleLoading(false);
    },
    scope: "openid email profile",
  });

  return (
    <div
      style={{ minHeight: "100vh", background: "#0a0a0f" }}
      className="flex flex-col items-center justify-center px-5 py-10"
    >
      {/* Logo + Heading */}
      <div className="flex flex-col items-center mb-8">
        <div
          style={{
            width: 64,
            height: 64,
            background: "#7c3aed",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
          }}
        >
          <Zap size={30} color="white" fill="white" />
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "white",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#9ca3af",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Sign in to manage your WhatsApp &{" "}
          <br />
          Instagram store
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#12121a",
          borderRadius: 20,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#f87171",
              fontSize: 14,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Google Button */}
        <button
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading || loading}
          style={{
            width: "100%",
            background: "white",
            border: "none",
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            cursor: "pointer",
            marginBottom: 20,
            opacity: googleLoading || loading ? 0.6 : 1,
          }}
        >
          {googleLoading ? (
            <>
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid #d1d5db",
                  borderTopColor: "#7c3aed",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Opening Google...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* OR Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>

          {/* Email Field */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                }}
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@store.com"
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "13px 16px 13px 42px",
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(124,58,237,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{ fontSize: 12, color: "#7c3aed", fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                }}
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "13px 44px 13px 42px",
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(124,58,237,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword
                  ? <EyeOff size={16} />
                  : <Eye size={16} />
                }
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || googleLoading || !email || !password}
            style={{
              width: "100%",
              background: loading || googleLoading || !email || !password
                ? "rgba(124,58,237,0.4)"
                : "#7c3aed",
              border: "none",
              borderRadius: 12,
              padding: "14px 20px",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Signing in...
              </>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 24 }}>
        Don't have an account?{" "}
        <Link
          href="/signup"
          style={{ color: "#7c3aed", fontWeight: 600 }}
        >
          Sign up free
        </Link>
      </p>
      <p style={{ color: "#374151", fontSize: 11, marginTop: 12 }}>
        🔒 SECURED BY SELLORA CLOUD AUTH
      </p>
      <p style={{ color: "#1f2937", fontSize: 11, marginTop: 4 }}>
        © 2024 Sellora • Premium Seller Tools
      </p>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}