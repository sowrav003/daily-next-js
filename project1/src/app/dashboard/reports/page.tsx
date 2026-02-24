"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, RefreshCw, TrendingUp, DollarSign, Package, AlertTriangle } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/currency";

interface DashboardData {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    totalSales: number;
    totalRevenue: number;
    totalSuppliers: number;
    monthlySales: Array<{ month: string; total: number; count: number }>;
    categoryDistribution: Array<{ category: string; count: number; value: number }>;
    lowStockProducts: Array<{
        id: string; name: string; sku: string; stockQty: number; minStockLevel: number;
        supplier: { name: string } | null;
    }>;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function ReportsPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
    const [targetCurrency, setTargetCurrency] = useState("USD");

    useEffect(() => {
        fetchData();
        fetchRates();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/dashboard");
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchRates = async () => {
        try {
            const res = await fetch("/api/currency", { method: "POST" });
            const json = await res.json();
            if (json.success) setExchangeRates(json.data.rates);
        } catch (err) { console.error(err); }
    };

    const convertedValue = (amount: number) => {
        if (!exchangeRates || targetCurrency === "USD") return amount;
        return amount * (exchangeRates[targetCurrency] || 1);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="loading-skeleton h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="loading-skeleton h-[300px]" />)}
                </div>
            </div>
        );
    }

    if (!data) return <p className="text-slate-400">Failed to load reports</p>;

    const stockValueByCategory = data.categoryDistribution.map(c => ({
        ...c,
        value: Math.round(convertedValue(c.value) * 100) / 100,
    }));

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                    <p className="text-sm text-slate-400 mt-1">Comprehensive business insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        className="input-field w-28 text-sm"
                        value={targetCurrency}
                        onChange={(e) => setTargetCurrency(e.target.value)}
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                        <option value="INR">INR</option>
                        <option value="CAD">CAD</option>
                    </select>
                    <button onClick={fetchData} className="btn-secondary">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card stat-card stat-card-accent p-5 text-center">
                    <Package className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.totalProducts}</p>
                    <p className="text-xs text-slate-500">Products</p>
                </div>
                <div className="glass-card stat-card stat-card-success p-5 text-center">
                    <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(convertedValue(data.totalStockValue), targetCurrency)}</p>
                    <p className="text-xs text-slate-500">Stock Value</p>
                </div>
                <div className="glass-card stat-card stat-card-warning p-5 text-center">
                    <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(convertedValue(data.totalRevenue), targetCurrency)}</p>
                    <p className="text-xs text-slate-500">Revenue</p>
                </div>
                <div className="glass-card stat-card stat-card-danger p-5 text-center">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.lowStockCount}</p>
                    <p className="text-xs text-slate-500">Low Stock</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales Bar Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Monthly Sales Revenue</h3>
                    <p className="text-xs text-slate-500 mb-4">Revenue breakdown by month</p>
                    <div className="h-[280px]">
                        {data.monthlySales.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[...data.monthlySales].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "13px", color: "#e2e8f0" }}
                                        formatter={((value: number | string) => [formatCurrency(convertedValue(Number(value)), targetCurrency), "Revenue"]) as never}
                                    />
                                    <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">No sales data</div>}
                    </div>
                </div>

                {/* Sales Count Line Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Sales Volume Trend</h3>
                    <p className="text-xs text-slate-500 mb-4">Number of transactions per month</p>
                    <div className="h-[280px]">
                        {data.monthlySales.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[...data.monthlySales].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "13px", color: "#e2e8f0" }}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>}
                    </div>
                </div>

                {/* Category Value Pie Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Inventory Value by Category</h3>
                    <p className="text-xs text-slate-500 mb-4">Stock value distribution</p>
                    <div className="h-[260px]">
                        {stockValueByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stockValueByCategory} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false} strokeWidth={0}>
                                        {stockValueByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "13px", color: "#e2e8f0" }}
                                        formatter={((value: number | string) => [formatCurrency(Number(value), targetCurrency), "Value"]) as never} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>}
                    </div>
                </div>

                {/* Low Stock Table */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Low Stock Report</h3>
                    <p className="text-xs text-slate-500 mb-4">Products below minimum threshold</p>
                    {data.lowStockProducts.length > 0 ? (
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                            {data.lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-800/40">
                                    <div>
                                        <p className="text-sm font-medium text-white">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.sku} • {product.supplier?.name || "No supplier"}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${product.stockQty === 0 ? "bg-red-500" : "bg-amber-500"}`}
                                                    style={{ width: `${Math.min((product.stockQty / product.minStockLevel) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${product.stockQty === 0 ? "text-red-400" : "text-amber-400"}`}>
                                                {product.stockQty}/{product.minStockLevel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-sm text-slate-500">✅ All products are well-stocked</div>
                    )}
                </div>
            </div>

            {/* Exchange Rates */}
            {exchangeRates && (
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Live Exchange Rates</h3>
                    <p className="text-xs text-slate-500 mb-4">Base: USD — Rates used for currency conversion</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {["EUR", "GBP", "JPY", "CAD", "AUD", "INR", "CNY"].map((curr) => (
                            <div key={curr} className={`p-3 rounded-lg text-center border transition-colors ${targetCurrency === curr ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-800/20 border-slate-800/40"
                                }`}>
                                <p className="text-xs text-slate-500">{curr}</p>
                                <p className="text-sm font-bold text-white mt-1">{exchangeRates[curr]?.toFixed(4) || "N/A"}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
