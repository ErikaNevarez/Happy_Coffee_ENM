import express from "express";
import customerRoutes from "./customerRoutes.js";
import productRoutes from "./productRoutes.js";
import saleRoutes from "./sales.js";

const router = express.Router();

router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/sales", saleRoutes);

export default router;
