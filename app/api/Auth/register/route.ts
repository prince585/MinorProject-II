
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../../lib/db"; // Adjust path as necessary
import User from "../../../models/User/user"; // Adjust path as necessary
import { registerSchema } from "../../../lib/validations";
import { ensureDefaultAccounts } from "@/app/lib/seed";

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

        await dbConnect();

        // Demo account seeding should never block citizen registration.
        ensureDefaultAccounts().catch((error) => {
            console.error("Default account seed failed during registration:", {
                message: error?.message,
                name: error?.name,
                code: error?.code,
                stack: error?.stack,
            });
        });

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
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
            username,
            email,
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
        if (error?.code === 11000) {
            console.error("Registration duplicate key error:", {
                keyPattern: error?.keyPattern,
                keyValue: error?.keyValue,
            });
            return NextResponse.json(
                { error: "User with this email or username already exists" },
                { status: 409 }
            );
        }

        if (error?.name === "ValidationError") {
            console.error("Registration mongoose validation error:", error?.errors);
            return NextResponse.json(
                { error: "Registration data is invalid. Please check all fields and location details." },
                { status: 400 }
            );
        }

        if (error?.name === "MongoServerSelectionError" || error?.name === "MongooseServerSelectionError") {
            return NextResponse.json(
                { error: "Database connection failed. Please try again shortly." },
                { status: 503 }
            );
        }

        console.error("Registration error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return NextResponse.json(
            { error: "Registration failed on the server. Please check the details and try again." },
            { status: 500 }
        );
    }
}
