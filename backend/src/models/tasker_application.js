const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TaskerApplication = sequelize.define(
    'TaskerApplication',
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        firebase_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatar_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        skills: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        application_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
        },
    },
    {
        tableName: 'tasker_applications',
        timestamps: true,
        createdAt: 'application_date',
        updatedAt: 'updated_at',
    }
);

module.exports = TaskerApplication;
