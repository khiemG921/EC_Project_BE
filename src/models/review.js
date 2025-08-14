const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Customer = require('./customer');

const Review = sequelize.define('Review', {
  review_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  service_id: {                               
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: DataTypes.TEXT,
  rating_job: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  rating_tasker: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  detail: DataTypes.TEXT
}, {
  tableName: 'review',
  timestamps: false
});

Review.removeAttribute('id');
Customer.hasMany(Review, { foreignKey: 'customer_id' });
Review.belongsTo(Customer, { foreignKey: 'customer_id' });

module.exports = Review;
