import mongoose from "mongoose";

// Valida email o teléfono con formato +
function isEmailOrPhone(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d{7,15}$/;  
  return emailRegex.test(value) || phoneRegex.test(value);
}

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      minlength: [2, "name must be at least 2 characters"],
      maxlength: [100, "name must be 100 characters or less"],
      trim: true,
    },
    phoneOrEmail: {
      type: String,
      required: [true, "phoneOrEmail is required"],
      validate: {
        validator: isEmailOrPhone,
        message: "must be a valid email or phone number starting with +",
      },
      trim: true,
    },
    purchasesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Customer", customerSchema);
