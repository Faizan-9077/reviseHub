import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerMessage(data.message || "Failed to send reset link");
      } else {
        setServerMessage(
          data.message || "If that email exists, reset instructions were sent"
        );
        if (import.meta.env.DEV) {
          setPreviewUrl(data.previewUrl || "");
          setDevLink(data.devResetLink || "");
        }
      }
    } catch (err) {
      setServerMessage("Something went wrong");
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h1>
        <p className="text-center text-gray-600 mt-2">Enter your email to receive a reset link.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm hover:opacity-95 transition disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {serverMessage && (
          <div className="mt-4 text-center space-y-2" role="alert">
            <p className="text-sm text-gray-700 break-words">{serverMessage}</p>
            {import.meta.env.DEV && previewUrl && (
              <p className="text-xs text-gray-500 break-words">
                Email preview (dev):{" "}
                <a className="text-blue-600 underline" href={previewUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              </p>
            )}
            {import.meta.env.DEV && devLink && (
              <p className="text-xs text-gray-500 break-words">
                Direct reset link (dev):{" "}
                <a className="text-blue-600 underline" href={devLink}>
                  Open
                </a>
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 text-center mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
