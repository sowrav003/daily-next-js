import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                supplier: true,
                priceHistory: { orderBy: { createdAt: "desc" }, take: 20 },
                stockLogs: { orderBy: { createdAt: "desc" }, take: 20 },
            },
        });

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error("Product GET error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validation = productSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingProduct = await prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        // Log price change
        if (existingProduct.costPrice !== validation.data.costPrice) {
            await prisma.priceHistory.create({
                data: {
                    productId: id,
                    oldPrice: existingProduct.costPrice,
                    newPrice: validation.data.costPrice,
                    source: "MANUAL",
                },
            });
        }

        // Log stock change
        if (existingProduct.stockQty !== validation.data.stockQty) {
            const diff = validation.data.stockQty - existingProduct.stockQty;
            await prisma.stockLog.create({
                data: {
                    productId: id,
                    type: diff > 0 ? "IN" : "OUT",
                    quantity: Math.abs(diff),
                    reason: "Manual stock adjustment",
                },
            });
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...validation.data,
                supplierId: validation.data.supplierId || null,
            },
            include: { supplier: true },
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error("Product PUT error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Delete related records first
        await prisma.priceHistory.deleteMany({ where: { productId: id } });
        await prisma.stockLog.deleteMany({ where: { productId: id } });
        await prisma.sale.deleteMany({ where: { productId: id } });
        await prisma.purchaseOrderItem.deleteMany({ where: { productId: id } });

        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error("Product DELETE error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
