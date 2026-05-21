import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import { getAuthTokenPayloadFromRequest } from "@/app/lib/auth";
import User from "@/app/models/User/user";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const authUser = getAuthTokenPayloadFromRequest(req);

        if (authUser?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all citizens with valid location
        const users = await User.find({ role: "citizen", "location.coordinates": { $exists: true } })
            .select("username location address");

        return NextResponse.json(users, { status: 200 });
    } catch (error: any) {
        console.error("Fetch users error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
