const admin = require('../src/config/firebase');

async function setAdminRole(email) {
    try {
        // Tìm user theo email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Set custom claims với role admin
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            roles: ['customer', 'admin']
        });
        
        console.log(`✅ Đã set role admin cho user: ${email}`);
        console.log(`UID: ${userRecord.uid}`);
        
    } catch (error) {
        console.error('❌ Lỗi khi set role admin:', error);
    }
}

// Thay đổi email này thành email admin của bạn
const adminEmail = 'anhnguyen.puppetlover@gmail.com'; // Email của user hiện tại

setAdminRole(adminEmail)
    .then(() => {
        console.log('Hoàn thành!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Lỗi:', error);
        process.exit(1);
    });
