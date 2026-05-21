import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import { getAuthTokenPayloadFromRequest } from "@/app/lib/auth";
import Vehicle from "@/app/models/Vehicle/vehicle";
import User from "@/app/models/User/user";

export const runtime = "nodejs";

// GET: Fetch the current active vehicle's location
export async function GET(req: Request) {
    try {
        await dbConnect();
        // Assuming there's only one active vehicle for this MVP, or we pick the most recently updated one
        const vehicle = await Vehicle.findOne({ routeStatus: { $ne: "inactive" } }).sort({ lastUpdated: -1 });

        if (!vehicle) {
            return NextResponse.json({ message: "No active vehicle found" }, { status: 404 });
        }

        return NextResponse.json(vehicle, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching vehicle:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Update vehicle location (Admin/Driver only)
export async function POST(req: Request) {
    try {
        await dbConnect();
        const authUser = getAuthTokenPayloadFromRequest(req);

        if (!authUser || !["admin", "driver"].includes(authUser.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;

        try {
            body = await req.json();
        } catch (error) {
            console.error("Vehicle update JSON parse error:", error);
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { driverId, lat, lng, status } = body;

        if (!driverId || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (status && !["active", "inactive", "paused"].includes(status)) {
            return NextResponse.json({ error: "Invalid vehicle status" }, { status: 400 });
        }

        // Check if vehicle operator exists and has a role that can move trucks
        const driver = await User.findById(driverId);
        if (!driver || !["admin", "driver"].includes(driver.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (authUser.role === "driver" && authUser.userId !== String(driver._id)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Find existing vehicle for this driver or create new
        // For this MVP, we might want to just update THE vehicle if we treat it as a singleton per driver
        let vehicle = await Vehicle.findOneAndUpdate(
            { driverId: driverId },
            {
                currentLocation: {
                    type: "Point",
                    coordinates: [Number(lng), Number(lat)],
                },
                routeStatus: status || "active",
                lastUpdated: new Date(),
            },
            { returnDocument: 'after', upsert: true }
        );

        return NextResponse.json(vehicle, { status: 200 });
    } catch (error: any) {
        console.error("Error updating vehicle:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
