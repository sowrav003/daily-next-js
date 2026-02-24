"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, Shield, BarChart3, Truck, Zap, Globe } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`min-h-screen bg-[#030712] transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-cyan-600/3 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">InventoryERP</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/login")}
            className="btn-secondary"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Real-time Supplier API Integration
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="text-white">Smart Inventory</span>
            <br />
            <span className="gradient-text">Management System</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage products, suppliers, and purchase orders with automated price syncing,
            low-stock alerts, and real-time analytics. Built for scale.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="btn-primary text-lg px-8 py-3"
            >
              Launch Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {[
            { icon: Package, title: "Product & Stock", desc: "Full CRUD with SKU, barcode, categories, and real-time stock tracking across all channels.", color: "from-indigo-500 to-blue-600" },
            { icon: Truck, title: "Supplier Management", desc: "Store supplier profiles with API endpoints for automated price and availability syncing.", color: "from-emerald-500 to-teal-600" },
            { icon: BarChart3, title: "Sales Analytics", desc: "Visual dashboards with sales trends, inventory valuation, and supplier performance metrics.", color: "from-amber-500 to-orange-600" },
            { icon: Shield, title: "Role-Based Access", desc: "Secure RBAC with Admin and Staff roles. JWT authentication with encrypted sessions.", color: "from-rose-500 to-pink-600" },
            { icon: Globe, title: "Currency Exchange", desc: "Real-time currency conversion for international suppliers using live exchange rates.", color: "from-cyan-500 to-blue-600" },
            { icon: Zap, title: "Auto Sync", desc: "Background jobs for periodic supplier price sync and automated low-stock email alerts.", color: "from-violet-500 to-purple-600" },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card glass-card-hover p-7 group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 text-center text-sm text-slate-500">
        <p>&copy; 2026 InventoryERP. Production-ready inventory management.</p>
      </footer>
    </div>
  );
}
