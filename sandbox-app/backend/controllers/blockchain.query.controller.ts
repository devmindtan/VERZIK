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
      data: result,
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
      data: result,
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
      data: result,
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
      data: result,
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
      data: result,
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
