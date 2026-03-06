import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowLeft, LogIn } from "lucide-react";

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("https://diary.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    let data;

try {
  data = await res.json();
} catch {
  throw new Error("Server returned invalid response");
}
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      onLogin(data.user, data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-3xl p-8"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-8">Login to access your personal diary.</p>

        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm mb-6 border border-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" title="Reset Password" className="text-xs font-bold text-indigo-600 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              {loading ? "Logging in..." : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </div>
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
