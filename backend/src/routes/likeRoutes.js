const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

// Toggle Like (POST /api/likes/toggle)
router.post('/toggle', likeController.toggleLike);

// Get IDs (GET /api/likes/ids?userId=...)
router.get('/ids', likeController.getLikedIds);

// Get Full Songs (GET /api/likes/list?userId=...)
router.get('/list', likeController.getLikedSongs);

module.exports = router;
