
import React, { useState } from "react";
import { registerUser } from "../lib/auth";
import { useAuth } from "../AuthContext";

export default function Register({ onSwitchToLogin }) {
    const { login, checkUser } = useAuth(); // Get checkUser from context
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "employee", // Default
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
            // registerUser ALREADY creates a session (see lib/auth.js)
            await registerUser(formData);

            // Just refresh the auth context state to reflect the new session
            await checkUser();

            // Wait for state to fully propagate
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
            console.error("Register Error:", err);
            if (err.code === 429) {
                setError("Too many attempts. Please wait 15-60 minutes before trying again.");
            } else {
                setError(err.message || "Registration failed. Please try again.");
            }
            setLoading(false); // Only set loading to false on error
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden p-6"
            style={{
                background:
                    "radial-gradient(circle at top right, #2a2f45 0%, #1a1f2b 40%, #13151b 100%)",
            }}
        >
            {/* Background blobs matching Login.jsx */}
            <div className="absolute top-10 right-20 w-72 h-72 bg-pink-600/30 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-20 left-32 w-96 h-96 bg-blue-500/20 blur-[150px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-md p-8 rounded-3xl 
        bg-white/10 backdrop-blur-xl border border-white/20 
        shadow-2xl text-white">

                <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
                <p className="text-center text-white/70 mb-8">Join the finance team</p>

                {error && (
                    <div className="mb-6 p-4 text-red-300 bg-red-500/20 rounded-xl text-center border border-red-500/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-5">

                    <div>
                        <label className="text-white/80 text-sm ml-1">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 outline-none mt-1 focus:ring-2 focus:ring-pink-400 transition"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="text-white/80 text-sm ml-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 outline-none mt-1 focus:ring-2 focus:ring-pink-400 transition"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="text-white/80 text-sm ml-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 outline-none mt-1 focus:ring-2 focus:ring-pink-400 transition"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>


                    {/* Role is hardcoded to 'employee' for security - Admins must be created manually in database */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 p-4 rounded-xl bg-gradient-to-r 
            from-pink-600 to-purple-600 hover:opacity-90 
            transition text-white font-bold shadow-lg text-lg"
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-white/60 text-sm">
                        Already have an account?{" "}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-pink-300 hover:text-pink-200 font-semibold underline decoration-2 underline-offset-4"
                        >
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
