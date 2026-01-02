import React, { useState } from "react";
import { useAuth } from "../AuthContext";

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      // No need to redirect manually or call onLoginSuccess, 
      // AuthContext update will trigger App.jsx re-render
    } catch (err) {
      console.error(err);
      if (err.code === 429) {
        setError("Too many attempts. Please wait 15-60 minutes.");
      } else if (err.code === 401) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-6"
      style={{
        background:
          "radial-gradient(circle at top left, #2a2f45 0%, #1a1f2b 40%, #13151b 100%)",
      }}
    >
      <div className="absolute top-10 left-20 w-72 h-72 bg-purple-600/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-20 right-32 w-96 h-96 bg-blue-500/20 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl 
        bg-white/10 backdrop-blur-xl border border-white/20 
        shadow-2xl text-white">

        <h2 className="text-4xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-center text-white/70 mb-8">Login to continue</p>

        {error && (
          <div className="mb-4 p-3 text-red-300 bg-red-500/20 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          <div>
            <label className="text-white/80 ml-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 
              text-white placeholder-white/60 outline-none mt-1
              focus:ring-2 focus:ring-purple-400 transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-white/80 ml-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 rounded-xl bg-white/20 border border-white/30 
              text-white placeholder-white/60 outline-none mt-1
              focus:ring-2 focus:ring-blue-400 transition"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 p-3 rounded-xl bg-gradient-to-r 
            from-purple-600 to-blue-600 hover:opacity-90 
            transition text-white font-semibold shadow-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-white/60 text-sm mt-6">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-300 hover:text-blue-200 font-semibold underline decoration-2 underline-offset-4"
          >
            Register here
          </button>
        </p>

        <p className="text-center text-white/40 text-xs mt-8">
          © {new Date().getFullYear()} Finance App — All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
