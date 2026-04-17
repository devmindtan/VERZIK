import { Router } from "express";
import { handleCheckPermission } from "../controllers/blockchain.permission.controller";
const router = Router();

router.post("/check-permission", handleCheckPermission);
export default router;
