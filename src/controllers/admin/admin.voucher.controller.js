const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');


/**
 * GET /api/admin/vouchers
 * Lấy tất cả vouchers hệ thống
 */
exports.getAllVouchers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = 'all'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Base query conditions
    let searchCondition = '';
    let statusCondition = '';
    const replacements = { limit: parseInt(limit), offset };

    // Tìm kiếm theo voucher_code hoặc detail
    if (search) {
      searchCondition = ' AND (voucher_code LIKE :search OR detail LIKE :search)';
      replacements.search = `%${search}%`;
    }

    // Lọc theo trạng thái
    if (status === 'active') {
      statusCondition = ' AND expiry_date > NOW() AND is_active = true';
    } else if (status === 'expired') {
      statusCondition = ' AND (expiry_date <= NOW() OR is_active = false)';
    }

    console.log('🔍 Admin voucher query conditions:', { search, status, replacements });

    // Query vouchers (hệ thống)
    const vouchers = await sequelize.query(`
      SELECT 
        voucher_id,
        voucher_code,
        detail,
        discount_percentage,
        expiry_date,
        is_active,
        created_at,
        CASE 
          WHEN expiry_date <= NOW() OR is_active = false THEN 'expired'
          ELSE 'active'
        END as status,
        DATEDIFF(expiry_date, NOW()) as days_left
      FROM voucher 
      WHERE 1=1 ${searchCondition} ${statusCondition}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Count total
    const totalResult = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM voucher 
      WHERE 1=1 ${searchCondition} ${statusCondition}
    `, {
      replacements: search ? { search: replacements.search } : {},
      type: QueryTypes.SELECT
    });

    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    console.log('✅ Admin vouchers retrieved:', {
      total,
      current_page: parseInt(page),
      total_pages: totalPages,
      vouchers_count: vouchers.length
    });

    return res.json({
      success: true,
      data: vouchers,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error getting admin vouchers:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách voucher',
      details: error.message
    });
  }
};

/**
 * POST /api/admin/vouchers
 * Tạo voucher mới (hệ thống)
 */
exports.createVoucher = async (req, res) => {
  try {
    const { voucher_code, detail, discount_percentage, expiry_date } = req.body;

    // Validation
    if (!voucher_code || !discount_percentage || !expiry_date) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    if (discount_percentage < 1 || discount_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Phần trăm giảm giá phải từ 1-100%'
      });
    }

    // Kiểm tra ngày hết hạn phải trong tương lai
    const expiryDate = new Date(expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate <= today) {
      return res.status(400).json({
        success: false,
        error: 'Ngày hết hạn phải sau ngày hôm nay'
      });
    }

    // Kiểm tra voucher_code đã tồn tại chưa
    const existingVoucher = await sequelize.query(
      'SELECT voucher_code FROM voucher WHERE voucher_code = :code',
      {
        replacements: { code: voucher_code.toUpperCase() },
        type: QueryTypes.SELECT
      }
    );

    if (existingVoucher.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Mã voucher này đã tồn tại'
      });
    }

    // Tạo voucher mới (hệ thống)
    await sequelize.query(
      `INSERT INTO voucher (voucher_code, detail, discount_percentage, expiry_date, is_active, created_at) 
       VALUES (:voucher_code, :detail, :discount_percentage, :expiry_date, true, NOW())`,
      {
        replacements: {
          voucher_code: voucher_code.toUpperCase(),
          detail: detail || null,
          discount_percentage,
          expiry_date
        },
        type: QueryTypes.INSERT
      }
    );

    return res.status(201).json({
      success: true,
      message: `Đã tạo voucher hệ thống ${voucher_code.toUpperCase()} thành công`,
      data: {
        voucher_code: voucher_code.toUpperCase(),
        discount_percentage,
        expiry_date
      }
    });

  } catch (error) {
    console.error('❌ Error creating voucher:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi server khi tạo voucher',
      details: error.message
    });
  }
};

/**
 * PUT /api/admin/vouchers/:voucher_code
 * Cập nhật voucher (hệ thống)
 */
