import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function generateOrderNumber(): string {
    const prefix = "PO";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export function getStockStatus(stockQty: number, minStockLevel: number) {
    if (stockQty === 0) return { label: "Out of Stock", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    if (stockQty <= minStockLevel) return { label: "Low Stock", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "In Stock", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
}

export function getOrderStatusStyle(status: string) {
    switch (status) {
        case "PENDING": return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
        case "APPROVED": return { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
        case "RECEIVED": return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
        case "CANCELLED": return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
        default: return { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
    }
}
