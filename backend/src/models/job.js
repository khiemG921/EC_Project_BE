const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Customer = require('./customer');
const Tasker = require('./tasker');
const Service = require('./service');
const ServiceDetail = require('./service_detail');

const Job = sequelize.define('Job', {
  job_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customer',
      key: 'customer_id'
    }
  },
  tasker_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  service_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  service_detail_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  noted: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'job',
  timestamps: false
});

Job.removeAttribute('id');

Customer.hasMany(Job, { foreignKey: 'customer_id' });
Job.belongsTo(Customer, { foreignKey: 'customer_id' });

Tasker.hasMany(Job, { foreignKey: 'tasker_id' });
Job.belongsTo(Tasker, { foreignKey: 'tasker_id' });

Job.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Service.hasMany(Job, { foreignKey: 'service_id', as: 'jobs' });

Job.belongsTo(ServiceDetail, { foreignKey: 'service_detail_id', as: 'job_service_detail' });

module.exports = Job;
