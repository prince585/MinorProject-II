import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/app/lib/db";
import User from "@/app/models/User/user";
import Notification from "@/app/models/Notification/notification";
import Vehicle from "@/app/models/Vehicle/vehicle";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { vehicleId, radius = 700 } = await req.json();

        // 1. Get current vehicle location
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || !vehicle.currentLocation) {
            return NextResponse.json({ error: "Active vehicle not found" }, { status: 404 });
        }

        const [lng, lat] = vehicle.currentLocation.coordinates;

        // 2. Find users within radius (in meters)
        // We use $near with $maxDistance
        const usersNear = await User.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: radius, // meters
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

    } catch (error) {
        console.error("Broadcast error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
