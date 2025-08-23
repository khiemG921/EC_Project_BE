const { Op } = require('sequelize');
const Transaction = require('../models/transaction');
const Customer    = require('../models/customer');

const Voucher = require('../models/voucher');
const VoucherUsage = require('../models/voucher_usage');
const sequelize = require('../config/db');

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
      paidAt,
      voucher_code
    } = req.body;

    // 4) Create records inside a DB transaction to keep consistency
    const result = await sequelize.transaction(async (t) => {
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
      }, { transaction: t });
        

      if (voucher_code) {
        const v = await Voucher.findOne({
          where: { voucher_code, expiry_date: { [Op.gt]: new Date() } },
          transaction: t,
        });
        if (v) {
          if (transactionId) {
            await VoucherUsage.create({ voucher_id: v.voucher_id, transaction_id: transactionId }, { transaction: t });
          }
          v.used_count = (v.used_count || 0) + 1;
          await v.save({ transaction: t });
        }
      }

      return tx;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('❌ createTransaction error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { createTransaction };