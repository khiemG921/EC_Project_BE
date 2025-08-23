const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Voucher = sequelize.define('Voucher', {
  voucher_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  voucher_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  detail: DataTypes.TEXT,
  discount_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  service_ids: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'voucher',
  timestamps: false
});


Voucher.removeAttribute('id');

module.exports = Voucher;
