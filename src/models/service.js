const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Service = sequelize.define(
    'Service',
    {
        service_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
        },
    },
    {
        tableName: 'service',
        timestamps: false,
    }
);

Service.removeAttribute('id');

module.exports = Service;
