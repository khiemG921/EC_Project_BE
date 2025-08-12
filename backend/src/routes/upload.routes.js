const express = require('express');
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/multer");

router.post('/', upload.single('image'), async (req, res) => {
    try{

        console.log ('Image file:', req.file);
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }
        const image = req.file.path;

        let result =  await cloudinary.uploader.upload(image);

        res.json({success: true, message: "Image added successfully", result: result.url});

    }
    catch (error) {
        res.json({success: false, message: error.message});
        console.error("Error in addProduct:", error);
    } 
});

module.exports = router;