"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "STAFF" as "ADMIN" | "STAFF",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: isLogin ? "login" : "register",
                    ...form,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Something went wrong");
                return;
            }

            router.push("/dashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex">
            {/* Ambient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[120px]" />
            </div>

            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
                <div className="max-w-md">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
                        <Package className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">InventoryERP</h1>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                        Enterprise inventory management with real-time supplier integration,
                        automated stock alerts, and comprehensive analytics.
                    </p>
                    <div className="space-y-4">
                        {[
                            "Real-time supplier price syncing",
                            "Automated low-stock email alerts",
                            "Role-based access control",
                            "Multi-currency support",
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300">
                                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                </div>
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-2">Demo Credentials</p>
                        <p className="text-sm text-slate-300 font-mono">Admin: admin@erp.com / admin123</p>
                        <p className="text-sm text-slate-300 font-mono">Staff: staff@erp.com / staff123</p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="glass-card p-8">
                        <div className="text-center mb-8">
                            <div className="lg:hidden w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">
                                {isLogin ? "Welcome back" : "Create account"}
                            </h2>
                            <p className="text-sm text-slate-400 mt-2">
                                {isLogin ? "Sign in to your dashboard" : "Get started with InventoryERP"}
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required={!isLogin}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="input-label">Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-field pr-10"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {!isLogin && (
                                <div>
                                    <label className="input-label">Role</label>
                                    <select
                                        className="input-field"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })}
                                    >
                                        <option value="STAFF">Staff</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full justify-center py-3"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? "Sign In" : "Create Account"}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                                className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
