"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, ShoppingCart, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { getOrderStatusStyle, formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface PurchaseOrder {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    notes: string | null;
    supplier: { id: string; name: string };
    user: { name: string };
    items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        product: { name: string; sku: string };
    }>;
    createdAt: string;
}

interface Supplier { id: string; name: string; }
interface Product { id: string; name: string; sku: string; costPrice: number; }

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ supplierId: "", notes: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] });

    const fetchOrders = useCallback(async () => {
        try {
            const url = `/api/purchase-orders${statusFilter ? `?status=${statusFilter}` : ""}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) setOrders(json.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => {
        fetchOrders();
        fetch("/api/suppliers").then(r => r.json()).then(d => d.success && setSuppliers(d.data));
        fetch("/api/products?limit=200").then(r => r.json()).then(d => d.success && setProducts(d.data));
    }, [fetchOrders]);

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { productId: "", quantity: 1, unitPrice: 0 }] });
    };

    const removeItem = (index: number) => {
        if (form.items.length <= 1) return;
        setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const items = [...form.items];
        items[index] = { ...items[index], [field]: value };
        if (field === "productId") {
            const product = products.find(p => p.id === value);
            if (product) items[index].unitPrice = product.costPrice;
        }
        setForm({ ...form, items });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const payload = {
            ...form,
            items: form.items.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
            })),
        };
        try {
            const res = await fetch("/api/purchase-orders", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!json.success) { setError(json.error); return; }
            setShowModal(false);
            setForm({ supplierId: "", notes: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] });
            fetchOrders();
        } catch { setError("Network error"); }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch(`/api/purchase-orders/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
            });
            fetchOrders();
        } catch (err) { console.error(err); }
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case "PENDING": return <Clock className="w-3.5 h-3.5" />;
            case "APPROVED": return <CheckCircle className="w-3.5 h-3.5" />;
            case "RECEIVED": return <Truck className="w-3.5 h-3.5" />;
            case "CANCELLED": return <XCircle className="w-3.5 h-3.5" />;
            default: return null;
        }
    };

    const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
                    <p className="text-sm text-slate-400 mt-1">{orders.length} orders</p>
                </div>
                <button onClick={() => { setShowModal(true); setError(""); }} className="btn-primary">
                    <Plus className="w-4 h-4" /> New Order
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex gap-2 flex-wrap">
                {["", "PENDING", "APPROVED", "RECEIVED", "CANCELLED"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:bg-slate-800/50"
                            }`}>
                        {s || "All"}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="loading-skeleton h-32" />)}</div>
            ) : orders.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No purchase orders found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const statusStyle = getOrderStatusStyle(order.status);
                        return (
                            <div key={order.id} className="glass-card p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-white">{order.orderNumber}</h3>
                                                <span className={`status-badge ${statusStyle.bg} ${statusStyle.color} border ${statusStyle.border}`}>
                                                    {statusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {order.supplier.name} • {formatDate(order.createdAt)} • by {order.user.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-white">{formatCurrency(order.totalAmount)}</span>
                                        {order.status === "PENDING" && (
                                            <div className="flex gap-2">
                                                <button onClick={() => updateStatus(order.id, "APPROVED")} className="btn-primary text-xs py-1.5 px-3">Approve</button>
                                                <button onClick={() => updateStatus(order.id, "CANCELLED")} className="btn-danger text-xs py-1.5 px-3">Cancel</button>
                                            </div>
                                        )}
                                        {order.status === "APPROVED" && (
                                            <button onClick={() => updateStatus(order.id, "RECEIVED")} className="btn-primary text-xs py-1.5 px-3">Mark Received</button>
                                        )}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="bg-slate-800/20 rounded-lg border border-slate-800/40 overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-xs text-slate-500">
                                                <th className="text-left p-3">Product</th>
                                                <th className="text-left p-3">SKU</th>
                                                <th className="text-right p-3">Qty</th>
                                                <th className="text-right p-3">Unit Price</th>
                                                <th className="text-right p-3">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item) => (
                                                <tr key={item.id} className="border-t border-slate-800/30 text-sm">
                                                    <td className="p-3 text-white">{item.product.name}</td>
                                                    <td className="p-3"><code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{item.product.sku}</code></td>
                                                    <td className="p-3 text-right text-slate-300">{item.quantity}</td>
                                                    <td className="p-3 text-right text-slate-400">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="p-3 text-right font-medium text-white">{formatCurrency(item.totalPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {order.notes && (
                                    <p className="mt-3 text-xs text-slate-500 italic">Note: {order.notes}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Order Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Create Purchase Order</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4"><p className="text-sm text-red-400">{error}</p></div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="input-label">Supplier</label>
                                <select className="input-field" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
                                    <option value="">Select supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="input-label mb-0">Order Items</label>
                                    <button type="button" onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ Add Item</button>
                                </div>
                                <div className="space-y-3">
                                    {form.items.map((item, i) => (
                                        <div key={i} className="flex gap-3 items-end p-3 rounded-lg bg-slate-800/20 border border-slate-800/30">
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-500 mb-1 block">Product</label>
                                                <select className="input-field text-sm" value={item.productId} onChange={(e) => updateItem(i, "productId", e.target.value)} required>
                                                    <option value="">Select product</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                                </select>
                                            </div>
                                            <div className="w-20">
                                                <label className="text-xs text-slate-500 mb-1 block">Qty</label>
                                                <input type="number" min="1" className="input-field text-sm" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} required />
                                            </div>
                                            <div className="w-28">
                                                <label className="text-xs text-slate-500 mb-1 block">Unit Price</label>
                                                <input type="number" step="0.01" className="input-field text-sm" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} required />
                                            </div>
                                            <button type="button" onClick={() => removeItem(i)} className="text-slate-500 hover:text-red-400 p-2" disabled={form.items.length <= 1}>
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Notes (optional)</label>
                                <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Order notes..." />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                                <p className="text-sm text-slate-400">Total: <span className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</span></p>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary">Create Order</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
