import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
      index: true,
    },
    userName: {
      type: String,
      default: "Student",
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 25,
    },
    actualMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastPingAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL or query optimization: compound index for active sessions query
focusSessionSchema.index({ status: 1, lastPingAt: -1 });

export const FocusSession = mongoose.model("FocusSession", focusSessionSchema);
