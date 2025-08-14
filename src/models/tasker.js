const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tasker = sequelize.define(
    'Tasker',
    {
        tasker_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firebase_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatar_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        skills: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        job_completed: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        worked_hours: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        ranking: {
            type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
            defaultValue: 'bronze',
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: 'tasker',
        timestamps: false,
    }
);

Tasker.removeAttribute('id');

module.exports = Tasker;
