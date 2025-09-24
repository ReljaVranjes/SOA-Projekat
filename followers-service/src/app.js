const dotenv = require("dotenv");
dotenv.config();

const tracing = require("./config/tracing");
tracing.start();

const express = require("express");
const neo4jConnection = require("./config/neo4j");

const app = express();
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 Followers Service - ${req.method} ${req.url}`);
  next();
});

const followersRoutes = require("./routes/followersRoutes");

app.use("/", followersRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "followers-service" });
});

neo4jConnection
  .connect()
  .then(() => {
    console.log("✅ Connected to Neo4j");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Followers service running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Neo4j connection error:", err);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  console.log("📴 Shutting down followers service...");
  await neo4jConnection.close();
  await tracing.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("📴 Shutting down followers service...");
  await neo4jConnection.close();
  await tracing.shutdown();
  process.exit(0);
});
