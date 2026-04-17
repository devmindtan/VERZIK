import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import documentAnchoredsApi from "./routes/blockchain.query.api";
import checkPermissionApi from "./routes/blockchain.permission.api";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

const corsOriginRaw = process.env.CORS_ORIGIN?.trim();
const corsOrigin =
  !corsOriginRaw || corsOriginRaw === "*"
    ? "*"
    : corsOriginRaw.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes

app.get("/", (req: Request, res: Response) => {
  res.send("Hello");
});

app.use("/api", documentAnchoredsApi);
app.use("/api", checkPermissionApi);

const startServer = () => {
  try {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is barking on port ${port}...`);
      console.log(`Local: http://localhost:${port}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
