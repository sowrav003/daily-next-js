import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saleSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                include: {
                    product: true,
                    user: { select: { id: true, name: true, email: true, role: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.sale.count(),
        ]);

        return NextResponse.json({
            success: true,
            data: sales,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Sales GET error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = saleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { productId, quantity, unitPrice } = validation.data;

        // Check stock availability
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }
        if (product.stockQty < quantity) {
            return NextResponse.json(
                { success: false, error: `Insufficient stock. Available: ${product.stockQty}` },
                { status: 400 }
            );
        }

        // Create sale and update stock in transaction
        const [sale] = await prisma.$transaction([
            prisma.sale.create({
                data: {
                    productId,
                    userId: user.id,
                    quantity,
                    unitPrice,
                    total: quantity * unitPrice,
                },
                include: { product: true, user: { select: { id: true, name: true, email: true, role: true } } },
            }),
            prisma.product.update({
                where: { id: productId },
                data: { stockQty: { decrement: quantity } },
            }),
            prisma.stockLog.create({
                data: {
                    productId,
                    type: "OUT",
                    quantity,
                    reason: "Product sold",
                },
            }),
        ]);

        return NextResponse.json({ success: true, data: sale }, { status: 201 });
    } catch (error) {
        console.error("Sales POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
