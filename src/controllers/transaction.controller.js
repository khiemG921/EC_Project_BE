const Transaction = require('../models/transaction');
const Customer    = require('../models/customer');

const createTransaction = async (req, res) => {
  try {
    // 1) Đọc Firebase UID từ middleware
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // 2) Tìm customer trong DB
    const customer = await Customer.findOne({
      where: { firebase_id: firebaseUid }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // 3) Lấy payload từ body
    const {
      transactionId,
      jobId,
      amount,
      platformFee,
      currency,
      paymentGateway,
      status,
      paidAt
    } = req.body;

    // 4) Tạo bản ghi transaction
    const tx = await Transaction.create({
      transaction_id: transactionId,
      customer_id:    customer.customer_id,
      job_id:         jobId,
      amount,
      platform_fee:   platformFee,
      currency,
      payment_gateway: paymentGateway,
      status,
      paid_at:        paidAt ? new Date(paidAt) : new Date()
    });

    return res.status(201).json(tx);
  } catch (err) {
    console.error('❌ createTransaction error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { createTransaction };