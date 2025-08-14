// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   charset: 'utf8_general_ci',
// });

// module.exports = pool;

// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//   'e_commerce',      // database
//   'admin123',        // user
//   'admin123',        // password
//   {
//     host: 'localhost', // Nếu backend chạy ngoài Docker, dùng 'localhost'. Nếu chạy trong container khác, dùng 'mysql'
//     port: 3306,
//     dialect: "mysql",
//     dialectOptions: {
//       charset: 'utf8mb4',
//     },
//     define: {
//       charset: 'utf8mb4',
//       collate: 'utf8mb4_unicode_ci',
//     }
//   }
// );

// // Kiểm tra kết nối (không crash app nếu fail)
// sequelize
// .authenticate()
// .then(() => console.log('✅ Đã kết nối đến MySQL thành công'))
// .catch(err => {
//   console.error('❌ Không thể kết nối đến MySQL:', err.message);
//   console.log('⚠️  Server sẽ chạy mà không có MySQL');
// });

// module.exports = sequelize;


const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  }
);

// Kiểm tra kết nối (không crash app nếu fail)
sequelize
  .authenticate()
  .then(() => console.log('✅ Đã kết nối đến MySQL thành công'))
  .catch(err => {
    console.error('❌ Không thể kết nối đến MySQL:', err.message);
    console.log('⚠️  Server sẽ chạy mà không có MySQL');
  });

module.exports = sequelize;