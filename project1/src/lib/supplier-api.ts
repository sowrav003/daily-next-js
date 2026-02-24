import prisma from "./prisma";

interface SupplierProductData {
    sku: string;
    price: number;
    stock: number;
    currency: string;
    available: boolean;
}

export async function fetchSupplierProductData(
    apiBaseUrl: string,
    sku: string
): Promise<SupplierProductData | null> {
    try {
        const url = `${apiBaseUrl}/products/${sku}`;
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            console.error(`Supplier API returned ${response.status} for SKU ${sku}`);
            return null;
        }

        const data = await response.json();
        return {
            sku: data.sku || sku,
            price: data.price || data.costPrice || 0,
            stock: data.stock || data.quantity || 0,
            currency: data.currency || "USD",
            available: data.available !== false,
        };
    } catch (error) {
        console.error(`Failed to fetch supplier data for SKU ${sku}:`, error);
        return null;
    }
}

export async function syncProductFromSupplier(productId: string) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { supplier: true },
    });

    if (!product || !product.supplier?.apiBaseUrl) {
        return { success: false, message: "Product or supplier API not configured" };
    }

    const supplierData = await fetchSupplierProductData(
        product.supplier.apiBaseUrl,
        product.sku
    );

    if (!supplierData) {
        return { success: false, message: "Failed to fetch supplier data" };
    }

    const oldPrice = product.costPrice;
    const newPrice = supplierData.price;

    // Update product with supplier data
    await prisma.product.update({
        where: { id: productId },
        data: {
            costPrice: newPrice,
            currency: supplierData.currency,
        },
    });

    // Log price change if different
    if (oldPrice !== newPrice) {
        await prisma.priceHistory.create({
            data: {
                productId,
                oldPrice,
                newPrice,
                source: "SUPPLIER_SYNC",
            },
        });
    }

    return {
        success: true,
        data: {
            oldPrice,
            newPrice,
            supplierStock: supplierData.stock,
            currency: supplierData.currency,
        },
    };
}

export async function syncAllProductsFromSuppliers() {
    const products = await prisma.product.findMany({
        where: {
            supplier: {
                apiBaseUrl: { not: null },
            },
        },
        include: { supplier: true },
    });

    const results = [];
    for (const product of products) {
        const result = await syncProductFromSupplier(product.id);
        results.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            ...result,
        });
    }

    return results;
}
