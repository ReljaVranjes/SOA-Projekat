const express = require('express');
const { proxyRequest } = require('../utils/proxy');
const authMiddleware = require('../../middleware/auth_middleware');
const { getTours } = require('../services/toursClient');

const router = express.Router();
const TOURS_SERVICE_URL = process.env.TOURS_SERVICE_URL || 'http://localhost:5000';


router.get('/tours', async (req, res) => {
  try {
    // Pozivamo gRPC klijent
    const response = await getTours();

    // Vraćamo JSON klijentu
    res.json({
      success: response.success,
      message: response.message,
      total_count: response.total_count,
      tours: response.tours,
    });
  } catch (err) {
    console.error('Error fetching tours via gRPC:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tours',
      error: err.message,
    });
  }
});

// Sve tours rute
router.use('/', authMiddleware, proxyRequest(TOURS_SERVICE_URL));

module.exports = router;