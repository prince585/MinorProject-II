
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../../lib/db"; // Adjust path as necessary
import User from "../../../models/User/user"; // Adjust path as necessary
import { registerSchema } from "../../../lib/validations";
import { ensureDefaultAccounts } from "@/app/lib/seed";
import { apiErrorResponse, logServerError } from "@/app/lib/apiError";

export const runtime = "nodejs";

const DEFAULT_CITIZEN_LOCATION = {
    type: "Point" as const,
    coordinates: [77.2090, 28.6139],
};

export async function POST(req: Request) {
    try {
        let body;

        try {
            body = await req.json();
        } catch (error) {
            console.error("Registration request JSON parse error:", error);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Validate request body
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            console.error("Registration validation error:", validation.error.flatten());
            return NextResponse.json(
                { error: validation.error.format() },
                { status: 400 }
            );
        }

        const { username, email, password, phoneNumber, address, location } = validation.data;
        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        await dbConnect();

        // Demo account seeding should never block citizen registration.
        ensureDefaultAccounts().catch((error) => {
            logServerError("Default account seed failed during registration", error);
        });

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email or username already exists" },
                { status: 409 } // Conflict
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const hasValidLocation =
            location?.type === "Point" &&
            Array.isArray(location.coordinates) &&
            location.coordinates.length === 2 &&
            location.coordinates.every((coordinate) => Number.isFinite(coordinate));

        if (location && !hasValidLocation) {
            console.error("Registration invalid location payload:", location);
            return NextResponse.json(
                { error: "Valid location coordinates are required" },
                { status: 400 }
            );
        }

        const validLocation = hasValidLocation
            ? location as { type: "Point"; coordinates: number[] }
            : DEFAULT_CITIZEN_LOCATION;

        // Create new user
        const newUser = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            phoneNumber,
            role: "citizen",
            address,
            location: {
                type: "Point",
                coordinates: validLocation.coordinates
            }
        });

        return NextResponse.json(
            {
                message: "User registered successfully",
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email
                }
            },
            { status: 201 }
        );

    } catch (error: any) {
        return apiErrorResponse("Registration", error);
    }
}
