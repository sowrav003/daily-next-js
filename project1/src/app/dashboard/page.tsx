"use client";

import { useState, useEffect } from "react";
import {
    Package, DollarSign, AlertTriangle, TrendingUp,
    Truck, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { formatCurrency } from "@/lib/currency";

interface DashboardData {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    totalSales: number;
    totalRevenue: number;
    totalSuppliers: number;
    recentSales: Array<{
        id: string;
        quantity: number;
        total: number;
        createdAt: string;
        product: { name: string; sku: string };
        user: { name: string };
    }>;
    lowStockProducts: Array<{
        id: string;
        name: string;
        sku: string;
        stockQty: number;
        minStockLevel: number;
        supplier: { name: string } | null;
    }>;
    monthlySales: Array<{ month: string; total: number; count: number }>;
    categoryDistribution: Array<{ category: string; count: number; value: number }>;
    syncStatus: { total: number; synced: number; failed: number };
}

const PIE_COLORS = ["#6366f1", "#a78bfa", "#818cf8", "#c084fc", "#4f46e5", "#7c3aed", "#8b5cf6"];

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/dashboard");
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            await fetchDashboard();
        } catch (err) {
            console.error("Sync error:", err);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="loading-skeleton h-[130px]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="loading-skeleton h-[350px]" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return <p className="text-slate-400">Failed to load dashboard</p>;

    const statCards = [
        {
            icon: Package,
            label: "Total Products",
            value: data.totalProducts,
            sub: `${data.lowStockCount} low stock`,
            trend: data.lowStockCount > 0 ? "warning" : "up",
            variant: "stat-card-accent",
        },
        {
            icon: DollarSign,
            label: "Stock Value",
            value: formatCurrency(data.totalStockValue),
            sub: "Total inventory",
            trend: "up",
            variant: "stat-card-success",
        },
        {
            icon: TrendingUp,
            label: "Total Revenue",
            value: formatCurrency(data.totalRevenue),
            sub: `${data.totalSales} sales`,
            trend: "up",
            variant: "stat-card-accent",
        },
        {
            icon: AlertTriangle,
            label: "Low Stock Alerts",
            value: data.lowStockCount,
            sub: "Need attention",
            trend: data.lowStockCount > 0 ? "down" : "up",
            variant: data.lowStockCount > 0 ? "stat-card-danger" : "stat-card-success",
        },
    ];

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-sm text-slate-400 mt-1">Real-time inventory analytics & insights</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-primary"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync Suppliers"}
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card, i) => (
                    <div key={i} className={`glass-card stat-card ${card.variant} p-5`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <card.icon className="w-5 h-5 text-slate-300" />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-medium ${card.trend === "up" ? "text-emerald-400" :
                                card.trend === "warning" ? "text-amber-400" : "text-red-400"
                                }`}>
                                {card.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {card.trend === "up" ? "+2.5%" : card.trend === "warning" ? "Caution" : "-1.2%"}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Sales Trend</h3>
                    <p className="text-xs text-slate-500 mb-4">Monthly revenue overview</p>
                    <div className="h-[280px]">
                        {data.monthlySales.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[...data.monthlySales].reverse()}>
                                    <defs>
                                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#0f172a",
                                            border: "1px solid #1e293b",
                                            borderRadius: "10px",
                                            fontSize: "13px",
                                            color: "#e2e8f0",
                                        }}
                                        formatter={((value: number) => [formatCurrency(value), "Revenue"]) as never}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#salesGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                No sales data yet. Create some sales to see trends.
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Categories</h3>
                    <p className="text-xs text-slate-500 mb-4">Product distribution</p>
                    <div className="h-[200px]">
                        {data.categoryDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.categoryDistribution}
                                        dataKey="count"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        strokeWidth={0}
                                    >
                                        {data.categoryDistribution.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "#0f172a",
                                            border: "1px solid #1e293b",
                                            borderRadius: "10px",
                                            fontSize: "13px",
                                            color: "#e2e8f0",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>
                        )}
                    </div>
                    <div className="space-y-2 mt-2">
                        {data.categoryDistribution.slice(0, 4).map((cat, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-slate-300">{cat.category}</span>
                                </div>
                                <span className="text-slate-500">{cat.count} items</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Alerts */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Low Stock Alerts</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Products needing restock</p>
                        </div>
                        <span className={`status-badge ${data.lowStockCount > 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                            {data.lowStockCount} alerts
                        </span>
                    </div>
                    {data.lowStockProducts.length > 0 ? (
                        <div className="space-y-3">
                            {data.lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-800/40">
                                    <div>
                                        <p className="text-sm font-medium text-white">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.sku} • {product.supplier?.name || "No supplier"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${product.stockQty === 0 ? "text-red-400" : "text-amber-400"}`}>
                                            {product.stockQty} / {product.minStockLevel}
                                        </p>
                                        <p className="text-xs text-slate-500">qty / min</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-sm text-slate-500">
                            ✅ All products are well-stocked
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Recent Sales</h3>
                    <p className="text-xs text-slate-500 mb-4">Latest transactions</p>
                    {data.recentSales.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentSales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-800/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <DollarSign className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{sale.product.name}</p>
                                            <p className="text-xs text-slate-500">{sale.quantity} units • {sale.user.name}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(sale.total)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-sm text-slate-500">
                            No sales recorded yet
                        </div>
                    )}
                </div>
            </div>

            {/* Supplier Sync Status */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Supplier Sync Status</h3>
                        <p className="text-xs text-slate-500 mt-0.5">API integration health</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{data.totalSuppliers} suppliers</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800/40 text-center">
                        <p className="text-2xl font-bold text-white">{data.syncStatus.total}</p>
                        <p className="text-xs text-slate-500 mt-1">Total Products</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{data.syncStatus.synced}</p>
                        <p className="text-xs text-slate-500 mt-1">API Linked</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                        <p className="text-2xl font-bold text-red-400">{data.syncStatus.failed}</p>
                        <p className="text-xs text-slate-500 mt-1">Sync Failures</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
