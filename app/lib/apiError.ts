import { NextResponse } from "next/server";

export function logServerError(scope: string, error: any) {
    console.error(`${scope}:`, {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
    });
}

export function apiErrorResponse(scope: string, error: any) {
    logServerError(scope, error);

    if (error?.code === 11000) {
        return NextResponse.json(
            { error: "An account with this email or username already exists." },
            { status: 409 }
        );
    }

    if (error?.name === "ValidationError") {
        return NextResponse.json(
            { error: "Submitted data is invalid. Please check all fields and try again." },
            { status: 400 }
        );
    }

    if (error?.name === "MongoServerSelectionError" || error?.name === "MongooseServerSelectionError") {
        return NextResponse.json(
            { error: "Cannot connect to MongoDB Atlas. Check Atlas Network Access and MONGO_URI in Vercel." },
            { status: 503 }
        );
    }

    if (error?.message?.includes("MONGO_URI")) {
        return NextResponse.json(
            { error: "MONGO_URI is missing in Vercel Environment Variables." },
            { status: 503 }
        );
    }

    if (error?.message?.includes("JWT_SECRET")) {
        return NextResponse.json(
            { error: "JWT_SECRET is missing in Vercel Environment Variables." },
            { status: 503 }
        );
    }

    return NextResponse.json(
        { error: `${scope} failed. Please check Vercel Function Logs for the detailed server error.` },
        { status: 500 }
    );
}
