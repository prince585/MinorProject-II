import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Notification from "@/app/models/Notification/notification";

export const runtime = "nodejs";

// GET: Fetch notifications for a user
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const notifications = await Notification.find({ recipient: userId } as any)
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20 notifications

        return NextResponse.json(notifications, { status: 200 });
    } catch (error: any) {
        console.error("Fetch notifications error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Mark notifications as read
export async function PUT(req: Request) {
    try {
        await dbConnect();
        const { notificationIds } = await req.json();

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $set: { read: true } }
        );

        return NextResponse.json({ message: "Notifications marked as read" }, { status: 200 });
    } catch (error: any) {
        console.error("Update notifications error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
