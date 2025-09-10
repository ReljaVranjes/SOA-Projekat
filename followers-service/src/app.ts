import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToNeo4j, closeNeo4jConnection } from "./config/neo4j";
import followRoutes from "./routes/followRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

app.use("/api/follows", followRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Followers service is running" });
});

const startServer = async () => {
  try {
    await connectToNeo4j();
    console.log("Connected to Neo4j");

    app.listen(PORT, () => {
      console.log(`Followers service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await closeNeo4jConnection();
  process.exit(0);
});

startServer();
