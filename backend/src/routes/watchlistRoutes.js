const express = require('express');
const router = express.Router();
const { addToWatchlist, getWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const authMiddleware = require('../middleware/auth.middle'); // middleware verify token

router.use(authMiddleware); // bảo vệ tất cả routes

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:service_id', removeFromWatchlist);

module.exports = router;