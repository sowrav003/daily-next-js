import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

export const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    price: z.number().positive("Price must be positive"),
    costPrice: z.number().positive("Cost price must be positive"),
    stockQty: z.number().int().min(0, "Stock quantity cannot be negative"),
    minStockLevel: z.number().int().min(0).default(10),
    currency: z.string().default("USD"),
    supplierId: z.string().optional(),
});

export const supplierSchema = z.object({
    name: z.string().min(1, "Supplier name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    apiBaseUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const purchaseOrderSchema = z.object({
    supplierId: z.string().min(1, "Supplier is required"),
    notes: z.string().optional(),
    items: z
        .array(
            z.object({
                productId: z.string().min(1, "Product is required"),
                quantity: z.number().int().positive("Quantity must be positive"),
                unitPrice: z.number().positive("Unit price must be positive"),
            })
        )
        .min(1, "At least one item is required"),
});

export const saleSchema = z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.number().int().positive("Quantity must be positive"),
    unitPrice: z.number().positive("Unit price must be positive"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
