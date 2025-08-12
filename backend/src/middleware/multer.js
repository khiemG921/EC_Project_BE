const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Nếu không phải image, từ chối file 
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(null, false);
    }
    cb(null, true);
  }
});

module.exports = upload;