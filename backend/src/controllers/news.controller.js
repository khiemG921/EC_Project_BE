const News = require('../models/news');
const { Op } = require('sequelize');

// Lấy danh sách tin tức, search và phân trang, trả về tổng số bản ghi
exports.getAllNews = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10 } = req.query;
        const where = search
            ? { title: { [Op.like]: `%${search}%` } }
            : {};
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { rows: news, count: total } = await News.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            offset,
            limit: parseInt(limit)
        });
        // // Decode utf8 cho text
        // const decodedNews = news.map(n => ({
        //     ...n.toJSON(),
        //     title: n.title ? Buffer.from(n.title, 'binary').toString('utf8') : n.title,
        //     content: n.content ? Buffer.from(n.content, 'binary').toString('utf8') : n.content,
        //     source: n.source ? Buffer.from(n.source, 'binary').toString('utf8') : n.source,
        // }));
        res.json({ news, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy chi tiết tin tức
exports.getNewsById = async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);
        if (!news) return res.status(404).json({ error: 'Not found' });
        // Decode utf8 cho các trường text
        // const decoded = {
        //     ...news.toJSON(),
        //     title: news.title ? Buffer.from(news.title, 'binary').toString('utf8') : news.title,
        //     content: news.content ? Buffer.from(news.content, 'binary').toString('utf8') : news.content,
        //     source: news.source ? Buffer.from(news.source, 'binary').toString('utf8') : news.source,
        // };
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Thêm mới tin tức
exports.createNews = async (req, res) => {
    try {
        const { title, content, image_url, source } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung' });
        const news = await News.create({
            title,
            content,
            image_url,
            source,
            created_at: new Date()
        });
        res.status(201).json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Sửa tin tức
exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image_url, source } = req.body;
        const news = await News.findByPk(id);
        if (!news) return res.status(404).json({ error: 'Not found' });
        await news.update({ title, content, image_url, source }); 
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Xóa tin tức
exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findByPk(id);
        if (!news) return res.status(404).json({ error: 'Not found' });
        await news.destroy();
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};