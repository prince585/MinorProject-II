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
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error(
            "MONGO_URI is not configured. Add it to your local .env.local file and to your Vercel Environment Variables."
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

        cached.promise = mongoose.connect(mongoUri, opts);
    }

    try {
        cached.conn = await cached.promise;
        console.log("MongoDB connected successfully");
    } catch (e) {
        console.error("MongoDB connection failed", e);
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
