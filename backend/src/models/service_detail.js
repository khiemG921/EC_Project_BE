const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Service = require('./service');

const ServiceDetail = sequelize.define(
    'ServiceDetail',
    {
        service_detail_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: null,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        tableName: 'service_detail',
        timestamps: false,
    }
);

ServiceDetail.removeAttribute('id');

Service.hasMany(ServiceDetail, { foreignKey: 'service_id', as: 'details' });
ServiceDetail.belongsTo(Service, { foreignKey: 'service_id', as: 'parentService' });

module.exports = ServiceDetail;
