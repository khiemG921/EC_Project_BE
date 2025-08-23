const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    timezone: "+07:00", // Thiết lập múi giờ Việt Nam
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