const { Op } = require('sequelize');
const Voucher = require('../models/voucher');

/**
 * GET /api/vouchers
 * Query params:
 *   - search: từ khóa (voucher_code/detail)
 *   - discount: phần trăm giảm giá 
 *   - status: 'active' | 'expired'
 */
const getVouchers = async (req, res) => {
  try {
    const { search = '', discount, status } = req.query;

    // 1) Đọc Firebase UID từ middleware
    const firebaseUid = req.user?.uid;
    let where = {};

    // Build điều kiện tìm kiếm
    if (search) {
      where.voucher_code = { [Op.like]: `%${search}%` };
    }
    if (discount !== undefined && discount !== '') {
      where.discount_percentage = Number(discount);
    }
    if (status === 'active') {
      where.expiry_date = { [Op.gt]: new Date() };
    } else if (status === 'expired') {
      where.expiry_date = { [Op.lte]: new Date() };
    }

    // Lấy dữ liệu
    const vouchers = await Voucher.findAll({
      where,
      order: [['expiry_date', 'DESC']],
      raw: true
    });

    console.log(`✅ Found ${vouchers.length} vouchers for conditions:`, where);
    return res.json(vouchers);
  } catch (err) {
    console.error('❌ Lỗi getVouchers:', err);
    return res.status(500).json({ error: err.message });
  }
};


const getVoucherStats = async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN expiry_date > NOW() AND is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN expiry_date <= NOW() OR is_active = false THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN expiry_date > NOW() AND is_active = true AND DATEDIFF(expiry_date, NOW()) <= 7 THEN 1 ELSE 0 END) as expiring_soon,
        AVG(discount_percentage) as avg_discount
      FROM voucher
    `, {
      type: QueryTypes.SELECT
    });

    return res.json({
      success: true,
      data: {
        total: parseInt(stats[0].total),
        active: parseInt(stats[0].active),
        expired: parseInt(stats[0].expired),
        expiring_soon: parseInt(stats[0].expiring_soon),
        avg_discount: parseFloat(stats[0].avg_discount) || 0
      }
    });

  } catch (error) {
    console.error('❌ Error getting voucher stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy thống kê voucher',
      details: error.message
    });
  }
};


getVoucherSummary = async (req, res) => {
  try {
    const now = new Date();
    const soon = new Date(); soon.setDate(now.getDate() + 7);

    const [total, active, expiringSoon, expired] = await Promise.all([
      Voucher.count(),
      Voucher.count({ where: { expiry_date: { [Op.gt]: now }, is_active: true } }),
      Voucher.count({
        where: {
          expiry_date: { [Op.gt]: now, [Op.lte]: soon },
          is_active: true
        }
      }),
      Voucher.count({
        where: {
          [Op.or]: [
            { expiry_date: { [Op.lte]: now } },
            { is_active: false }
          ]
        }
      })
    ]);

    return res.json({
      total,
      active,
      expiring_soon: expiringSoon,
      expired,
      generated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('getVoucherSummary error:', e);
    return res.status(500).json({ error: 'Không lấy được thống kê voucher' });
  }
};


module.exports = {
  getVouchers,
  getVoucherStats,
  getVoucherSummary
};