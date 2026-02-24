export interface User {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF";
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null;
    category: string;
    price: number;
    costPrice: number;
    stockQty: number;
    minStockLevel: number;
    currency: string;
    supplierId?: string | null;
    supplier?: Supplier | null;
    createdAt: string;
    updatedAt: string;
}

export interface Supplier {
    id: string;
    name: string;
    email: string;
    phone: string;
    apiBaseUrl?: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        products: number;
    };
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    status: "PENDING" | "APPROVED" | "RECEIVED" | "CANCELLED";
    totalAmount: number;
    notes?: string | null;
    createdBy: string;
    supplier: Supplier;
    user: User;
    items: PurchaseOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: Product;
}

export interface Sale {
    id: string;
    productId: string;
    userId: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: Product;
    user: User;
    createdAt: string;
}

export interface StockLog {
    id: string;
    productId: string;
    type: "IN" | "OUT" | "ADJUSTMENT";
    quantity: number;
    reason: string;
    product: Product;
    createdAt: string;
}

export interface PriceHistory {
    id: string;
    productId: string;
    oldPrice: number;
    newPrice: number;
    source: "MANUAL" | "SUPPLIER_SYNC";
    product: Product;
    createdAt: string;
}

export interface DashboardStats {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    totalSales: number;
    totalRevenue: number;
    totalSuppliers: number;
    recentSales: Sale[];
    lowStockProducts: Product[];
    monthlySales: { month: string; total: number; count: number }[];
    categoryDistribution: { category: string; count: number; value: number }[];
    syncStatus: { total: number; synced: number; failed: number };
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
