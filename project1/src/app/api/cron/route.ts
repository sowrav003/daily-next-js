import { NextRequest, NextResponse } from "next/server";
import { syncAllProductsFromSuppliers } from "@/lib/supplier-api";
import { checkAndSendLowStockAlerts } from "@/lib/email";

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Run supplier price sync
        const syncResults = await syncAllProductsFromSuppliers();

        // Check and send low stock alerts
        const alertResults = await checkAndSendLowStockAlerts();

        return NextResponse.json({
            success: true,
            data: {
                syncResults,
                alertResults,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
