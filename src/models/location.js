const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Customer = require('./customer');

const Location = sequelize.define('Location', {
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  longtitude: {
    type: DataTypes.DECIMAL(20, 16),
  allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(20, 16),
  allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
  allowNull: true
  },
  district: {
    type: DataTypes.STRING(100),
  allowNull: true
  },
  detail: {
    type: DataTypes.STRING(255),
  allowNull: true
  }
}, {
  tableName: 'location',
  timestamps: false
});

Location.removeAttribute('id');
Customer.hasMany(Location, { foreignKey: 'customer_id' });
Location.belongsTo(Customer, { foreignKey: 'customer_id' });

module.exports = Location;
