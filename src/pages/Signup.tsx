import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { User, Mail, Lock, ShieldQuestion, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const API_URL = "https://diary.onrender.com";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "What is your favorite book?",
    securityAnswer: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return minLength && hasUpper && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!validatePassword(formData.password)) {
      return setError("Password must be 8+ chars, include uppercase, number, and special symbol");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      navigate("/login", {
        state: { message: "Account created! Please login." },
      });

    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Cannot connect to server. Please try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass rounded-3xl p-8"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">
          Create Account
        </h2>

        <p className="text-slate-500 mb-8">
          Join us to start your digital diary journey.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            required
            placeholder="Full Name"
            className="w-full border rounded-xl p-3"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <input
            type="email"
            required
            placeholder="Email"
            className="w-full border rounded-xl p-3"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Password"
            className="w-full border rounded-xl p-3"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Confirm Password"
            className="w-full border rounded-xl p-3"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
          />

          <select
            className="w-full border rounded-xl p-3"
            value={formData.securityQuestion}
            onChange={(e) =>
              setFormData({
                ...formData,
                securityQuestion: e.target.value,
              })
            }
          >
            <option>What is your favorite book?</option>
            <option>What was your first pet's name?</option>
            <option>In what city were you born?</option>
            <option>What is your mother's maiden name?</option>
          </select>

          <input
            type="text"
            required
            placeholder="Security Answer"
            className="w-full border rounded-xl p-3"
            value={formData.securityAnswer}
            onChange={(e) =>
              setFormData({
                ...formData,
                securityAnswer: e.target.value,
              })
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-bold">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}