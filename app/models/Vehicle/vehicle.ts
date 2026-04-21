import mongoose, { Document, Model, Schema } from "mongoose";

export interface IVehicle extends Document {
    driverId: mongoose.Schema.Types.ObjectId;
    currentLocation: {
        type: string;
        coordinates: number[]; // [longitude, latitude]
    };
    routeStatus: "active" | "inactive" | "paused";
    lastUpdated: Date;
}

const vehicleSchema = new Schema<IVehicle>(
    {
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        routeStatus: {
            type: String,
            enum: ["active", "inactive", "paused"],
            default: "inactive",
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Add 2dsphere index to the currentLocation field
vehicleSchema.index({ currentLocation: "2dsphere" });

const Vehicle: Model<IVehicle> =
    mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", vehicleSchema);

export default Vehicle;
