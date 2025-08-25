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
  console.error('Lỗi khi lấy reviews (/api/reviews):', err?.message || err);
  res.status(500).json({ message: 'Không thể tải reviews', details: err?.message || String(err) });
  }
});
// Tạo review mới
router.post('/', async (req, res) => {
  try {
    const { customer_id, job_id, service_id, type, rating_job, rating_tasker, detail } = req.body || {};
    // Coerce types
    const cid = Number(customer_id);
    const jid = job_id == null || job_id === '' ? null : Number(job_id);
    const sid = service_id == null || service_id === '' ? null : Number(service_id);
    const rj = Number(rating_job);
    const rt = rating_tasker == null || rating_tasker === '' ? rj : Number(rating_tasker);

    if (!Number.isFinite(cid) || cid <= 0) {
      return res.status(400).json({ message: 'customer_id không hợp lệ' });
    }
    if (!Number.isFinite(rj) || rj < 1 || rj > 5) {
      return res.status(400).json({ message: 'rating_job phải là số từ 1 đến 5' });
    }
    if (!Number.isFinite(rt) || rt < 1 || rt > 5) {
      return res.status(400).json({ message: 'rating_tasker phải là số từ 1 đến 5' });
    }

    // Validate customer exists (avoid FK surprises)
    const customer = await Customer.findByPk(cid);
    if (!customer) return res.status(400).json({ message: 'customer_id không tồn tại' });

    const payload = {
      customer_id: cid,
      job_id: jid, // allow public reviews without job
      service_id: sid, // can be null for legacy/public, but FE should send when known
      type: type || null,
      rating_job: rj,
      rating_tasker: rt,
      detail: String(detail || '').slice(0, 2000),
    };

    const newReview = await Review.create(payload);
    return res.status(201).json({ message: 'Review created successfully', review_id: newReview.review_id });
  } catch (err) {
    console.error('Create review error:', err);
    // Detect FK error to job when provided but not valid
    if (err?.name === 'SequelizeForeignKeyConstraintError' && err?.index?.includes('fk_review_job')) {
      return res.status(400).json({ message: 'job_id không hợp lệ hoặc không tồn tại', code: 'FK_JOB' });
    }
    return res.status(500).json({ message: 'Đã có lỗi xảy ra khi tạo review', error: err?.message || String(err) });
  }
});
router.get('/service/:serviceId', async (req, res) => {
  const rawId = req.params.serviceId;
  const serviceId = Number(rawId);
  if (!Number.isFinite(serviceId)) {
    return res.status(400).json({ message: 'serviceId không hợp lệ' });
  }
  try {
    // Try with association include first
    const reviews = await Review.findAll({
      where: { service_id: serviceId },
      include: [{
        model: Customer,
        attributes: ['customer_id', 'name', 'avatar_url'],
        required: false,
      }],
    });
    return res.json(reviews);
  } catch (err) {
    console.error('GET /api/reviews/service/:serviceId include error:', err?.message || err);
    try {
      // Fallback: fetch reviews then attach customers manually
      const rows = await Review.findAll({ where: { service_id: serviceId } });
      const ids = Array.from(new Set(rows.map(r => r.customer_id).filter(Boolean)));
      let customersById = {};
      if (ids.length) {
        const customers = await Customer.findAll({ where: { customer_id: ids } });
        customersById = Object.fromEntries(customers.map(c => [c.customer_id, {
          customer_id: c.customer_id,
          name: c.name,
          avatar_url: c.avatar_url,
        }]));
      }
      const merged = rows.map(r => ({
        ...r.toJSON(),
        Customer: customersById[r.customer_id] || null,
      }));
      return res.json(merged);
    } catch (e2) {
      console.error('GET /api/reviews/service/:serviceId fallback error:', e2?.message || e2);
      return res.status(500).json({ message: 'Không thể tải đánh giá dịch vụ', details: e2?.message || String(e2) });
    }
  }
});


module.exports = router;
