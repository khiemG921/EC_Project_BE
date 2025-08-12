const admin = require('../src/config/firebase');

async function createAdminUser() {
  try {
    console.log('Tạo tài khoản admin...');
    
    const email = 'admin@cleannow.com';
    const password = 'admin123456';
    
    let userRecord;
    
    try {
      // Tìm user đã tồn tại
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('✅ User đã tồn tại:', userRecord.uid);
    } catch (error) {
      // Nếu user chưa tồn tại
      console.log('👤 Tạo user mới...');
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: 'Admin User',
        emailVerified: true
      });
      console.log('✅ User đã được tạo:', userRecord.uid);
    }
    
    // Set custom claims cho admin role
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      roles: ['admin'] 
    });
    console.log('✅ Admin role đã được set');
    
    // Force refresh token để custom claims có hiệu lực
    await admin.auth().revokeRefreshTokens(userRecord.uid);
    console.log('✅ Token đã được refresh');
    
    console.log('\n🎉 THÀNH CÔNG!');
    console.log('📧 Email admin:', email);
    console.log('🔐 Password:', password);
    console.log('🆔 UID:', userRecord.uid);
    console.log('\n💡 Bạn có thể đăng nhập với tài khoản này để truy cập admin panel');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdminUser();

// INSERT INTO customer (
//     firebase_id,
//     name,
//     email,
//     phone,
//     active
// ) VALUES (
//     '0oDVXMWOjFcGxW6eiWNzJUTav8s2',
//     'Admin User',
//     'admin@cleannow.com',
//     '0123456789', 
//     TRUE
// );
