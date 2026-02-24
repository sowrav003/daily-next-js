import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createToken, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === "register") {
            const validation = registerSchema.safeParse(body);
            if (!validation.success) {
                return NextResponse.json(
                    { success: false, error: validation.error.issues[0].message },
                    { status: 400 }
                );
            }

            const { name, email, password, role } = validation.data;

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json(
                    { success: false, error: "Email already registered" },
                    { status: 400 }
                );
            }

            const hashedPassword = await hashPassword(password);
            const user = await prisma.user.create({
                data: { name, email, password: hashedPassword, role },
                select: { id: true, name: true, email: true, role: true },
            });

            const token = await createToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            });

            const response = NextResponse.json({
                success: true,
                data: user,
            });

            response.cookies.set("auth-token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/",
            });

            return response;
        }

        if (action === "login") {
            const validation = loginSchema.safeParse(body);
            if (!validation.success) {
                return NextResponse.json(
                    { success: false, error: validation.error.issues[0].message },
                    { status: 400 }
                );
            }

            const { email, password } = validation.data;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return NextResponse.json(
                    { success: false, error: "Invalid credentials" },
                    { status: 401 }
                );
            }

            const isValid = await verifyPassword(password, user.password);
            if (!isValid) {
                return NextResponse.json(
                    { success: false, error: "Invalid credentials" },
                    { status: 401 }
                );
            }

            const token = await createToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            });

            const response = NextResponse.json({
                success: true,
                data: { id: user.id, name: user.name, email: user.email, role: user.role },
            });

            response.cookies.set("auth-token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24,
                path: "/",
            });

            return response;
        }

        if (action === "logout") {
            const response = NextResponse.json({ success: true });
            response.cookies.delete("auth-token");
            return response;
        }

        return NextResponse.json(
            { success: false, error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
