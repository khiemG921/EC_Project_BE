// const db = require('../config/db');
// /**
//  * GET /api/vouchers
//  * Query params:
//  *   - search: từ khóa (voucher_code/detail)
//  *   - discount: phần trăm giảm giá 
//  *   - status: 'active' | 'expired'
//  */
// exports.getVouchers = async (req, res) => {
//   try {
//     const { search = '', discount, status } = req.query;
//     let sql = 'SELECT * FROM voucher WHERE 1=1';
//     const params = [];

//     if (search) {
//       sql += ' AND (voucher_code LIKE ? OR detail LIKE ?)';
//       params.push(`%${search}%`, `%${search}%`);
//     }
//     if (discount) {
//       sql += ' AND discount_percentage = ?';
//       params.push(Number(discount));
//     }
//     if (status === 'active') {
//       sql += ' AND expiry_date > NOW()';
//     } else if (status === 'expired') {
//       sql += ' AND expiry_date <= NOW()';
//     }

//     sql += ' ORDER BY expiry_date DESC';
//     const [rows] = await db.query(sql, params);
//     // decode details to utf8mb4
//     rows.forEach(row => {
//       if (row.detail) {
//         row.detail = Buffer.from(row.detail, 'latin1').toString('utf-8');
//       }
//     });

//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


const { Op } = require('sequelize');
const Voucher = require('../models/voucher');

/**
 * GET /api/vouchers
 * Query params:
 *   - search: từ khóa (voucher_code/detail)
 *   - discount: phần trăm giảm giá 
 *   - status: 'active' | 'expired'
 */
exports.getVouchers = async (req, res) => {
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