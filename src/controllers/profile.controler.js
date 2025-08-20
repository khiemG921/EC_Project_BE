const Customer = require('../models/customer.js');
const Location = require('../models/location.js');
const cloudinary = require('../config/cloudinary');

const updateCustomerImage = async (req, res) => {
    try {
        if (!req.user?.uid) {
            return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực.' });
        }

        const user = await Customer.findOne({ where: { firebase_id: req.user.uid } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không nhận được file.' });
        }

        if (!req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({ success: false, message: 'File rỗng hoặc bị lỗi.' });
        }

        // Log thông tin debug
        console.log('Upload avatar:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'image', folder: 'avatars' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        if (!result?.secure_url) {
            return res.status(500).json({ success: false, message: 'Không lấy được URL ảnh từ Cloudinary.' });
        }

        await user.update({ avatar_url: result.secure_url });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công.',
            avatarUrl: result.secure_url
        });
    } catch (error) {
        console.error('Lỗi khi tải ảnh đại diện:', error);
        const msg = error?.message === 'Empty file'
            ? 'Cloudinary báo file rỗng. Kiểm tra lại middleware hoặc FormData.'
            : (error.message || 'Lỗi không xác định.');
        return res.status(500).json({ success: false, message: msg });
    }
};

const findCustomer = async (req, res) => {
    const user = await Customer.findOne({ 
        where: { firebase_id: req.user.uid },
        include: [{
            model: Location,
            required: false
        }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' })

    const userData = user.toJSON();
    // Thêm address từ location nếu có
    if (userData.Locations && userData.Locations.length > 0) {
        userData.address = userData.Locations[0].detail;
    }
    
    console.log("User found:", userData, req.user.roles);

    res.json({
        ...userData,
        roles: req.user.roles
    });
};


const updateCustomerProfile = async (req, res) => {
    try {
        const user = await Customer.findOne({ where: { firebase_id: req.user.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Chỉ lấy các field được phép update
        const allowedFields = ['name', 'phone', 'gender', 'avatar_url', 'date_of_birth'];
        const updateData = {};
        
        // Lọc chỉ các field được phép
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }
        
        // Map frontend field 'dob' to 'date_of_birth'
        if (req.body.dob !== undefined) {
            updateData.date_of_birth = req.body.dob;
        }
        
        // Xử lý address riêng biệt
        let addressToUpdate = null;
        if (req.body.address !== undefined) {
            addressToUpdate = req.body.address;
        }
        
        // Map gender từ tiếng Việt sang English
        if (updateData.gender) {
            const genderMap = {
                'Nam': 'male',
                'Nữ': 'female',
                'Khác': 'other',
                'male': 'male',
                'female': 'female', 
                'other': 'other'
            };
            updateData.gender = genderMap[updateData.gender] || 'other';
        }
        
        console.log('Updating customer with data:', updateData);
        
        await user.update(updateData);
        
        // Cập nhật address trong bảng location nếu có
        if (addressToUpdate !== null) {
            console.log('Updating address:', addressToUpdate);
            
            // Chỉ cập nhật bản ghi hiện có; nếu chưa có thì tạo với giá trị an toàn
            const existing = await Location.findOne({ where: { customer_id: user.customer_id } });
            if (existing) {
                await existing.update({ detail: addressToUpdate });
            } else {
                try {
                    await Location.create({
                        customer_id: user.customer_id,
                        longtitude: null, // cho phép NULL
                        city: 'Unknown',
                        district: 'Unknown',
                        detail: addressToUpdate
                    });
                } catch (e) {
                    // Fallback nếu DB chưa cho phép NULL cho longtitude/latitude
                    console.warn('Create Location with NULL long/lat failed, falling back to 0/0. Error:', e?.message);
                    await Location.create({
                        customer_id: user.customer_id,
                        longtitude: 0,
                        latitude: 0,
                        city: 'Unknown',
                        district: 'Unknown',
                        detail: addressToUpdate
                    });
                }
            }
        }
        
        // Lấy lại user data với location để trả về
        const updatedUser = await Customer.findOne({ 
            where: { firebase_id: req.user.uid },
            include: [{
                model: Location,
                required: false
            }]
        });
        
        const responseData = updatedUser.toJSON();
        if (responseData.Locations && responseData.Locations.length > 0) {
            responseData.address = responseData.Locations[0].detail;
        }
        
        res.json({
            message: 'Cập nhật thông tin thành công',
            user: responseData
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            error: 'Không thể cập nhật thông tin',
            details: error.message 
        });
    }
};

module.exports = {
    findCustomer,
    updateCustomerProfile,
    updateCustomerImage
};