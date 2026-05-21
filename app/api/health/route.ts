import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET() {
    const hasMongoUri = Boolean(process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim());
    const hasJwtSecret = Boolean(process.env.JWT_SECRET?.trim());
    const mongoEnvSource = process.env.MONGO_URI?.trim()
        ? "MONGO_URI"
        : process.env.MONGODB_URI?.trim()
            ? "MONGODB_URI"
            : null;

    try {
        await dbConnect();

        return NextResponse.json(
            {
                ok: true,
                mongo: "connected",
                mongooseReadyState: mongoose.connection.readyState,
                runtime: "nodejs",
                env: {
                    MONGO_URI: hasMongoUri,
                    MONGODB_URI: Boolean(process.env.MONGODB_URI?.trim()),
                    JWT_SECRET: hasJwtSecret,
                    mongoEnvSource,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Health check failed:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });

        return NextResponse.json(
            {
                ok: false,
                mongo: "failed",
                mongooseReadyState: mongoose.connection.readyState,
                runtime: "nodejs",
                error: error?.message || "Health check failed",
                env: {
                    MONGO_URI: hasMongoUri,
                    MONGODB_URI: Boolean(process.env.MONGODB_URI?.trim()),
                    JWT_SECRET: hasJwtSecret,
                    mongoEnvSource,
                },
            },
            { status: 503 }
        );
    }
}
