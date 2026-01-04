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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-6 bg-[#0f1117]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-pink-500/5 blur-[100px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-12 rounded-[2.5rem] 
        bg-white/5 backdrop-blur-3xl border border-white/10 
        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-white">

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Welcome Back
          </h2>
          <p className="text-white/40 text-sm font-medium italic">Enter your credentials to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-8 p-4 text-xs font-bold uppercase tracking-widest text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] ml-1">Account Email</label>
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 
                text-white placeholder-white/20 outline-none
                focus:border-purple-500/50 focus:bg-white/[0.08] transition-all duration-300 font-medium"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] ml-1">Security Password</label>
            <div className="relative group">
              <input
                type="password"
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 
                text-white placeholder-white/20 outline-none
                focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-300 font-medium"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r 
            from-purple-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5
            active:translate-y-0 active:shadow-none transition-all duration-300 
            text-white font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-white/40 text-xs font-medium">
            New to the platform?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline decoration-blue-400/30 underline-offset-4"
            >
              Request Access
            </button>
          </p>
        </div>

        <p className="text-center text-white/10 text-[9px] uppercase font-black tracking-[0.3em] mt-8">
          Secure Terminal — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
