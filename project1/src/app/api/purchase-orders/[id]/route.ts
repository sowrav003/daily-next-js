import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                items: { include: { product: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        console.error("Purchase Order GET error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { status } = await request.json();

        if (!["PENDING", "APPROVED", "RECEIVED", "CANCELLED"].includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: { include: { product: true } } },
        });

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        // If marking as RECEIVED, update stock for all items
        if (status === "RECEIVED" && order.status !== "RECEIVED") {
            for (const item of order.items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stockQty: { increment: item.quantity } },
                });

                await prisma.stockLog.create({
                    data: {
                        productId: item.productId,
                        type: "IN",
                        quantity: item.quantity,
                        reason: `Purchase Order ${order.orderNumber} received`,
                    },
                });
            }
        }

        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id },
            data: { status },
            include: {
                supplier: true,
                user: { select: { id: true, name: true, email: true, role: true } },
                items: { include: { product: true } },
            },
        });

        return NextResponse.json({ success: true, data: updatedOrder });
    } catch (error) {
        console.error("Purchase Order PATCH error:", error);
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
        await prisma.purchaseOrder.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Order deleted" });
    } catch (error) {
        console.error("Purchase Order DELETE error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
