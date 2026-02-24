import { NextRequest, NextResponse } from "next/server";
import { convertCurrency, getExchangeRates } from "@/lib/currency";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get("from") || "USD";
        const to = searchParams.get("to") || "EUR";
        const amount = parseFloat(searchParams.get("amount") || "1");

        if (isNaN(amount)) {
            return NextResponse.json(
                { success: false, error: "Invalid amount" },
                { status: 400 }
            );
        }

        const result = await convertCurrency(amount, from, to);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Currency conversion error:", error);
        return NextResponse.json({ success: false, error: "Conversion failed" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const rates = await getExchangeRates("USD");
        return NextResponse.json({ success: true, data: rates });
    } catch (error) {
        console.error("Exchange rates error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch rates" }, { status: 500 });
    }
}
