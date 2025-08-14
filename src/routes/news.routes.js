const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { verifyToken } = require('../middleware/auth.middle');

// Lấy danh sách tin tức (GET /news)
router.get('/', newsController.getAllNews);
// Lấy chi tiết tin tức (GET /news/:id)
router.get('/:id', newsController.getNewsById);

// Thêm mới tin tức (POST /news) - cần xác thực admin
router.post('/', verifyToken, newsController.createNews);
// Sửa tin tức (PUT /news/:id) - cần xác thực admin
router.put('/:id', verifyToken, newsController.updateNews);
// Xóa tin tức (DELETE /news/:id) - cần xác thực admin
router.delete('/:id', verifyToken, newsController.deleteNews);

module.exports = router;