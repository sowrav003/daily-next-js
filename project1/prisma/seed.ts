import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@erp.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@erp.com",
            password: adminPassword,
            role: "ADMIN",
        },
    });

    // Create staff user
    const staffPassword = await bcrypt.hash("staff123", 12);
    const staff = await prisma.user.upsert({
        where: { email: "staff@erp.com" },
        update: {},
        create: {
            name: "Staff User",
            email: "staff@erp.com",
            password: staffPassword,
            role: "STAFF",
        },
    });

    // Create suppliers
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                name: "TechParts Global",
                email: "sales@techparts.com",
                phone: "+1-555-0101",
                apiBaseUrl: "https://api.techparts.com/v1",
            },
        }),
        prisma.supplier.create({
            data: {
                name: "ElectroniX Supply",
                email: "orders@electronix.com",
                phone: "+1-555-0202",
                apiBaseUrl: "https://api.electronix.com/v2",
            },
        }),
        prisma.supplier.create({
            data: {
                name: "Pacific Components",
                email: "info@pacificcomp.com",
                phone: "+1-555-0303",
                apiBaseUrl: null,
            },
        }),
        prisma.supplier.create({
            data: {
                name: "Nordic Hardware",
                email: "supply@nordichw.com",
                phone: "+46-555-0404",
                apiBaseUrl: "https://api.nordichw.com/products",
            },
        }),
    ]);

    // Create products
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: 'LED Monitor 27"',
                sku: "MON-LED-27",
                barcode: "4901234567890",
                category: "Monitors",
                price: 349.99,
                costPrice: 220.0,
                stockQty: 45,
                minStockLevel: 10,
                currency: "USD",
                supplierId: suppliers[0].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "Wireless Keyboard",
                sku: "KB-WL-001",
                barcode: "4901234567891",
                category: "Peripherals",
                price: 79.99,
                costPrice: 35.0,
                stockQty: 120,
                minStockLevel: 20,
                currency: "USD",
                supplierId: suppliers[0].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "USB-C Hub 7-Port",
                sku: "HUB-UC-7P",
                barcode: "4901234567892",
                category: "Accessories",
                price: 49.99,
                costPrice: 18.5,
                stockQty: 5,
                minStockLevel: 15,
                currency: "USD",
                supplierId: suppliers[1].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "Mechanical Keyboard Cherry MX",
                sku: "KB-MC-CMX",
                barcode: "4901234567893",
                category: "Peripherals",
                price: 159.99,
                costPrice: 85.0,
                stockQty: 30,
                minStockLevel: 8,
                currency: "USD",
                supplierId: suppliers[1].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "Ergonomic Mouse",
                sku: "MS-ERG-001",
                barcode: "4901234567894",
                category: "Peripherals",
                price: 69.99,
                costPrice: 28.0,
                stockQty: 3,
                minStockLevel: 10,
                currency: "USD",
                supplierId: suppliers[2].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "Laptop Stand Aluminum",
                sku: "STD-AL-001",
                barcode: "4901234567895",
                category: "Accessories",
                price: 59.99,
                costPrice: 22.0,
                stockQty: 65,
                minStockLevel: 12,
                currency: "USD",
                supplierId: suppliers[2].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "Webcam 4K HDR",
                sku: "CAM-4K-HDR",
                barcode: "4901234567896",
                category: "Cameras",
                price: 199.99,
                costPrice: 95.0,
                stockQty: 0,
                minStockLevel: 5,
                currency: "EUR",
                supplierId: suppliers[3].id,
            },
        }),
        prisma.product.create({
            data: {
                name: "Thunderbolt Dock",
                sku: "DCK-TB-001",
                barcode: "4901234567897",
                category: "Accessories",
                price: 299.99,
                costPrice: 165.0,
                stockQty: 18,
                minStockLevel: 5,
                currency: "EUR",
                supplierId: suppliers[3].id,
            },
        }),
    ]);

    // Create sales
    const salesData = [
        { productId: products[0].id, userId: staff.id, quantity: 2, unitPrice: 349.99 },
        { productId: products[1].id, userId: staff.id, quantity: 5, unitPrice: 79.99 },
        { productId: products[3].id, userId: admin.id, quantity: 1, unitPrice: 159.99 },
        { productId: products[5].id, userId: staff.id, quantity: 3, unitPrice: 59.99 },
        { productId: products[0].id, userId: admin.id, quantity: 1, unitPrice: 349.99 },
        { productId: products[1].id, userId: staff.id, quantity: 10, unitPrice: 79.99 },
        { productId: products[2].id, userId: admin.id, quantity: 2, unitPrice: 49.99 },
    ];

    for (const sale of salesData) {
        await prisma.sale.create({
            data: { ...sale, total: sale.quantity * sale.unitPrice },
        });
    }

    // Create purchase orders
    const po1 = await prisma.purchaseOrder.create({
        data: {
            orderNumber: "PO-20260001",
            supplierId: suppliers[0].id,
            createdBy: admin.id,
            status: "RECEIVED",
            totalAmount: 5500.0,
            notes: "Monthly restock order",
            items: {
                create: [
                    { productId: products[0].id, quantity: 20, unitPrice: 220.0, totalPrice: 4400.0 },
                    { productId: products[1].id, quantity: 50, unitPrice: 35.0, totalPrice: 1750.0 },
                ],
            },
        },
    });

    await prisma.purchaseOrder.create({
        data: {
            orderNumber: "PO-20260002",
            supplierId: suppliers[1].id,
            createdBy: admin.id,
            status: "PENDING",
            totalAmount: 2770.0,
            notes: "Urgent restock - low inventory",
            items: {
                create: [
                    { productId: products[2].id, quantity: 30, unitPrice: 18.5, totalPrice: 555.0 },
                    { productId: products[3].id, quantity: 15, unitPrice: 85.0, totalPrice: 1275.0 },
                ],
            },
        },
    });

    // Create stock logs
    for (const product of products) {
        await prisma.stockLog.create({
            data: {
                productId: product.id,
                type: "IN",
                quantity: product.stockQty,
                reason: "Initial inventory",
            },
        });
    }

    // Create price history
    await prisma.priceHistory.create({
        data: {
            productId: products[0].id,
            oldPrice: 210.0,
            newPrice: 220.0,
            source: "SUPPLIER_SYNC",
        },
    });

    await prisma.priceHistory.create({
        data: {
            productId: products[2].id,
            oldPrice: 20.0,
            newPrice: 18.5,
            source: "SUPPLIER_SYNC",
        },
    });

    console.log("✅ Database seeded successfully!");
    console.log(`   👤 Admin: admin@erp.com / admin123`);
    console.log(`   👤 Staff: staff@erp.com / staff123`);
    console.log(`   📦 ${products.length} products created`);
    console.log(`   🏭 ${suppliers.length} suppliers created`);
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
