import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
    userId: string;
    username: string;
    email: string;
    role: "citizen" | "admin" | "driver";
}

export function getJwtSecret() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error(
            "JWT_SECRET is not configured. Add it to your local .env.local file and to your Vercel Environment Variables."
        );
    }

    return jwtSecret;
}

export function signAuthToken(payload: AuthTokenPayload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "1d" });
}

export function verifyAuthToken(token: string) {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}

export function getAuthTokenPayloadFromRequest(req: Request) {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("token="))
        ?.split("=")[1];

    if (!token) {
        return null;
    }

    try {
        return verifyAuthToken(decodeURIComponent(token));
    } catch (error) {
        console.error("JWT verification failed:", error);
        return null;
    }
}
