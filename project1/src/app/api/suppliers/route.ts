import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { supplierSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const suppliers = await prisma.supplier.findMany({
            where,
            include: {
                _count: { select: { products: true, purchaseOrders: true } },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ success: true, data: suppliers });
    } catch (error) {
        console.error("Suppliers GET error:", error);
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
        const validation = supplierSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const supplier = await prisma.supplier.create({
            data: {
                ...validation.data,
                apiBaseUrl: validation.data.apiBaseUrl || null,
            },
        });

        return NextResponse.json({ success: true, data: supplier }, { status: 201 });
    } catch (error) {
        console.error("Suppliers POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
