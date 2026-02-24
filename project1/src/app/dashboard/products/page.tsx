"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, RefreshCw, X, Package } from "lucide-react";
import { getStockStatus, formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface Product {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    category: string;
    price: number;
    costPrice: number;
    stockQty: number;
    minStockLevel: number;
    currency: string;
    supplierId: string | null;
    supplier: { id: string; name: string } | null;
    createdAt: string;
}

interface Supplier {
    id: string;
    name: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: "", sku: "", barcode: "", category: "", price: 0,
        costPrice: 0, stockQty: 0, minStockLevel: 10, currency: "USD", supplierId: "",
    });

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=100`);
            const json = await res.json();
            if (json.success) setProducts(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch("/api/suppliers");
            const json = await res.json();
            if (json.success) setSuppliers(json.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
    }, [fetchProducts]);

    useEffect(() => {
        const timer = setTimeout(() => fetchProducts(), 300);
        return () => clearTimeout(timer);
    }, [search, fetchProducts]);

    const openCreate = () => {
        setEditingProduct(null);
        setForm({ name: "", sku: "", barcode: "", category: "", price: 0, costPrice: 0, stockQty: 0, minStockLevel: 10, currency: "USD", supplierId: "" });
        setError("");
        setShowModal(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setForm({
            name: product.name, sku: product.sku, barcode: product.barcode || "",
            category: product.category, price: product.price, costPrice: product.costPrice,
            stockQty: product.stockQty, minStockLevel: product.minStockLevel,
            currency: product.currency, supplierId: product.supplierId || "",
        });
        setError("");
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const payload = {
            ...form,
            price: Number(form.price),
            costPrice: Number(form.costPrice),
            stockQty: Number(form.stockQty),
            minStockLevel: Number(form.minStockLevel),
            supplierId: form.supplierId || undefined,
        };

        try {
            const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
            const method = editingProduct ? "PUT" : "POST";
            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!json.success) { setError(json.error); return; }
            setShowModal(false);
            fetchProducts();
        } catch { setError("Network error"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product? This action cannot be undone.")) return;
        try {
            await fetch(`/api/products/${id}`, { method: "DELETE" });
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSync = async (id: string) => {
        setSyncing(id);
        try {
            await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: id }),
            });
            fetchProducts();
        } catch (err) {
            console.error(err);
        } finally {
            setSyncing(null);
        }
    };

    const categories = [...new Set(products.map(p => p.category))];

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Products</h1>
                    <p className="text-sm text-slate-400 mt-1">{products.length} products in inventory</p>
                </div>
                <button onClick={openCreate} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Product
                </button>
            </div>

            {/* Search */}
            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="Search by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="loading-skeleton h-16" />)}
                </div>
            ) : products.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No products found</p>
                    <button onClick={openCreate} className="btn-primary mt-4">
                        <Plus className="w-4 h-4" /> Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Stock</th>
                                <th>Supplier</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const status = getStockStatus(product.stockQty, product.minStockLevel);
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{product.name}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(product.createdAt)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{product.sku}</code></td>
                                        <td><span className="text-sm">{product.category}</span></td>
                                        <td className="font-medium">{formatCurrency(product.price, product.currency)}</td>
                                        <td className="text-slate-400">{formatCurrency(product.costPrice, product.currency)}</td>
                                        <td>
                                            <span className="font-semibold">{product.stockQty}</span>
                                            <span className="text-slate-500 text-xs"> / {product.minStockLevel}</span>
                                        </td>
                                        <td className="text-sm text-slate-400">{product.supplier?.name || "—"}</td>
                                        <td>
                                            <span className={`status-badge ${status.bg} ${status.color} border ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {product.supplierId && (
                                                    <button
                                                        onClick={() => handleSync(product.id)}
                                                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                                                        title="Sync from supplier"
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${syncing === product.id ? "animate-spin" : ""}`} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEdit(product)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">
                                {editingProduct ? "Edit Product" : "Add Product"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Product Name</label>
                                    <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="input-label">SKU</label>
                                    <input className="input-field" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Category</label>
                                    <input className="input-field" list="categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                                    <datalist id="categories">
                                        {categories.map((c) => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="input-label">Barcode</label>
                                    <input className="input-field" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="input-label">Sell Price</label>
                                    <input type="number" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
                                </div>
                                <div>
                                    <label className="input-label">Cost Price</label>
                                    <input type="number" step="0.01" className="input-field" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} required />
                                </div>
                                <div>
                                    <label className="input-label">Currency</label>
                                    <select className="input-field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="JPY">JPY</option>
                                        <option value="INR">INR</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="input-label">Stock Qty</label>
                                    <input type="number" className="input-field" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: parseInt(e.target.value) || 0 })} required />
                                </div>
                                <div>
                                    <label className="input-label">Min Stock Level</label>
                                    <input type="number" className="input-field" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="input-label">Supplier</label>
                                    <select className="input-field" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                                        <option value="">None</option>
                                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingProduct ? "Update Product" : "Create Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
