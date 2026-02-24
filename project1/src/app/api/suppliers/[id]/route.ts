import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { supplierSchema } from "@/lib/validations";

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
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                products: true,
                purchaseOrders: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 },
                _count: { select: { products: true, purchaseOrders: true } },
            },
        });

        if (!supplier) {
            return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: supplier });
    } catch (error) {
        console.error("Supplier GET error:", error);
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
        const validation = supplierSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                ...validation.data,
                apiBaseUrl: validation.data.apiBaseUrl || null,
            },
        });

        return NextResponse.json({ success: true, data: supplier });
    } catch (error) {
        console.error("Supplier PUT error:", error);
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
        await prisma.supplier.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Supplier deleted" });
    } catch (error) {
        console.error("Supplier DELETE error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
