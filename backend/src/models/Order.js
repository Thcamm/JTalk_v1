import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["momo", "vnpay"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "PENDING", "completed", "SUCCESS", "failed", "FAILED", "cancelled", "CANCELLED"],
      default: "pending",
      index: true,
    },
    transactionId: {
      type: String, // Mã giao dịch do MoMo/VNPAY trả về
      trim: true,
    },
    payUrl: {
      type: String, // Link thanh toán
    },
    callbackData: {
      type: mongoose.Schema.Types.Mixed, // Raw IPN response để đối soát
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
