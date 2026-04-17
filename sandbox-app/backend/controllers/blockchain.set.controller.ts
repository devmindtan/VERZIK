import { BlockchainSetService } from "../services/blockchain.set.service";
import { Request, Response } from "express";

const setService = new BlockchainSetService();

// export async function handleCreateTenant(req: Request, res: Response) {
//   try {
//     const { tenantName, treasuryAddress,  } = req.body;

//     const limit = first ? Number(first) : undefined;
//     const result = await setService.createTenant(limit);
//     return res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Controller Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// }
