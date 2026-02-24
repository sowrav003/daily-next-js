import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncProductFromSupplier, syncAllProductsFromSuppliers } from "@/lib/supplier-api";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await request.json();

        if (productId) {
            // Sync single product
            const result = await syncProductFromSupplier(productId);
            return NextResponse.json({ success: result.success, data: result });
        }

        // Sync all products
        const results = await syncAllProductsFromSuppliers();
        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error("Sync POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
