import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import { verifyAuthToken } from "@/app/lib/auth";
import User from "@/app/models/User/user";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await dbConnect();

        const cookieHeader = req.headers.get("cookie") || "";
        const token = cookieHeader
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith("token="))
            ?.split("=")[1];

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyAuthToken(decodeURIComponent(token));
        const user = await User.findById(payload.userId).select("-password");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error: any) {
        console.error("Auth me error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
