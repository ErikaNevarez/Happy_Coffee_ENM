import express from "express";
import { login, register, refereshToken, getMe } from "../controllers/authController.js";
import { authenticate, authorize } from "../middlewares/auth.js"; 

const router = express.Router(); 

router.post("/login", login); 
router.post("/refresh", refereshToken); 
router.post("/me", authenticate, getMe); 
router.post("/register", authenticate, authorize("admin"), register); 


export default router;

