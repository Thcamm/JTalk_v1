import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ["monthly_99k", "yearly_899k", "referral_reward_7d"],
      default: "monthly_99k",
    },
    price: {
      type: Number,
      default: 99000,
    },
    status: {
      type: String,
      enum: ["active", "ACTIVE", "expired", "EXPIRED", "cancelled", "CANCELLED"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subscriptionSchema.virtual("expires_at").get(function () {
  return this.endDate;
});

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
