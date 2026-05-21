import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be at most 20 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phoneNumber: z
        .string()
        .trim()
        .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    role: z.enum(["citizen", "admin", "driver"]).optional().default("citizen"),
    address: z.string().trim().min(1, "Address is required"),
    location: z
        .object({
            type: z.literal("Point"),
            coordinates: z.array(z.number()).length(2),
        })
        .optional(),
});

export const loginSchema = z.object({
    username: z.string().trim().min(1, "Username or email is required"),
    phoneNumber: z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    password: z.string().min(1, "Password is required"),
    role: z.enum(["citizen", "admin", "driver"]).optional(),
});
