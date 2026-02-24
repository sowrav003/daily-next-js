import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface LowStockEmailData {
    productName: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    supplierName: string;
    supplierEmail: string;
}

export async function sendLowStockAlert(data: LowStockEmailData) {
    try {
        const { error } = await resend.emails.send({
            from: process.env.ALERT_EMAIL_FROM || "alerts@inventory-erp.com",
            to: process.env.ALERT_EMAIL_TO || "admin@inventory-erp.com",
            subject: `⚠️ Low Stock Alert: ${data.productName} (${data.sku})`,
            html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 24px; color: white;">⚠️ Low Stock Alert</h1>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">Product</td>
                <td style="padding: 12px 0; font-weight: 600; border-bottom: 1px solid #1e293b;">${data.productName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">SKU</td>
                <td style="padding: 12px 0; font-weight: 600; border-bottom: 1px solid #1e293b;">${data.sku}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">Current Stock</td>
                <td style="padding: 12px 0; font-weight: 600; color: #ef4444; border-bottom: 1px solid #1e293b;">${data.currentStock} units</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">Min. Level</td>
                <td style="padding: 12px 0; font-weight: 600; border-bottom: 1px solid #1e293b;">${data.minStockLevel} units</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">Supplier</td>
                <td style="padding: 12px 0; font-weight: 600; border-bottom: 1px solid #1e293b;">${data.supplierName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8;">Supplier Email</td>
                <td style="padding: 12px 0; font-weight: 600;">${data.supplierEmail}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #1e293b; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #94a3b8;">Action Required: Please create a purchase order to restock this item.</p>
            </div>
          </div>
        </div>
      `,
        });

        if (error) {
            console.error("Failed to send low stock alert:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Email service error:", error);
        return { success: false, error };
    }
}

export async function checkAndSendLowStockAlerts() {
    const { default: prisma } = await import("./prisma");

    const lowStockProducts = await prisma.product.findMany({
        where: {
            stockQty: { lt: prisma.product.fields.minStockLevel ? 10 : 10 },
        },
        include: { supplier: true },
    });

    // Raw query to get products where stockQty < minStockLevel
    const products = await prisma.$queryRaw<
        Array<{
            id: string;
            name: string;
            sku: string;
            stockQty: number;
            minStockLevel: number;
            supplierName: string | null;
            supplierEmail: string | null;
        }>
    >`
    SELECT p.id, p.name, p.sku, p."stockQty", p."minStockLevel",
           s.name as "supplierName", s.email as "supplierEmail"
    FROM "Product" p
    LEFT JOIN "Supplier" s ON p."supplierId" = s.id
    WHERE p."stockQty" < p."minStockLevel"
  `;

    const results = [];
    for (const product of products) {
        const result = await sendLowStockAlert({
            productName: product.name,
            sku: product.sku,
            currentStock: product.stockQty,
            minStockLevel: product.minStockLevel,
            supplierName: product.supplierName || "No supplier",
            supplierEmail: product.supplierEmail || "N/A",
        });
        results.push({ productId: product.id, ...result });
    }

    return results;
}
