/**
 * app/(auth)/signup/page.tsx
 * ───────────────────────────
 * Signup page matching Visily Screen 5.
 *
 * Features:
 * - Continue with Google button
 * - Full name, email, password form
 * - Terms of service links
 * - Redirects to onboarding after signup
 */

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/auth";
import { Eye, EyeOff, Zap } from "lucide-react";
import IconBackground from "@/components/IconBackground";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const { signup, googleAuth } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup(name, email, password);
      toast.success("Account created! Let's set up your store.");
      window.location.href = '/onboarding';
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (response) => {
  setGoogleLoading(true);
  setError('');
  try {
    const result = await googleAuth(response.access_token);
    toast.success('Welcome to Kormerce!');
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

  const inputStyle = {
    width: "100%",
    background: "#1a1a2e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "13px 16px 13px 42px",
    color: "white",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 8,
  };

  const iconStyle = {
    position: "absolute" as const,
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6b7280",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(79,70,229,0.6)";
    e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#0a0a0f", position: "relative", overflow: "hidden" }}

      className="flex flex-col items-center justify-center px-5 py-10"
    >
      <IconBackground opacity={0.05} color="#6366F1" />
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 24 }}>
        <Link
          href="/login"
          style={{
            color: "#6b7280",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 24,
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#4F46E5",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={18} color="white" fill="white" />
          </div>
          <span
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Create Account
          </span>
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "white",
            marginTop: 8,
            marginBottom: 6,
          }}
        >
          Get Started
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.5 }}>
          Join thousands of sellers growing on WhatsApp & Instagram
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
              color: "#f87171",
              fontSize: 14,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Google Button */}
        <button
          onClick={() => handleGoogleSignup()}
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
            marginBottom: 6,
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
                  borderTopColor: "#4F46E5",
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
        <p style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginBottom: 20 }}>
          We'll never post anything without your permission
        </p>

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
          <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>
            OR CONTINUE WITH EMAIL
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSignup}>

          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Full Name</label>
            <div style={{ position: "relative" }}>
              <svg style={iconStyle} width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address</label>
            <div style={{ position: "relative" }}>
              <svg style={iconStyle} width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <svg style={iconStyle} width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={8}
                autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
            By creating an account, you agree to our{" "}
            <Link href="/terms" style={{ color: "#4F46E5" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#4F46E5" }}>Privacy Policy</Link>.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || googleLoading || !name || !email || !password}
            style={{
              width: "100%",
              background: loading || googleLoading || !name || !email || !password
                ? "rgba(79,70,229,0.4)"
                : "#4F46E5",
              border: "none",
              borderRadius: 12,
              padding: "14px 20px",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !name || !email || !password ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
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
                Creating account...
              </>
            ) : (
              "Create My Account →"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 24 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#4F46E5", fontWeight: 600 }}>
          Sign In
        </Link>
      </p>
      <p style={{ color: "#1f2937", fontSize: 11, marginTop: 12 }}>
        © 2024 Kormerce • Premium Seller Tools
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}