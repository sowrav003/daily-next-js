import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all dashboard metrics in parallel
        const [
            totalProducts,
            totalSuppliers,
            totalSalesCount,
            salesAggregate,
            lowStockProducts,
            recentSales,
            monthlySalesRaw,
            categoryStats,
            productsWithSupplierApi,
        ] = await Promise.all([
            prisma.product.count(),
            prisma.supplier.count(),
            prisma.sale.count(),
            prisma.sale.aggregate({ _sum: { total: true } }),
            prisma.product.findMany({
                where: { stockQty: { lt: 10 } },
                include: { supplier: true },
                orderBy: { stockQty: "asc" },
                take: 10,
            }),
            prisma.sale.findMany({
                include: {
                    product: true,
                    user: { select: { id: true, name: true, email: true, role: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
            prisma.$queryRaw<Array<{ month: string; total: number; count: bigint }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
               SUM(total)::float as total,
               COUNT(*)::bigint as count
        FROM "Sale"
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,
            prisma.$queryRaw<Array<{ category: string; count: bigint; value: number }>>`
        SELECT category,
               COUNT(*)::bigint as count,
               SUM(price * "stockQty")::float as value
        FROM "Product"
        GROUP BY category
        ORDER BY value DESC
      `,
            prisma.product.count({
                where: { supplier: { apiBaseUrl: { not: null } } },
            }),
        ]);

        // Calculate total stock value
        const stockValueResult = await prisma.$queryRaw<Array<{ value: number }>>`
      SELECT COALESCE(SUM(price * "stockQty"), 0)::float as value FROM "Product"
    `;

        const monthlySales = monthlySalesRaw.map((m) => ({
            month: m.month,
            total: m.total || 0,
            count: Number(m.count),
        }));

        const categoryDistribution = categoryStats.map((c) => ({
            category: c.category,
            count: Number(c.count),
            value: c.value || 0,
        }));

        return NextResponse.json({
            success: true,
            data: {
                totalProducts,
                totalStockValue: stockValueResult[0]?.value || 0,
                lowStockCount: lowStockProducts.length,
                totalSales: totalSalesCount,
                totalRevenue: salesAggregate._sum.total || 0,
                totalSuppliers,
                recentSales,
                lowStockProducts,
                monthlySales,
                categoryDistribution,
                syncStatus: {
                    total: totalProducts,
                    synced: productsWithSupplierApi,
                    failed: 0,
                },
            },
        });
    } catch (error) {
        console.error("Dashboard GET error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
