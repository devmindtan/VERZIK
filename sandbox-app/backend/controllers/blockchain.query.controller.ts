import { BlockchainQueryService } from "../services/blockchain.query.service";
import { Request, Response } from "express";

const queryService = new BlockchainQueryService();

export async function handleGetDocumentAnchoreds(req: Request, res: Response) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;
    const result = await queryService.getDocumentAnchoreds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetOperatorJoined(req: Request, res: Response) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;
    const result = await queryService.getOperatorJoineds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function handleGetTenantCreateds(req: Request, res: Response) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;
    const result = await queryService.getTenantCreateds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetViolationPenaltyUpdateds(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;
    const result = await queryService.getViolationPenaltyUpdateds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetPenaltyById(req: Request, res: Response) {
  try {
    const { tenantId } = req.query;

    const result = await queryService.getPenaltyById(tenantId as string);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetTenantCount(req: Request, res: Response) {
  try {
    const result = await queryService.getTenantCount();
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetTransactionByHash(req: Request, res: Response) {
  try {
    const { txHash } = req.query;
    const result = await queryService.getTransactionByHash(txHash as string);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function handleGetAllTenantInfoById(req: Request, res: Response) {
  try {
    const { tenantId } = req.query;

    const result = await queryService.getAllTenantInfoById(tenantId as string);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function handleGetAllDocumentInfoById(
  req: Request,
  res: Response,
) {
  try {
    const { tenantId, fileHash } = req.query;

    const result = await queryService.getAllDocumentInfoById(
      tenantId as string,
      fileHash as string,
    );
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetAllOperatorInfoById(
  req: Request,
  res: Response,
) {
  try {
    const { tenantId, operator } = req.query;

    const result = await queryService.getAllOperatorInfoById(
      tenantId as string,
      operator as string,
    );
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetNonceCount(req: Request, res: Response) {
  try {
    const { tenantId, operator } = req.query;

    const result = await queryService.getNonceCount(
      tenantId as string,
      operator as string,
    );
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetNonceConsumeds(req: Request, res: Response) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;
    const result = await queryService.getNonceConsumeds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetAllNonceConsumedInfoById(
  req: Request,
  res: Response,
) {
  try {
    const { tenantId, signer } = req.query;

    const result = await queryService.getAllNonceConsumedInfoById(
      tenantId as string,
      signer as string,
    );
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetDocumentCoSignQualifieds(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getDocumentCoSignQualifieds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetCoSignOperatorConfigureds(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getCoSignOperatorConfigureds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetCoSignPolicyUpdateds(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getCoSignPolicyUpdateds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetOperatorHardSlasheds(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getOperatorHardSlasheds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetOperatorSoftSlashed(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getOperatorSoftSlashed(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetOperatorUnstakeRequesteds(
  req: Request,
  res: Response,
) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getOperatorUnstakeRequesteds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetOperatorUnstakeds(req: Request, res: Response) {
  try {
    const { first } = req.query;

    const limit = first ? Number(first) : undefined;

    const result = await queryService.getOperatorUnstakeds(limit);
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetTenantRuntimeConfig(
  req: Request,
  res: Response,
) {
  try {
    const { tenantId } = req.query;

    const result = await queryService.getTenantRuntimeConfig(
      tenantId as string,
    );
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetOperatorStatus(req: Request, res: Response) {
  try {
    const { tenantId, operator } = req.query;

    const result = await queryService.getOperatorStatus(
      tenantId as string,
      operator as string,
    );
    return res.status(200).json({
      success: true,
      data: result || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetTenantInfo(req: Request, res: Response) {
  try {
    const { tenantId } = req.query;

    const result = await queryService.getTenantInfo(tenantId as string);
    if (!result) {
      return res.status(200).json({ success: true, data: null });
    }

    const safeData = JSON.parse(JSON.stringify(result, bigIntSerializer));
    return res.status(200).json({
      success: true,
      data: safeData || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function handleGetDocumentStatus(req: Request, res: Response) {
  try {
    const { tenantId, fileHash } = req.query;

    const result = await queryService.getDocumentStatus(
      tenantId as string,
      fileHash as string,
    );
    if (!result) {
      return res.status(200).json({ success: true, data: null });
    }

    const safeData = JSON.parse(JSON.stringify(result, bigIntSerializer));
    return res.status(200).json({
      success: true,
      data: safeData || [],
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
const bigIntSerializer = (key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
};
