import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Use backend URL (Render) from env
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  //  Extract token automatically from URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    if (!token) {
      setMessage("Missing token — please use the link provided.");
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to reset password");
      } else {
        setMessage("✅ Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900">Reset Password</h1>
        <p className="text-center text-gray-600 mt-2">
          Set a new password for your ReviseHub account.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/*  Token field auto-filled from URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reset Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste-your-token"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!token || submitting} // disables if token from URL
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm hover:opacity-95 transition disabled:opacity-60"
          >
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <p className="text-sm text-gray-700 mt-4 text-center break-words" role="alert">
            {message}
          </p>
        )}

        <p className="text-sm text-gray-600 text-center mt-6">
          Back to{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
