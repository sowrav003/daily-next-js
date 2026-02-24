"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, DollarSign, ShoppingBag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface Sale {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    createdAt: string;
    product: { id: string; name: string; sku: string; price: number; stockQty: number };
    user: { name: string };
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stockQty: number;
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ productId: "", quantity: 1, unitPrice: 0 });

    const fetchSales = useCallback(async () => {
        try {
            const res = await fetch("/api/sales?limit=100");
            const json = await res.json();
            if (json.success) setSales(json.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchSales();
        fetch("/api/products?limit=200").then(r => r.json()).then(d => d.success && setProducts(d.data));
    }, [fetchSales]);

    const handleProductSelect = (productId: string) => {
        const product = products.find(p => p.id === productId);
        setForm({ ...form, productId, unitPrice: product?.price || 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    quantity: Number(form.quantity),
                    unitPrice: Number(form.unitPrice),
                }),
            });
            const json = await res.json();
            if (!json.success) { setError(json.error); return; }
            setShowModal(false);
            setForm({ productId: "", quantity: 1, unitPrice: 0 });
            fetchSales();
            // Refresh products for updated stock
            fetch("/api/products?limit=200").then(r => r.json()).then(d => d.success && setProducts(d.data));
        } catch { setError("Network error"); }
    };

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
    const selectedProduct = products.find(p => p.id === form.productId);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sales</h1>
                    <p className="text-sm text-slate-400 mt-1">{sales.length} transactions recorded</p>
                </div>
                <button onClick={() => { setShowModal(true); setError(""); }} className="btn-primary">
                    <Plus className="w-4 h-4" /> Record Sale
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-card stat-card stat-card-success p-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Revenue</p>
                </div>
                <div className="glass-card stat-card stat-card-accent p-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                        <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{sales.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Transactions</p>
                </div>
                <div className="glass-card stat-card stat-card-warning p-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                        <ShoppingBag className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{totalUnits}</p>
                    <p className="text-xs text-slate-500 mt-1">Units Sold</p>
                </div>
            </div>

            {/* Sales Table */}
            {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="loading-skeleton h-16" />)}</div>
            ) : sales.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No sales recorded yet</p>
                    <button onClick={() => { setShowModal(true); setError(""); }} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Record First Sale</button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                                <th>Sold By</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <span className="font-medium text-white">{sale.product.name}</span>
                                        </div>
                                    </td>
                                    <td><code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{sale.product.sku}</code></td>
                                    <td>{sale.quantity}</td>
                                    <td>{formatCurrency(sale.unitPrice)}</td>
                                    <td className="font-semibold text-emerald-400">{formatCurrency(sale.total)}</td>
                                    <td className="text-slate-400">{sale.user.name}</td>
                                    <td className="text-slate-500 text-sm">{formatDate(sale.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Record Sale</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4"><p className="text-sm text-red-400">{error}</p></div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="input-label">Product</label>
                                <select className="input-field" value={form.productId} onChange={(e) => handleProductSelect(e.target.value)} required>
                                    <option value="">Select product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.sku}) — Stock: {p.stockQty}
                                        </option>
                                    ))}
                                </select>
                                {selectedProduct && (
                                    <p className="text-xs text-slate-500 mt-1">Available stock: {selectedProduct.stockQty} units</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Quantity</label>
                                    <input type="number" min="1" max={selectedProduct?.stockQty} className="input-field"
                                        value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required />
                                </div>
                                <div>
                                    <label className="input-label">Unit Price</label>
                                    <input type="number" step="0.01" className="input-field"
                                        value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} required />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <p className="text-sm text-slate-400">Total: <span className="text-xl font-bold text-emerald-400">{formatCurrency(Number(form.quantity) * Number(form.unitPrice))}</span></p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Record Sale</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
