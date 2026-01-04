import React, { useState } from "react";
import { registerUser } from "../lib/auth";
import { useAuth } from "../AuthContext";

export default function Register({ onSwitchToLogin }) {
    const { checkUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "employee",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await registerUser(formData);
            await checkUser();
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
            console.error("Register Error:", err);
            if (err.code === 429) {
                setError("Too many attempts. Please wait 15-60 minutes.");
            } else {
                setError(err.message || "Registration failed. Please try again.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-6 bg-[#0f1117]">
            {/* Dynamic Background Elements matching Login */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-md p-8 sm:p-12 rounded-[2.5rem] 
                bg-white/5 backdrop-blur-3xl border border-white/10 
                shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-white">

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Create Account
                    </h2>
                    <p className="text-white/40 text-sm font-medium italic">Join our finance management team</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 text-xs font-bold uppercase tracking-widest text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] ml-1">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 
                            text-white placeholder-white/20 outline-none
                            focus:border-pink-500/50 focus:bg-white/[0.08] transition-all duration-300 font-medium"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] ml-1">Work Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 
                            text-white placeholder-white/20 outline-none
                            focus:border-pink-500/50 focus:bg-white/[0.08] transition-all duration-300 font-medium"
                            placeholder="email@company.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] ml-1">Set Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 
                            text-white placeholder-white/20 outline-none
                            focus:border-pink-500/50 focus:bg-white/[0.08] transition-all duration-300 font-medium"
                            placeholder="Min. 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r 
                        from-pink-600 to-purple-600 hover:shadow-xl hover:shadow-pink-500/20 hover:-translate-y-0.5
                        active:translate-y-0 active:shadow-none transition-all duration-300 
                        text-white font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                    >
                        {loading ? "CREATING PROFILE..." : "GET STARTED"}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/40 text-xs font-medium">
                        Already have access?{" "}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-pink-400 hover:text-pink-300 font-bold transition-colors underline decoration-pink-400/30 underline-offset-4"
                        >
                            Sign In
                        </button>
                    </p>
                </div>

                <p className="text-center text-white/10 text-[9px] uppercase font-black tracking-[0.3em] mt-8">
                    Secure Registration — {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
