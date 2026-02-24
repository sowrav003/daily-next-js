import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const supplierId = searchParams.get("supplierId") || "";
        const lowStock = searchParams.get("lowStock") === "true";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }
        if (category) where.category = category;
        if (supplierId) where.supplierId = supplierId;
        if (lowStock) {
            where.stockQty = { lt: 10 }; // Will be refined with raw query for minStockLevel
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { supplier: true },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Products GET error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = productSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingProduct = await prisma.product.findUnique({
            where: { sku: validation.data.sku },
        });

        if (existingProduct) {
            return NextResponse.json(
                { success: false, error: "SKU already exists" },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: {
                ...validation.data,
                supplierId: validation.data.supplierId || null,
            },
            include: { supplier: true },
        });

        // Log initial stock
        if (product.stockQty > 0) {
            await prisma.stockLog.create({
                data: {
                    productId: product.id,
                    type: "IN",
                    quantity: product.stockQty,
                    reason: "Initial stock on product creation",
                },
            });
        }

        return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (error) {
        console.error("Products POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
