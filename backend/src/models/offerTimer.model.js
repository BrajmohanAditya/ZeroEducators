import mongoose from "mongoose";

const offerTimerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Dussehra Dhamaka",
      trim: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    targetUrl: {
      type: String,
      default: "#hero-banner",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const OfferTimer = mongoose.model("OfferTimer", offerTimerSchema);
export default OfferTimer;
