import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/app/lib/db";
import { getAuthTokenPayloadFromRequest } from "@/app/lib/auth";
import User from "@/app/models/User/user";
import Notification from "@/app/models/Notification/notification";
import Vehicle from "@/app/models/Vehicle/vehicle";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const authUser = getAuthTokenPayloadFromRequest(req);

        if (authUser?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;

        try {
            body = await req.json();
        } catch (error) {
            console.error("Broadcast JSON parse error:", error);
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { vehicleId, radius = 700 } = body;

        if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
            return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
        }

        const alertRadius = Number(radius);

        if (!Number.isFinite(alertRadius) || alertRadius <= 0) {
            return NextResponse.json({ error: "Invalid alert radius" }, { status: 400 });
        }

        // 1. Get current vehicle location
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || !vehicle.currentLocation?.coordinates?.length) {
            return NextResponse.json({ error: "Active vehicle not found" }, { status: 404 });
        }

        const [lng, lat] = vehicle.currentLocation.coordinates;

        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return NextResponse.json({ error: "Vehicle has invalid coordinates" }, { status: 400 });
        }

        // 2. Find users within radius (in meters)
        // We use $near with $maxDistance
        const usersNear = await User.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: alertRadius, // meters
                },
            },
            role: "citizen", // Targeting citizens only
        });

        if (!usersNear.length) {
            return NextResponse.json({ message: "No users within range", count: 0 }, { status: 200 });
        }

        // 3. Create notifications for these users
        // Avoid duplicates: Check if user received a "proximity_alert" in the last 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        let notificationsSent = 0;
        const notificationsToInsert = [];

        for (const user of usersNear) {
            // Explicitly cast to any or ObjectId to avoid TS error if model types are strict
            const userId = user._id as mongoose.Types.ObjectId;

            const recentNotification = await Notification.findOne({
                recipient: userId,
                type: "proximity_alert",
                createdAt: { $gt: oneHourAgo },
            } as any);

            if (!recentNotification) {
                notificationsToInsert.push({
                    recipient: userId,
                    message: "The waste collection vehicle is approaching your area (within 700m). Please prepare your waste.",
                    type: "proximity_alert",
                });
                notificationsSent++;
            }
        }

        if (notificationsToInsert.length > 0) {
            await Notification.insertMany(notificationsToInsert);
        }

        return NextResponse.json({
            message: "Broadcast processed",
            usersInRange: usersNear.length,
            notificationsSent
        }, { status: 200 });

    } catch (error: any) {
        console.error("Broadcast error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
