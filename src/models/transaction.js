const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./job');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'job',
      key: 'job_id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('VND', 'USD'),
    defaultValue: 'VND'
  },
  payment_gateway: {
    type: DataTypes.ENUM('Momo', 'Paypal', 'Bank_Transfer'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'transaction',
  timestamps: false
});

// Remove default 'id' attribute since we use 'transaction_id'
Transaction.removeAttribute('id');

// Set up associations
Job.hasMany(Transaction, { foreignKey: 'job_id' });
Transaction.belongsTo(Job, { foreignKey: 'job_id' });

module.exports = Transaction;