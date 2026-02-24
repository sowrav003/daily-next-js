"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, X, Truck, Globe, Mail, Phone } from "lucide-react";

interface Supplier {
    id: string;
    name: string;
    email: string;
    phone: string;
    apiBaseUrl: string | null;
    createdAt: string;
    _count: { products: number; purchaseOrders: number };
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", email: "", phone: "", apiBaseUrl: "" });

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
            const json = await res.json();
            if (json.success) setSuppliers(json.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    useEffect(() => {
        const timer = setTimeout(() => fetchSuppliers(), 300);
        return () => clearTimeout(timer);
    }, [search, fetchSuppliers]);

    const openCreate = () => {
        setEditingSupplier(null);
        setForm({ name: "", email: "", phone: "", apiBaseUrl: "" });
        setError("");
        setShowModal(true);
    };

    const openEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setForm({ name: supplier.name, email: supplier.email, phone: supplier.phone, apiBaseUrl: supplier.apiBaseUrl || "" });
        setError("");
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
            const method = editingSupplier ? "PUT" : "POST";
            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!json.success) { setError(json.error); return; }
            setShowModal(false);
            fetchSuppliers();
        } catch { setError("Network error"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this supplier?")) return;
        try {
            await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
            fetchSuppliers();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Suppliers</h1>
                    <p className="text-sm text-slate-400 mt-1">{suppliers.length} suppliers registered</p>
                </div>
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Supplier
                </button>
            </div>

            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" className="input-field pl-10" placeholder="Search suppliers..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(3)].map((_, i) => <div key={i} className="loading-skeleton h-[200px]" />)}
                </div>
            ) : suppliers.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No suppliers found</p>
                    <button onClick={openCreate} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Add Supplier</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="glass-card glass-card-hover p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                        <Truck className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{supplier.name}</h3>
                                        <p className="text-xs text-slate-500">{supplier._count.products} products</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(supplier)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{supplier.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{supplier.phone}</span>
                                </div>
                                {supplier.apiBaseUrl && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                                        <span className="truncate text-xs font-mono">{supplier.apiBaseUrl}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
                                <span>{supplier._count.purchaseOrders} orders</span>
                                {supplier.apiBaseUrl ? (
                                    <span className="status-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">API Connected</span>
                                ) : (
                                    <span className="status-badge bg-slate-500/10 text-slate-400 border border-slate-500/20">No API</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">
                                {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="input-label">Supplier Name</label>
                                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Email</label>
                                    <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="input-label">Phone</label>
                                    <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">API Base URL (optional)</label>
                                <input className="input-field" placeholder="https://api.supplier.com/v1" value={form.apiBaseUrl} onChange={(e) => setForm({ ...form, apiBaseUrl: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingSupplier ? "Update" : "Create"} Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
