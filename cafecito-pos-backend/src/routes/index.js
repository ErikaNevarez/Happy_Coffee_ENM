import express from "express";
import customerRoutes from "./customerRoutes.js";
import productRoutes from "./productRoutes.js";
import saleRoutes from "./sales.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/sales", saleRoutes);
router.use("/auth", authRoutes);

export default router;

