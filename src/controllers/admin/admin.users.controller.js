const Customer = require('../../models/customer.js');
const adminAuth = require('../../config/firebase.js');

const getAllUser = async (req, res) => {
    try {
        const users = await Customer.findAll();
        
        // Lấy roles từ Firebase cho mỗi user
        const usersWithRoles = await Promise.all(users.map(async (user) => {
            try {
                const userRecord = await adminAuth.auth().getUser(user.firebase_id);
                const customClaims = userRecord.customClaims || {};
                const roles = customClaims.roles || ['customer'];
                
                return {
                    ...user.toJSON(),
                    roles: roles
                };
            } catch (firebaseError) {
                console.log(`Firebase error for user ${user.firebase_id}:`, firebaseError.message);
                return {
                    ...user.toJSON(),
                    roles: ['customer']
                };
            }
        }));
        
        res.status(200).json(usersWithRoles);
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
            // Lưu thông tin user vào database
            const customerData = {
                firebase_id: firebaseUser.uid,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || null,
                avatar_url: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=14b8a6&color=fff`,
                gender: userData.gender || null,
                address: userData.address || null,
                reward_points: userData.rewardPoints || 0,
                active: true
            };
            
            const newUser = await Customer.create(customerData);

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
        const userData = req.body;
        
        const [updatedRows] = await Customer.update(userData, {
            where: { customer_id: userId }
        });
        
        if (updatedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const updatedUser = await Customer.findOne({ where: { customer_id: userId } });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
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
        
        const user = await Customer.findOne({ where: { customer_id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found in database' });
        }
        
        await adminAuth.auth().setCustomUserClaims(user.firebase_id, { roles: [role] });
        
        res.status(200).json({ 
            message: 'User role updated successfully', 
            userId: userId,
            firebase_id: user.firebase_id,
            role: role 
        });
        
    } catch (error) {
        console.error('Error setting user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getAllUser,
    createUser,
    updateUser,
    deleteUser,
    setUserRole
};