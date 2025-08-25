// src/routes/favorite.routes.js

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { verifyToken } = require('../middleware/auth.middle');

// All favorite routes require authentication
router.post('/add', verifyToken, favoriteController.addFavorite);
router.post('/remove', verifyToken, favoriteController.removeFavorite);
router.get('/list', verifyToken, favoriteController.listFavoriteIds);
router.get('/details', verifyToken, favoriteController.listFavorites);

module.exports = router;