const ServiceDetail = require('../models/service_detail');

const getPriceList = async (req, res) => {
    const { service_id, ids } = req.body;
    const where = { service_id };
    if (Array.isArray(ids) && ids.length) {
        where.service_detail_id = ids;
    }
    try {
        const list = await ServiceDetail.findAll({
            where,
            attributes: [['service_detail_id', 'id'], 'name', 'price'],
            order: [['service_detail_id', 'ASC']],
        });
        return res.json(list);
    } catch (err) {
        console.error('❌ Lỗi khi lấy bảng giá', err);
        return res.status(500).json({ error: 'Lỗi server.' });
    }
};

module.exports = {
    getPriceList
};
