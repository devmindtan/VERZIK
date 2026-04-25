import { Router } from "express";
import {
  handleGetDocumentAnchoreds,
  handleGetTenantCount,
  handleGetOperatorJoined,
  handleGetTenantCreateds,
  handleGetAllTenantInfoById,
  handleGetAllDocumentInfoById,
  handleGetAllOperatorInfoById,
  handleGetViolationPenaltyUpdateds,
  handleGetPenaltyById,
  handleGetNonceCount,
  handleGetNonceConsumeds,
  handleGetAllNonceConsumedInfoById,
  handleGetDocumentCoSignQualifieds,
  handleGetTransactionByHash,
  handleGetCoSignOperatorConfigureds,
  handleGetCoSignPolicyUpdateds,
  handleGetOperatorHardSlasheds,
  handleGetOperatorSoftSlashed,
  handleGetOperatorUnstakeRequesteds,
  handleGetOperatorUnstakeds,
  handleGetTenantRuntimeConfig,
  handleGetOperatorStatus,
  handleGetTenantInfo,
  handleGetDocumentStatus,
} from "../controllers/blockchain.query.controller";
const router = Router();
// lấy toàn bộ tài liệu được kí lần đầu bởi issuer
router.get("/documents", handleGetDocumentAnchoreds);
// lấy số lượng tenant có trong hệ thống
router.get("/tenant-count", handleGetTenantCount);
// lấy toàn bộ opperator có trong hệ thống
router.get("/operators", handleGetOperatorJoined);
// lấy toàn bộ tenant có trong hệ thống
router.get("/tenants", handleGetTenantCreateds);
// lấy toàn bộ penalty có trong hệ thống
router.get("/penalties", handleGetViolationPenaltyUpdateds);
// lấy số lượng lượt kí của toàn bộ hệ thống
router.get("/nonce-count", handleGetNonceCount);
// lấy toàn bộ lượt kí của toàn bộ hệ thống
router.get("/nonces", handleGetNonceConsumeds);
// lấy toàn bộ document đã qualified của toàn bộ hệ thống
router.get("/document-qualifieds", handleGetDocumentCoSignQualifieds);
// lấy toàn bộ cấu hình cosign của operator trong toàn bộ hệ thống
router.get("/cosign-operators", handleGetCoSignOperatorConfigureds);
// lấy toàn bộ cấu hình cosign của policy trong toàn bộ hệ thống
router.get("/cosign-policies", handleGetCoSignPolicyUpdateds);
// lấy toàn bộ những operator bị hard-slash
router.get("/operator-hard-slasheds", handleGetOperatorHardSlasheds);
// lấy toàn bộ những operator bị soft-slash
router.get("/operator-soft-slasheds", handleGetOperatorSoftSlashed);
// lấy toàn bộ những operator yêu cầu rút tiền cọc
router.get("/operator-unstake-requesteds", handleGetOperatorUnstakeRequesteds);
// lấy toàn bộ những operator đã rút tiền cọc sau khi hết thời gian chờ
router.get("/operator-unstakeds", handleGetOperatorUnstakeds);

// lấy toàn bộ thông tin transaction theo hash
router.get("/transaction", handleGetTransactionByHash);
// lấy toàn bộ thông tin lượt kí theo id
router.get("/nonce", handleGetAllNonceConsumedInfoById);
// lấy toàn bộ thông tin tenant theo id
router.get("/tenant", handleGetAllTenantInfoById);
// lấy thông tin hiện tại của tenant theo id
router.get("/tenant-info", handleGetTenantInfo);
// lấy minStake và unstakeCooldown đã cấu hình hiện tại theo id
router.get("/tenant-runtime-config", handleGetTenantRuntimeConfig);
// lấy toàn bộ thông tin document theo id
router.get("/document", handleGetAllDocumentInfoById);
// lấy thông tin hiện tại của document theo id
router.get("/document-status", handleGetDocumentStatus);
// lấy toàn bộ thông tin operator theo id
router.get("/operator", handleGetAllOperatorInfoById);
// lấy thông tin hiện tại của operator theo id
router.get("/operator-status", handleGetOperatorStatus);
// lấy toàn bộ thông tin penalty theo id
router.get("/penalty", handleGetPenaltyById);

export default router;
