const sequelize = require('../../config/db');
const Customer = require('../../models/customer');
const Service = require('../../models/service');
const Job = require('../../models/job');
const {QueryTypes} = require('sequelize');


const countUsers = async (req, res) => {
    let totalUsers = 0;
    try {
        totalUsers = await Customer.count();
    } catch (error) {
        totalUsers = -1;
    }

    let activeUsers = 0;
    try {
        activeUsers = await Customer.count({ where: { active: true } });
    } catch (error) {

    activeUsers = totalUsers > 0 ? totalUsers : 0;
    }
    // active=true được cập nhật khi user đăng nhập (POST /api/auth/session)
    // và đặt false khi logout (DELETE /api/auth/session)
    
    return res.json({
        totalUsers,
        activeUsers
    });
}

const countServices = async (req, res) => {
    let totalServices = 0;
    try {
        totalServices = await Service.count();
    } catch (error) {
        totalServices = -1;
    }

    let activeServices = 0;
    try {
        activeServices = await Service.count({ where: { status: 'active' } });
    } catch (error) {
        activeServices = -1;
    }

    return res.json({
        totalServices,
        activeServices
    });
}

const countJobs = async (req, res) => {
    let totalJobs = 0;
    try {
        totalJobs = await Job.count();
    } catch (error) {
        totalJobs = -1;
    }

    let inProgressJobs = 0;
    try {
        inProgressJobs = await Job.count({ where: { status: 'in_progress' } });
    } catch (error) {
        inProgressJobs = -1;
    }

    let pendingJobs = 0;
    try {
        pendingJobs = await Job.count({ where: { status: 'pending' } });
    } catch (error) {
        pendingJobs = -1;
    }

    let completedJobs = 0;
    try {
        completedJobs = await Job.count({ where: { status: 'completed' } });
    } catch (error) {
        completedJobs = -1;
    }

    let cancelledJobs = 0;
    try {
        cancelledJobs = await Job.count({ where: { status: 'cancelled' } });
    } catch (error) {
        cancelledJobs = -1;
    }

    return res.json({
        totalJobs,
        inProgressJobs,
        pendingJobs,
        completedJobs,
        cancelledJobs
    });
}

// /const count

module.exports = {
    countUsers,
    countServices,
    countJobs
};