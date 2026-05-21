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
                required: true,
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (coordinates: number[]) =>
                        Array.isArray(coordinates) &&
                        coordinates.length === 2 &&
                        coordinates.every((coordinate) => Number.isFinite(coordinate)),
                    message: "Coordinates must contain longitude and latitude",
                },
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
