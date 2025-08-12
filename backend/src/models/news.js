const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const News = sequelize.define('News', {
  news_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Nguồn: JupViec',
  },
}, {
  tableName: 'news',
  timestamps: false,
});

module.exports = News;
