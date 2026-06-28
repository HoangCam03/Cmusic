import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.post("/create-order", paymentController.createOrder as any);
router.post("/callback", paymentController.callback as any);
router.get("/status/:appTransId", paymentController.getOrderStatus as any);

export default router;
