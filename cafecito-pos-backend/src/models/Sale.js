import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productNameSnapshot: { type: String, required: true },
  unitPriceSnapshot: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer"],
      default: "cash",
    },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Sale", saleSchema);
