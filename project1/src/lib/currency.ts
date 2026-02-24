interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    date: string;
}

let cachedRates: ExchangeRates | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(
    baseCurrency: string = "USD"
): Promise<ExchangeRates> {
    const now = Date.now();

    if (cachedRates && cachedRates.base === baseCurrency && now - cacheTimestamp < CACHE_DURATION) {
        return cachedRates;
    }

    try {
        const apiUrl = process.env.EXCHANGE_RATE_API_URL || "https://api.exchangerate-api.com/v4/latest";
        const response = await fetch(`${apiUrl}/${baseCurrency}`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();
        cachedRates = {
            base: data.base,
            rates: data.rates,
            date: data.date,
        };
        cacheTimestamp = now;

        return cachedRates;
    } catch (error) {
        console.error("Exchange rate API error:", error);
        // Return fallback rates
        return {
            base: baseCurrency,
            rates: { USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110.0, CAD: 1.25, AUD: 1.35, INR: 83.0, CNY: 7.1 },
            date: new Date().toISOString().split("T")[0],
        };
    }
}

export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<{ convertedAmount: number; rate: number }> {
    if (fromCurrency === toCurrency) {
        return { convertedAmount: amount, rate: 1 };
    }

    const rates = await getExchangeRates(fromCurrency);
    const rate = rates.rates[toCurrency];

    if (!rate) {
        throw new Error(`Exchange rate not available for ${toCurrency}`);
    }

    return {
        convertedAmount: Math.round(amount * rate * 100) / 100,
        rate,
    };
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}
