const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Customer = sequelize.define(
  "Customer",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    avatar_url: DataTypes.STRING,
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      defaultValue: "other",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    reward_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    favorite_services: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    favorite_taskers: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    blocked_taskers: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // List of service_ids the user added to their watchlist (JSON array of strings)
    watchlist_services: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tasker_application_status: {
      type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
      defaultValue: 'none',
    },
    tasker_skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tasker_application_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "customer",
    timestamps: false,
  }
);

Customer.removeAttribute('id');

module.exports = Customer;