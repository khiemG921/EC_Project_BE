const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const Customer = require('../models/customer');

// GET /api/reviews — Lấy tất cả reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        {
          model: Customer,
          attributes: ['customer_id', 'name', 'avatar_url']
        }
      ]
    });
    res.json(reviews);
  } catch (err) {
    console.error('Lỗi khi lấy reviews:', err);
    res.status(500).json({ message: err.message });
  }
});
// Tạo review mới
router.post('/', async (req, res) => {
    try {
        const { customer_id, job_id, service_id, type, rating_job, rating_tasker, detail } = req.body;

        const newReview = await Review.create({
            customer_id,
            job_id,
            service_id,
            type,
            rating_job,
            rating_tasker,
            detail
        });

        res.status(201).json({
            message: 'Review created successfully',
            review: newReview
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Đã có lỗi xảy ra khi tạo review', error: err.message });
    }
});
router.get('/service/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const reviews = await Review.findAll({
      where: { service_id: serviceId },
      include: {
        model: Customer,
        attributes: ['customer_id', 'name', 'avatar_url'],
      },
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
