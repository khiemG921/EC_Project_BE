const Customer = require('../src/models/customer');

const admin = require('firebase-admin');
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

async function createFakeUsers(n) {
    for (let i = 0; i < n; i++) {
        try {
            // Tạo thông tin giả
            const name = faker.name.findName();
            const email = faker.internet.email(name.replace(/\s/g, ''));
            const password = 'Test123456!';
            const phone = faker.phone.phoneNumber('09########');
            const gender = faker.random.arrayElement(['male', 'female', 'other']);
            const dob = faker.date.past(30, new Date(2005, 0, 1));
            const avatar_url = faker.image.avatar();
            const reward_points = faker.datatype.number({ min: 0, max: 1000 });
            const favorite_services = faker.lorem.words(3).split(' ').join(';');
            const favorite_taskers = '';
            const blocked_taskers = '';
            const watchlist_services = JSON.stringify([faker.lorem.word(), faker.lorem.word()]);
            const tasker_application_status = 'none';
            const tasker_skills = '';
            const tasker_application_date = null;
            const active = true;

            // Tạo user trên Firebase
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
                phoneNumber: phone,
            });

            // Set custom claims nếu muốn
            await admin.auth().setCustomUserClaims(userRecord.uid, { roles: ['customer'] });

            // Insert vào bảng customer
            await Customer.create({
                firebase_id: userRecord.uid,
                name,
                date_of_birth: dob,
                avatar_url,
                gender,
                email,
                phone,
                reward_points,
                favorite_services,
                favorite_taskers,
                blocked_taskers,
                watchlist_services,
                tasker_application_status,
                tasker_skills,
                tasker_application_date,
                active,
            });

            console.log(`✅ Created user ${i + 1}: ${email} (${userRecord.uid})`);
        } catch (err) {
            console.error(`❌ Error creating user ${i + 1}:`, err.message);
        }
    }
    process.exit(0);
}

// Nhận số lượng user từ tham số dòng lệnh
// const n = parseInt(process.argv[2], 10) || 1;
const n = 1;
createFakeUsers(n);