exports.updateVoucher = async (req, res) => {
  try {
    const { voucher_code } = req.params;
    const { detail, discount_percentage, expiry_date } = req.body;

    // Validation
    if (!discount_percentage || !expiry_date) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    if (discount_percentage < 1 || discount_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Phần trăm giảm giá phải từ 1-100%'
      });
    }

    // Kiểm tra ngày hết hạn phải trong tương lai
    const expiryDate = new Date(expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate <= today) {
      return res.status(400).json({
        success: false,
        error: 'Ngày hết hạn phải sau ngày hôm nay'
      });
    }

    // Kiểm tra voucher có tồn tại không
    const existingVoucher = await sequelize.query(
      'SELECT voucher_code FROM voucher WHERE voucher_code = :code',
      {
        replacements: { code: voucher_code },
        type: QueryTypes.SELECT
      }
    );

    if (existingVoucher.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Voucher không tồn tại'
      });
    }

    // Cập nhật voucher
    await sequelize.query(
      `UPDATE voucher 
       SET detail = :detail, discount_percentage = :discount_percentage, 
           expiry_date = :expiry_date
       WHERE voucher_code = :voucher_code`,
      {
        replacements: {
          detail: detail || null,
          discount_percentage,
          expiry_date,
          voucher_code
        },
        type: QueryTypes.UPDATE
      }
    );

    return res.json({
      success: true,
      message: `Đã cập nhật voucher hệ thống ${voucher_code}`,
      data: {
        voucher_code,
        discount_percentage,
        expiry_date
      }
    });

  } catch (error) {
    console.error('❌ Error updating voucher:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi server khi cập nhật voucher',
      details: error.message
    });
  }
};

/**
 * DELETE /api/admin/vouchers/:voucher_code
 * Xóa voucher (hệ thống)
 */
exports.deleteVoucher = async (req, res) => {
  try {
    const { voucher_code } = req.params;

    // Kiểm tra voucher có tồn tại không
    const existingVoucher = await sequelize.query(
      'SELECT voucher_code FROM voucher WHERE voucher_code = :code',
      {
        replacements: { code: voucher_code },
        type: QueryTypes.SELECT
      }
    );

    if (existingVoucher.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Voucher không tồn tại'
      });
    }

    // Xóa voucher
    await sequelize.query(
      'DELETE FROM voucher WHERE voucher_code = :voucher_code',
      {
        replacements: { voucher_code },
        type: QueryTypes.DELETE
      }
    );

    return res.json({
      success: true,
      message: `Đã xóa voucher hệ thống ${voucher_code} thành công`
    });

  } catch (error) {
    console.error('❌ Error deleting voucher:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi server khi xóa voucher',
      details: error.message
    });
  }
};

/**
 * GET /api/admin/vouchers/stats
 * Lấy thống kê vouchers (hệ thống)
 */
exports.getVoucherStats = async (req, res) => {
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

/**
 * GET /api/admin/vouchers/search
 * Tìm voucher theo mã hoặc mô tả
 */
exports.searchVouchers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    // Tìm kiếm theo voucher_code hoặc detail
    const vouchers = await sequelize.query(`
      SELECT 
        voucher_id,
        voucher_code,
        detail,
        discount_percentage,
        expiry_date,
        is_active,
        created_at,
        CASE 
          WHEN expiry_date <= NOW() OR is_active = false THEN 'expired'
          ELSE 'active'
        END as status,
        DATEDIFF(expiry_date, NOW()) as days_left
      FROM voucher
      WHERE voucher_code LIKE :query 
         OR detail LIKE :query
      ORDER BY created_at DESC
      LIMIT 50
    `, {
      replacements: { 
        query: `%${query}%`
      },
      type: QueryTypes.SELECT
    });

    return res.json({
      success: true,
      data: vouchers,
      total: vouchers.length,
      search_query: query
    });

  } catch (error) {
    console.error('❌ Error searching vouchers:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi server khi tìm kiếm voucher',
      details: error.message
    });
  }
};
