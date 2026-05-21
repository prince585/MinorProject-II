import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/db";
import User from "../../../models/User/user";
import { loginSchema } from "../../../lib/validations";

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

        const { username, password, phoneNumber } = validation.data;

        await dbConnect();

        // Find user by username
        // Note: Logic here supports finding only by username as per standard, 
        // but validates phoneNumber if provided and required by business logic. 
        // However, User model makes phoneNumber optional. 
        // We will stick to username lookup primarily.

        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Optional: strict check if phoneNumber was provided and must match
        if (phoneNumber && user.phoneNumber !== phoneNumber) {
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

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error(
                "JWT_SECRET is not configured. Add it to your local .env.local file and to your Vercel Environment Variables."
            );
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username, email: user.email },
            jwtSecret,
            { expiresIn: "1d" }
        );

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
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
