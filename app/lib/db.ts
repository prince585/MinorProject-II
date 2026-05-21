import mongoose from "mongoose";

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongooseCache: MongooseCache | undefined;
}

const cached = globalThis.mongooseCache ?? (globalThis.mongooseCache = {
    conn: null,
    promise: null,
});

async function dbConnect() {
    const mongoUri =
        process.env.MONGO_URI?.trim() ||
        process.env.MONGODB_URI?.trim();
    const mongoEnvSource = process.env.MONGO_URI?.trim()
        ? "MONGO_URI"
        : process.env.MONGODB_URI?.trim()
            ? "MONGODB_URI"
            : null;
    const readyState = mongoose.connection.readyState;
    const hasMongoUri = Boolean(mongoUri);

    console.info("[dbConnect] Runtime diagnostics", {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri,
        mongoEnvSource,
        readyState,
    });

    if (!mongoUri) {
        console.error("[dbConnect] Missing required environment variable: MONGO_URI or MONGODB_URI");
        throw new Error(
            "MongoDB URI is not configured. Set MONGO_URI (preferred) or MONGODB_URI in .env.local and Vercel."
        );
    }

    if (cached.conn?.connection.readyState === 1) {
        return cached.conn;
    }

    if (cached.conn) {
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
        };

        console.info("[dbConnect] Opening new MongoDB connection");
        cached.promise = mongoose.connect(mongoUri, opts);
    }

    try {
        cached.conn = await cached.promise;
        console.info("[dbConnect] MongoDB connected successfully", {
            readyState: cached.conn.connection.readyState,
        });
    } catch (e) {
        console.error("[dbConnect] MongoDB connection failed", {
            message: (e as Error)?.message,
            name: (e as Error)?.name,
            stack: (e as Error)?.stack,
            readyState: mongoose.connection.readyState,
        });
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
