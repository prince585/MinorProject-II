import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    address?: string;
    location?: {
        type: string;
        coordinates: number[]; // [longitude, latitude]
    };
    role: "citizen" | "admin" | "driver";
    areaCode?: string;
    notificationPreferences?: {
        email: boolean;
        push: boolean;
    };
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: undefined,
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
            },
            default: undefined,
        },
        role: {
            type: String,
            enum: ["citizen", "admin", "driver"],
            default: "citizen",
        },
        areaCode: {
            type: String,
            trim: true,
        },
        notificationPreferences: {
            email: {
                type: Boolean,
                default: true,
            },
            push: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Add 2dsphere index to the location field
userSchema.index({ location: "2dsphere" });

// Prevent overwrite of the model during HMR (Hot Module Replacement) in Next.js
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
