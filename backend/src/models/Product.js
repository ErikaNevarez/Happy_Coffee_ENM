import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      maxlength: [100, "name must be 100 characters or less"],
      trim: true,
    },
    imageUrl: {
    type: String,
    required: false,
    trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.1,
    },
    description: {
    type: String,
    required: true,
    trim: true,
    },
    category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
    }, 
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "stock must be an integer",
      },
    },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
