import React, { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate inputs
    if (!username.trim()) {
      setError("Username tidak boleh kosong");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password tidak boleh kosong");
      setLoading(false);
      return;
    }

    // Simulate login (replace with actual API call)
    setTimeout(() => {
      // Simple demo: accept any non-empty username/password
      if (username && password) {
        // Store login info if remember me is checked
        if (rememberMe) {
          localStorage.setItem("username", username);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("username");
          localStorage.removeItem("rememberMe");
        }

        // Store auth token
        localStorage.setItem("authToken", "token_" + Date.now());
        localStorage.setItem("loginTime", new Date().toISOString());

        // Redirect to dashboard
        window.location.href = "/";
      } else {
        setError("Username atau password salah");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #161b22",
        borderRadius: 16,
        padding: "40px 32px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#f9fafb",
            marginBottom: 8,
          }}
        >
          Prediksi Restok Obat
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>
          Sistem Manajemen Inventaris Obat Klinik
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#7f1d1d",
              border: "1px solid #dc2626",
              color: "#fecaca",
              padding: "12px 14px",
              borderRadius: 20,
              fontSize: 14,
              borderLeft: "4px solid #dc2626",
            }}
          >
            {error}
          </div>
        )}

        {/* Username Field */}
        <div style={{ display: "grid", gap: 6 }}>
          <label
            htmlFor="username"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#d1d5db",
            }}
          >
            Username / Email
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username atau email"
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#e5e7eb",
              padding: "12px 14px",
              borderRadius: 8,
              fontSize: 14,
              transition: "all 0.3s ease",
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0369a1";
              e.target.style.boxShadow = "0 0 0 3px rgba(3, 105, 161, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#30363d";
              e.target.style.boxShadow = "none";
            }}
            disabled={loading}
          />
        </div>

        {/* Password Field */}
        <div style={{ display: "grid", gap: 6 }}>
          <label
            htmlFor="password"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#d1d5db",
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#e5e7eb",
              padding: "12px 14px",
              borderRadius: 8,
              fontSize: 14,
              transition: "all 0.3s ease",
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0369a1";
              e.target.style.boxShadow = "0 0 0 3px rgba(3, 105, 161, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#30363d";
              e.target.style.boxShadow = "none";
            }}
            disabled={loading}
          />
        </div>

        {/* Remember Me */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              cursor: "pointer",
              accentColor: "#0369a1",
            }}
            disabled={loading}
          />
          <label
            htmlFor="rememberMe"
            style={{
              fontSize: 14,
              color: "#9ca3af",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Ingat saya
          </label>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading
              ? "#064e3b"
              : "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "#ecfeff",
            border: "none",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background =
                "linear-gradient(135deg, #0284c7, #0369a1)";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 20px rgba(3, 105, 161, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background =
                "linear-gradient(135deg, #0ea5e9, #0284c7)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }
          }}
        >
          {loading && (
            <div
              style={{
                width: 16,
                height: 16,
                border: "2px solid #ecfeff",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          )}
          {loading ? "Memproses..." : "Masuk"}
        </button>

        {/* Demo Info */}
        <div
          style={{
            background: "#164e63",
            border: "1px solid #155e75",
            color: "#a5f3fc",
            padding: "12px 14px",
            borderRadius: 8,
            fontSize: 12,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          <p style={{ margin: 0, marginBottom: 6, fontWeight: 500 }}>
            Mode Demo - Silakan masuk dengan data apapun
          </p>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>
            Username dan password apa saja akan diterima
          </p>
        </div>
      </form>

      {/* Footer */}
      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid #30363d",
          textAlign: "center",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <p style={{ margin: 0 }}>
          © 2026 Sistem Prediksi Restok Obat - Klinik
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
