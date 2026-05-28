import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required"],
    trim: true,
    maxLength: [100, "name must be 100 characters or less"],
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "password is required"],
    minLength: [6, "password must be 6 characters at least"],
  },
  role: {
    type: String,
    enum: ["admin", "cashier"],
    default: "cashier",
  },
},
{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User; 