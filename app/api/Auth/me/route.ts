import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import { getAuthTokenPayloadFromRequest } from "@/app/lib/auth";
import User from "@/app/models/User/user";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await dbConnect();

        const payload = getAuthTokenPayloadFromRequest(req);

        if (!payload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
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
