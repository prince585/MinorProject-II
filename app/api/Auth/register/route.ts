
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../../lib/db"; // Adjust path as necessary
import User from "../../../models/User/user"; // Adjust path as necessary
import { registerSchema } from "../../../lib/validations";
import { ensureDefaultAccounts } from "@/app/lib/seed";
import { apiErrorResponse, logServerError } from "@/app/lib/apiError";
import mongoose from "mongoose";

export const runtime = "nodejs";

const DEFAULT_CITIZEN_LOCATION = {
    type: "Point" as const,
    coordinates: [77.2090, 28.6139],
};

export async function POST(req: Request) {
    let requestBody: unknown = null;
    let stage = "init";
    let queryContext: Record<string, unknown> | null = null;

    try {
        let body;

        try {
            stage = "parse_json";
            body = await req.json();
            requestBody = body;
        } catch (error) {
            console.error("Registration request JSON parse error:", error);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Validate request body
        stage = "validate_payload";
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

        stage = "db_connect";
        await dbConnect();

        // Demo account seeding should never block citizen registration.
        ensureDefaultAccounts().catch((error) => {
            logServerError("Default account seed failed during registration", error);
        });

        // Check if user already exists
        stage = "check_existing_user";
        queryContext = {
            normalizedUsername,
            normalizedEmail,
        };
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
        stage = "hash_password";
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
        stage = "create_user";
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
        console.error("Registration fatal error details:", {
            stage,
            requestBody: requestBody && typeof requestBody === "object"
                ? {
                    ...(requestBody as Record<string, unknown>),
                    password: "[REDACTED]",
                }
                : requestBody,
            queryContext,
            mongooseReadyState: mongoose.connection.readyState,
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });
        return apiErrorResponse("Registration", error);
    }
}
