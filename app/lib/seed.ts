import bcrypt from "bcryptjs";
import User from "@/app/models/User/user";

const DEFAULT_ACCOUNTS = [
    {
        username: "ecotracker-admin",
        email: "admin@ecotracker.com",
        password: "Admin@123",
        phoneNumber: "9999999999",
        address: "EcoTracker Municipality Control Center",
        role: "admin" as const,
    },
    {
        username: "ecotracker-driver",
        email: "driver@ecotracker.com",
        password: "Driver@123",
        phoneNumber: "8888888888",
        address: "EcoTracker Vehicle Depot",
        role: "driver" as const,
    },
];

let seedPromise: Promise<void> | null = null;

export function ensureDefaultAccounts() {
    if (!seedPromise) {
        seedPromise = seedDefaultAccounts().catch((error) => {
            seedPromise = null;
            throw error;
        });
    }

    return seedPromise;
}

async function seedDefaultAccounts() {
    for (const account of DEFAULT_ACCOUNTS) {
        const existingUser = await User.findOne({
            $or: [{ email: account.email }, { username: account.username }],
        });

        if (existingUser) {
            continue;
        }

        const hashedPassword = await bcrypt.hash(account.password, 10);

        await User.create({
            username: account.username,
            email: account.email,
            password: hashedPassword,
            phoneNumber: account.phoneNumber,
            address: account.address,
            role: account.role,
        });
    }
}
