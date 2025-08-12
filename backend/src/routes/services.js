const express = require("express");
const router = express.Router();
const Service = require("../models/service");
const ServiceDetail = require("../models/service_detail");
const { Op } = require('sequelize');

console.log('Services router created successfully');

// Simple test route
router.get('/services', async (req, res) => {
  try {
    console.log('=== GET /api/services called ===');
    
    // Try to get from database first
    let services = [];
    try {
      const dbServices = await Service.findAll({
        where: { status: 'active' }
      });
      
      services = dbServices.map(service => ({ 
        id: service.service_id,
        name: service.name,
        description: service.description,
        type: service.type,
        image_url: service.image_url || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400',
        price_from: 50000,
        duration: '1-2 giờ',
        status: service.status || 'active'
      }));
      
      console.log(`Found ${services.length} services from database`);
    } catch (dbError) {
      console.log('Database error, using fallback:', dbError.message);
      // Fallback data if database fails
      services = [
        {
          id: 1,
          name: 'Giúp Việc Ca Lẻ',
          description: 'Dịch vụ giúp việc nhà theo giờ',
          type: 'household',
          image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400',
          price_from: 50000,
          duration: '2-8 giờ',
          status: 'active'
        },
        {
          id: 2,
          name: 'Dọn Dẹp Định Kỳ',
          description: 'Dịch vụ dọn dẹp nhà cửa định kỳ',
          type: 'cleaning',
          image_url: 'https://images.unsplash.com/photo-1627916575235-3bb591a350de?q=80&w=400',
          price_from: 200000,
          duration: '1-3 tháng',
          status: 'active'
        }
      ];
    }

    return res.json({
      success: true,
      source: services.length > 0 ? 'database' : 'fallback', 
      data: services
    });

  } catch (error) {
    console.error('❌ Error fetching services:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Lỗi server'
    });
  }
});
// ============== ADMIN ENDPOINTS ==============

// GET /api/services/admin - Admin view with all services
const getAdminServices = async (req, res) => {
  try {
    console.log('=== GET /api/services/admin called ===');
    
    const services = await Service.findAll(); // Admin xem tất cả, không filter status
    
    const transformedServices = services.map(service => ({
      id: service.service_id,
      name: service.name,
      description: service.description,
      type: service.type,
      image_url: service.image_url,
      status: service.status || 'active',
      details_count: 0 // Tạm thời set 0, sau sẽ load details
    }));

    const stats = {
      total: services.length,
      active: services.filter(s => s.status === 'active').length,
      inactive: services.filter(s => s.status === 'inactive').length
    };

  return res.json({
      success: true,
      source: 'database',
      data: transformedServices,
      stats
    });

  } catch (error) {
    console.error('❌ Error getting admin services:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách dịch vụ'
    });
  }
};

router.get('/services/admin', getAdminServices);
router.get('/admin/services', getAdminServices);

// Admin services stats for dashboard
router.get('/admin/services/stats', async (req, res) => {
  try {
    const total = await Service.count();
    const active = await Service.count({ where: { status: 'active' } });
    return res.json({ success: true, total, active });
  } catch (e) {
    console.error('❌ Error getting services stats:', e.message);
    return res.status(500).json({ success: false, error: 'Không thể lấy thống kê dịch vụ' });
  }
});

// POST /api/services - Create new service (Admin)
const createServiceHandler = async (req, res) => {
  try {
    console.log('=== POST create service called ===');
    const { name, description, type, image_url, status } = req.body;

    if (!name || !description || !type) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    const newService = await Service.create({
      name,
      description,
      type,
      image_url: image_url || null,
      status: status || 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ thành công',
      service: {
        id: newService.service_id,
        name: newService.name,
        description: newService.description,
        type: newService.type,
        image_url: newService.image_url,
        status: newService.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating service:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo dịch vụ',
      details: error.message
    });
  }
};

router.post('/services', createServiceHandler);
router.post('/admin/services', createServiceHandler);

// Get service details
router.get('/services/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== GET /api/services/:id/details called ===', id);
    
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy dịch vụ'
      });
    }

    const serviceDetails = await ServiceDetail.findAll({
      where: { service_id: id }
    });

    return res.json({
      success: true,
      service: {
        id: service.service_id,
        name: service.name,
        description: service.description,
        type: service.type
      },
      details: serviceDetails.map(detail => ({
        id: detail.service_detail_id,
        name: detail.name,
        type: detail.type,
        description: detail.description,
        price: detail.price,
        duration: detail.duration
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching service details:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy chi tiết dịch vụ'
    });
  }
});

// GET /api/services/:id - Lấy thông tin 1 dịch vụ theo id
router.get('/services/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const service = await Service.findByPk(id); // Sequelize ORM
    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/services/:id - Update service (Admin)
router.put('/admin/services/:id', async (req, res) => {
  try {
    console.log('=== PUT /api/admin/services/:id called ===', req.params.id);
    const { id } = req.params;
    const { name, description, type, image_url, status } = req.body;

    if (!name || !description || !type) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy dịch vụ'
      });
    }

    await service.update({
      name,
      description,
      type,
      image_url: image_url || service.image_url,
      status: status || service.status
    });

    return res.json({
      success: true,
      message: 'Cập nhật dịch vụ thành công',
      service: {
        id: service.service_id,
        name: service.name,
        description: service.description,
        type: service.type,
        image_url: service.image_url,
        status: service.status
      }
    });

  } catch (error) {
    console.error('❌ Error updating service:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể cập nhật dịch vụ',
      details: error.message
    });
  }
});

// DELETE /api/admin/services/:id - Delete service (Admin)
router.delete('/admin/services/:id', async (req, res) => {
  try {
    console.log('=== DELETE /api/admin/services/:id called ===', req.params.id);
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy dịch vụ'
      });
    }

    await service.destroy();

    return res.json({
      success: true,
      message: 'Xóa dịch vụ thành công'
    });

  } catch (error) {
    console.error('❌ Error deleting service:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Không thể xóa dịch vụ',
      details: error.message
    });
  }
});

console.log('About to export router');
module.exports = router;
