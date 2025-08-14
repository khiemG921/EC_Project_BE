const express = require('express');
const { findCustomer, updateCustomerProfile, updateCustomerImage } = require('../controllers/profile.controler.js');
const verifyToken = require('../middleware/auth.middle').verifyToken;
const upload = require('../middleware/multer.js');

const router = express.Router();

router.get('/findCustomer', verifyToken, findCustomer);

router.put('/updateCustomerProfile', verifyToken, updateCustomerProfile);

// Bọc middleware để xử lý lỗi của multer thành 400 thay vì 500
router.post('/updateCustomerImage', verifyToken, (req, res, next) => {
	upload.single('avatar')(req, res, function (err) {
		if (err) {
			return res.status(400).json({ success: false, message: err.message || 'Upload file thất bại' });
		}
		next();
	});
}, updateCustomerImage);

module.exports = router;