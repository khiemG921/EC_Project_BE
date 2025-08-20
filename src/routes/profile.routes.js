const express = require('express');
const { findCustomer, updateCustomerProfile, updateCustomerImage } = require('../controllers/profile.controler.js');
const verifyToken = require('../middleware/auth.middle').verifyToken;
const upload = require('../middleware/multer.js');

const router = express.Router();

// Prevent caching of profile responses by browsers or intermediate proxies
function noCache(req, res, next) {
	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	res.set('Pragma', 'no-cache');
	res.set('Expires', '0');
	res.set('Surrogate-Control', 'no-store');
	res.vary('Authorization');
	next();
}

router.get('/findCustomer', verifyToken, noCache, findCustomer);

router.put('/updateCustomerProfile', verifyToken, noCache, updateCustomerProfile);

// Bọc middleware để xử lý lỗi của multer thành 400 thay vì 500
router.post('/updateCustomerImage', verifyToken, noCache, (req, res, next) => {
	upload.single('avatar')(req, res, function (err) {
		if (err) {
			return res.status(400).json({ success: false, message: err.message || 'Upload file thất bại' });
		}
		next();
	});
}, updateCustomerImage);

module.exports = router;