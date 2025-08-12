const { Service, ServiceDetail } = require('../models/associations');
const { serviceCache } = require('../routes/services'); // Thêm ở đầu file nếu chưa có

// Lấy tất cả services
const getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            include: [{
                model: ServiceDetail,
                as: 'ServiceDetails'
            }]
        });
        // Filter chỉ lấy services có status là 'active' hoặc không có status (backward compatibility)
        const activeServices = services.filter(service => 
            !service.status || service.status === 'active'
        );
        res.json({
            data: activeServices,
            message: 'Lấy danh sách dịch vụ thành công'
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            error: 'Không thể lấy danh sách dịch vụ',
            details: error.message
        });
    }
};

// Tạo service mới
const createService = async (req, res) => {
    try {
        const { name, description, type, status, image_url, basePrice } = req.body;

        if (!name || !description || !type) {
            return res.status(400).json({
                error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        const newService = await Service.create({
            name,
            description,
            type,
            status: status || 'active',
            image_url: image_url || null,
        });

        // Refresh cache
        const all = await Service.findAll({
            include: [{
                model: ServiceDetail,
                as: 'ServiceDetails'
            }]
        });
        serviceCache.set("all_services", all);

        res.status(201).json({
            message: 'Tạo dịch vụ thành công',
            service: newService
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({
            error: 'Không thể tạo dịch vụ',
            details: error.message
        });
    }
};

// Cập nhật service
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, status, image_url } = req.body;

        if (!name || !description || !type) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
        }

        await service.update({
            name,
            description,
            type,
            status,
            image_url
        });

        // Refresh cache
        const all = await Service.findAll({
            include: [{
                model: ServiceDetail,
                as: 'ServiceDetails'
            }]
        });
        serviceCache.set("all_services", all);

        res.json({
            message: 'Cập nhật dịch vụ thành công',
            service: service
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Không thể cập nhật dịch vụ', details: error.message });
    }
};

// Xóa service
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
        }

        await service.destroy();

        // Refresh cache
        const all = await Service.findAll({
            include: [{
                model: ServiceDetail,
                as: 'ServiceDetails'
            }]
        });
        serviceCache.set("all_services", all);

        res.json({
            message: 'Xóa dịch vụ thành công'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({
            error: 'Không thể xóa dịch vụ',
            details: error.message
        });
    }
};

module.exports = {
    getAllServices,
    createService,
    updateService,
    deleteService
};
