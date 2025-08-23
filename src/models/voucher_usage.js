const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VoucherUsage = sequelize.define('VoucherUsage', {
  voucher_usage_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  voucher_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'voucher',
      key: 'voucher_id'
    }
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    references: {
      model: 'Transaction',
      key: 'transaction_id'
    }
  },
  used_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'voucher_usage',
  timestamps: false
});

VoucherUsage.removeAttribute('id');

module.exports = VoucherUsage;