import express from "express";
import { createSale, getSaleById } from "../controllers/saleController.js";

const router = express.Router();

router.post("/", createSale);
router.get("/:id", getSaleById);

export default router;
