const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');

// Initialize emotions for existing songs
router.post('/initialize', emotionController.initializeEmotions);

// Get emotion statistics
router.get('/stats', emotionController.getEmotionStats);

// Bulk update emotions
router.post('/bulk-update', emotionController.bulkUpdateEmotions);

module.exports = router;
