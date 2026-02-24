import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const publicPaths = ["/", "/login", "/api/auth", "/api/cron"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
        // Redirect authenticated users away from login
        if (pathname === "/login") {
            const token = request.cookies.get("auth-token")?.value;
            if (token) {
                const payload = await verifyToken(token);
                if (payload) {
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                }
            }
        }
        return NextResponse.next();
    }

    // Check auth for protected routes
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("auth-token");
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
