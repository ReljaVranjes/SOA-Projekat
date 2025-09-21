const express = require("express");
const { proxyRequest } = require("../utils/proxy");

const router = express.Router();
const FOLLOWERS_SERVICE_URL =
  process.env.FOLLOWERS_SERVICE_URL || "http://localhost:6000";

// Sve followers rute
router.use("/", proxyRequest(FOLLOWERS_SERVICE_URL));

module.exports = router;
