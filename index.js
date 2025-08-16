require('dotenv').config();
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');

// ============== DATABASE CONNECTIONS ==============

// FOR LOCAL MYSQL (Sequelize)
const sequelize = require('./src/config/db');

const app = express();

// ============== MIDDLEWARES ==============
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors());

app.use(express.json());
app.use(cookieParser());

// Request logging middleware (chỉ log khi không phải verify)
app.use((req, res, next) => {
  if (req.path !== '/api/auth/verify') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }
  next();
});

// ============== ROUTES ==============
const authRoutes = require('./src/routes/auth.routes.js');
const customerRoutes = require('./src/routes/customer.routes');
const checkoutRoutes = require('./src/routes/checkout.routes.js');
const locationRoutes = require('./src/routes/location.routes.js');
const dashboardRoutes = require('./src/routes/dashboard.routes.js');
const newsRoutes = require('./src/routes/news.routes.js');
const forgotPasswordRoutes = require('./src/routes/forgot-password.routes.js');
const profileRoutes = require('./src/routes/profile.routes.js');
const favoriteRoutes = require('./src/routes/favourite.routes.js');
const paymentRoutes = require('./src/routes/payment.routes.js');
const jobRoutes = require('./src/routes/job.routes.js');
const taskerJobsRoutes = require('./src/routes/tasker.jobs.routes.js');
const transactionRoutes = require('./src/routes/transaction.routes.js');
const servicesRoutes = require('./src/routes/services.js');
const vouchersRoutes = require('./src/routes/vouchers.routes.js');
const priceListRoutes = require('./src/routes/price_list.routes.js');
const reviewRoutes = require('./src/routes/review.routes.js');
const watchlistRoutes = require('./src/routes/watchlistRoutes');

const taskerApplicationRoutes = require('./src/routes/tasker_application.routes.js');
const crawlerRoutes = require('./src/routes/crawler.routes.js');
const crawlerService = require('./src/services/crawler.service');
const newsImportRoutes = require('./src/routes/newsImport.routes.js');

const adminJobsRoutes = require('./src/routes/admin/admin.jobs.routes.js');
const adminUserRoutes = require('./src/routes/admin/admin.users.routes.js');
const adminVouchersRoutes = require('./src/routes/admin/admin.voucher.routes.js');
const adminStatisticsRoutes = require('./src/routes/admin/admin.statistics.routes.js');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/tasker', taskerJobsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.use('/api/', servicesRoutes);
app.use('/api/', checkoutRoutes);
app.use('/api/', customerRoutes);
app.use('/api/', locationRoutes);
app.use('/api/', priceListRoutes);
app.use('/api/', paymentRoutes);
app.use('/api/', jobRoutes);
app.use('/api/', transactionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vouchers', vouchersRoutes);

app.use('/api/tasker-applications', taskerApplicationRoutes);
app.use('/api/crawler', crawlerRoutes);
app.use('/api/news-import', newsImportRoutes);

app.use('/api/admin/jobs', adminJobsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/vouchers', adminVouchersRoutes);
app.use('/api/admin/statistics', adminStatisticsRoutes);

// ============== API HEALTH CHECK ==============
app.get('/api/', (req, res) => res.send('API đang chạy.'));

// ============== START SERVER ==============
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/`);
  try {
    crawlerService.init();
    console.log('Crawler service initialized');
  } catch (e) {
    console.error('Failed to init crawler service', e);
  }
});

// ============== GRACEFUL SHUTDOWN ==============
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await server.close();

  // 💻 FOR LOCAL MYSQL
  try {
    await sequelize.close();
    console.log('🔌 Đã đóng kết nối MySQL (Sequelize).');
  } catch (err) {
    console.log('⚠️  MySQL đã đóng hoặc không kết nối.');
  }

  process.exit(0);
});