import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
    recipient: mongoose.Schema.Types.ObjectId;
    message: string;
    type: "proximity_alert" | "system";
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["proximity_alert", "system"],
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
