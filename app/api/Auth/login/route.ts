import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../../lib/db";
import User from "../../../models/User/user";
import { loginSchema } from "../../../lib/validations";
import { signAuthToken } from "@/app/lib/auth";
import { ensureDefaultAccounts } from "@/app/lib/seed";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        let body;

        try {
            body = await req.json();
        } catch (error) {
            console.error("Login request JSON parse error:", error);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Validate request body
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            console.error("Login validation error:", validation.error.flatten());
            return NextResponse.json(
                { error: validation.error.format() },
                { status: 400 }
            );
        }

        const { username, password, phoneNumber, role } = validation.data;

        await dbConnect();
        try {
            await ensureDefaultAccounts();
        } catch (error: any) {
            console.error("Default account seed failed during login:", {
                message: error?.message,
                name: error?.name,
                code: error?.code,
                stack: error?.stack,
            });
        }

        // Find user by username
        // Note: Logic here supports finding only by username as per standard, 
        // but validates phoneNumber if provided and required by business logic. 
        // However, User model makes phoneNumber optional. 
        // We will stick to username lookup primarily.

        const normalizedIdentifier = username.trim().toLowerCase();
        const user = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: normalizedIdentifier },
            ],
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        if (role && user.role !== role) {
            return NextResponse.json(
                { error: "This account is not authorized for this login portal" },
                { status: 403 }
            );
        }

        // Optional: strict check if phoneNumber was provided and must match
        if (user.role === "citizen" && phoneNumber && user.phoneNumber !== phoneNumber) {
            return NextResponse.json(
                { error: "Invalid credentials" }, // Obscure detail
                { status: 401 }
            );
        }

        if (!user.password) {
            return NextResponse.json(
                { error: "User has no password set" },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = signAuthToken({
            userId: String(user._id),
            username: user.username,
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json(
            {
                message: "Login successful",
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    address: user.address,
                    location: user.location,
                }
            },
            { status: 200 }
        );

        // Set cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
        });

        return response;

    } catch (error: any) {
        console.error("Login error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json(
            { error: "Login failed on the server. Please try again shortly." },
            { status: 500 }
        );
    }
}
