import { Router } from "express";
import {
  handleGetDocumentAnchoreds,
  handleGetTenantCount,
  handleGetOperatorJoined,
  handleGetTenantCreateds,
  handleGetAllTenantInfoById,
} from "../controllers/blockchain.query.controller";
const router = Router();

router.get("/document-anchoreds", handleGetDocumentAnchoreds);
router.get("/tenant-count", handleGetTenantCount);
router.get("/operator-joineds", handleGetOperatorJoined);
router.get("/tenant-createds", handleGetTenantCreateds);
router.get("/tenant", handleGetAllTenantInfoById);

export default router;
