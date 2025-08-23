const Customer = require('../../models/customer.js');
const Location = require('../../models/location.js');
const adminAuth = require('../../config/firebase.js');

const getAllUser = async (req, res) => {
    try {
        const users = await Customer.findAll({
            include: [{ model: Location, required: false }]
        });

        // Lấy roles từ Firebase cho mỗi user và map address từ Location
        const usersWithExtras = await Promise.all(users.map(async (user) => {
            const raw = user.toJSON();
            const address = Array.isArray(raw.Locations) && raw.Locations.length > 0
                ? (raw.Locations[0]?.detail || '')
                : '';
            let roles = ['customer'];
            try {
                const userRecord = await adminAuth.auth().getUser(raw.firebase_id);
                const customClaims = userRecord.customClaims || {};
                const claimRoles = Array.isArray(customClaims.roles) ? customClaims.roles : [];
                const rset = new Set(['customer', ...claimRoles]);
                roles = Array.from(rset);
            } catch (firebaseError) {
                console.log(`Firebase error for user ${raw.firebase_id}:`, firebaseError.message);
            }
            return {
                ...raw,
                roles,
                address
            };
        }));

        res.status(200).json(usersWithExtras);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const createUser = async (req, res) => {
    try {
        const userData = req.body;
        
        // Validate required fields
        if (!userData.email || !userData.name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }
        
        // Generate random password hoặc lấy từ frontend
        const tempPassword = userData.password || `Temp${Math.random().toString(36).slice(-8)}!`;
        
        let firebaseUser;
        try {
            // Tạo user trong Firebase
            firebaseUser = await adminAuth.auth().createUser({
                email: userData.email,
                password: tempPassword,
                displayName: userData.name,
            });

            // Set role từ frontend hoặc default 'customer'
            const userRole = userData.roles && userData.roles.length > 0 
                ? userData.roles[0] 
                : 'customer';
                
            await adminAuth.auth().setCustomUserClaims(firebaseUser.uid, { 
                roles: [userRole] 
            });
            
        } catch (firebaseError) {
            console.error('Firebase user creation failed:', firebaseError);
            return res.status(400).json({ 
                error: 'Failed to create Firebase user', 
                details: firebaseError.message 
            });
        }
        
        try {
            // Lưu thông tin user vào database (không có cột address trong customer)
            const customerData = {
                firebase_id: firebaseUser.uid,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || null,
                avatar_url: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=14b8a6&color=fff`,
                gender: userData.gender || null,
                reward_points: userData.rewardPoints || 0,
                active: true
            };

            const newUser = await Customer.create(customerData);

            // Nếu có address, tạo Location tương ứng
            if (userData.address) {
                try {
                    await Location.create({
                        customer_id: newUser.customer_id,
                        longtitude: null,
                        latitude: null,
                        city: 'Unknown',
                        district: 'Unknown',
                        detail: userData.address
                    });
                } catch (e) {
                    await Location.create({
                        customer_id: newUser.customer_id,
                        longtitude: 0,
                        latitude: 0,
                        city: 'Unknown',
                        district: 'Unknown',
                        detail: userData.address
                    });
                }
            }

            // Trả về user với role từ Firebase
            const response = {
                ...newUser.toJSON(),
                roles: [userRole],
                tempPassword: tempPassword // ⚠️ Chỉ để test, production nên gửi qua email
            };

            res.status(201).json(response);
            
        } catch (dbError) {
            // Nếu tạo MySQL record thất bại, xóa Firebase user
            console.error('Database user creation failed:', dbError);
            try {
                await adminAuth.auth().deleteUser(firebaseUser.uid);
                console.log('Cleaned up Firebase user after DB failure');
            } catch (cleanupError) {
                console.error('Failed to cleanup Firebase user:', cleanupError);
            }
            
            return res.status(500).json({ 
                error: 'Failed to create user in database',
                details: dbError.message 
            });
        }
        
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const body = req.body || {};

        // Chỉ cập nhật các field hợp lệ
        const allowed = ['name', 'email', 'phone', 'gender', 'avatar_url', 'date_of_birth'];
        const updates = {};
        for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
        if (body.dob !== undefined) updates['date_of_birth'] = body.dob;

        // Chuẩn hóa gender nếu có
        if (updates.gender) {
            const genderMap = { 'Nam': 'male', 'Nữ': 'female', 'Khác': 'other', male: 'male', female: 'female', other: 'other' };
            updates.gender = genderMap[updates.gender] || 'other';
        }

        // Validate date format if provided
        if (updates.date_of_birth && typeof updates.date_of_birth === 'string') {
            const isoLike = /^\d{4}-\d{2}-\d{2}$/;
            if (!isoLike.test(updates.date_of_birth)) {
                return res.status(400).json({ error: 'Ngày sinh không hợp lệ, định dạng YYYY-MM-DD' });
            }
        }

        let updatedRows = 0;
        try {
            const result = await Customer.update(updates, { where: { customer_id: userId } });
            updatedRows = result[0];
        } catch (err) {
            if (err && (err.name === 'SequelizeUniqueConstraintError' || err.parent?.code === 'ER_DUP_ENTRY')) {
                return res.status(400).json({ error: 'Email hoặc SĐT đã tồn tại' });
            }
            throw err;
        }
        if (updatedRows === 0) return res.status(404).json({ error: 'User not found' });

        // Cập nhật địa chỉ (Location.detail)
        if (body.address !== undefined) {
            const existing = await Location.findOne({ where: { customer_id: userId } });
            if (existing) {
                await existing.update({ detail: body.address });
            } else {
                try {
                    await Location.create({
                        customer_id: userId,
                        longtitude: null,
                        latitude: null,
                        city: 'Unknown',
                        district: 'Unknown',
                        detail: body.address
                    });
                } catch (e) {
                    await Location.create({
                        customer_id: userId,
                        longtitude: 0,
                        latitude: 0,
                        city: 'Unknown',
                        district: 'Unknown',
                        detail: body.address
                    });
                }
            }
        }

        const updatedUser = await Customer.findOne({
            where: { customer_id: userId },
            include: [{ model: Location, required: false }]
        });
        const raw = updatedUser.toJSON();
        const address = Array.isArray(raw.Locations) && raw.Locations.length > 0 ? (raw.Locations[0]?.detail || '') : '';

        // Attach roles from Firebase
        let roles = ['customer'];
        try {
            const userRecord = await adminAuth.auth().getUser(raw.firebase_id);
            const customClaims = userRecord.customClaims || {};
            const claimRoles = Array.isArray(customClaims.roles) ? customClaims.roles : [];
            roles = Array.from(new Set(['customer', ...claimRoles]));
        } catch {}

        res.status(200).json({ ...raw, address, roles });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        // Prevent deleting your own account
        const target = await Customer.findOne({ where: { customer_id: userId } });
        if (!target) return res.status(404).json({ error: 'User not found' });
        if (req.user?.uid && target.firebase_id === req.user.uid) {
            return res.status(400).json({ error: 'Không thể tự xóa tài khoản của chính bạn' });
        }

        // Remove dependent locations first to avoid FK constraint issues
        try {
            await Location.destroy({ where: { customer_id: userId } });
        } catch (e) {
            console.warn('Failed to remove dependent locations for user', userId, e?.message);
        }

        const deletedRows = await Customer.destroy({
            where: { customer_id: userId }
        });
        
        if (deletedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const setUserRole = async (req, res) => {
    try {
        const { userId } = req.params; 
        const { role } = req.body;
        // Không cho phép cấp quyền admin
        if (role === 'admin') {
            return res.status(403).json({ error: 'Không được phép cấp quyền admin' });
        }
        
        const user = await Customer.findOne({ where: { customer_id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found in database' });
        }
        // This legacy endpoint sets a single role; keep for backward compatibility but always include 'customer'
        const nextRoles = Array.from(new Set(['customer', role])).filter(Boolean);
        await adminAuth.auth().setCustomUserClaims(user.firebase_id, { roles: nextRoles });
        
        res.status(200).json({ 
            message: 'User role updated successfully', 
            userId: userId,
            firebase_id: user.firebase_id,
            roles: nextRoles 
        });
        
    } catch (error) {
        console.error('Error setting user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const grantRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!['admin', 'tasker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
        // Disallow granting admin; only allow tasker
        if (role === 'admin') {
            return res.status(403).json({ error: 'Không được phép cấp quyền admin' });
        }

        const user = await Customer.findOne({ where: { customer_id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found in database' });

        const userRecord = await adminAuth.auth().getUser(user.firebase_id);
        const customClaims = userRecord.customClaims || {};
        const current = Array.isArray(customClaims.roles) ? customClaims.roles : [];
        const roles = Array.from(new Set(['customer', ...current, role]));
        await adminAuth.auth().setCustomUserClaims(user.firebase_id, { roles });

        res.json({ message: 'Role granted', userId, roles });
    } catch (error) {
        console.error('Error granting role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const revokeRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!['admin', 'tasker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

        const user = await Customer.findOne({ where: { customer_id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found in database' });

        // Prevent revoking your own admin role
        if (role === 'admin' && req.user?.uid && user.firebase_id === req.user.uid) {
            return res.status(400).json({ error: 'Không thể tự thu hồi quyền admin của bạn' });
        }

        const userRecord = await adminAuth.auth().getUser(user.firebase_id);
        const customClaims = userRecord.customClaims || {};
        const current = Array.isArray(customClaims.roles) ? customClaims.roles : [];
        const roles = Array.from(new Set(current.filter(r => r !== role && r !== 'customer')));
        roles.unshift('customer'); // ensure base role
        await adminAuth.auth().setCustomUserClaims(user.firebase_id, { roles });

        res.json({ message: 'Role revoked', userId, roles });
    } catch (error) {
        console.error('Error revoking role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getAllUser,
    createUser,
    updateUser,
    deleteUser,
    setUserRole,
    grantRole,
    revokeRole
};