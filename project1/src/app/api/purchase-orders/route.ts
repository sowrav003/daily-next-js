import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { purchaseOrderSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "";
        const supplierId = searchParams.get("supplierId") || "";

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (supplierId) where.supplierId = supplierId;

        const orders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error("Purchase Orders GET error:", error);
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
        const validation = purchaseOrderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { supplierId, notes, items } = validation.data;
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        const order = await prisma.purchaseOrder.create({
            data: {
                orderNumber: generateOrderNumber(),
                supplierId,
                createdBy: user.id,
                notes,
                totalAmount,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                supplier: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                items: { include: { product: true } },
            },
        });

        return NextResponse.json({ success: true, data: order }, { status: 201 });
    } catch (error) {
        console.error("Purchase Orders POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
