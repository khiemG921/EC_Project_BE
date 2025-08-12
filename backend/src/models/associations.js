const Service = require('./service');
const ServiceDetail = require('./service_detail');
const TaskerApplication = require('./tasker_application');
const Customer = require('./customer');
const Tasker = require('./tasker');

// Thiết lập relationships
Service.hasMany(ServiceDetail, {
    foreignKey: 'service_id',
    as: 'ServiceDetails'
});

ServiceDetail.belongsTo(Service, {
    foreignKey: 'service_id',
    as: 'Service'
});

// TaskerApplication associations
TaskerApplication.belongsTo(Customer, {
    foreignKey: 'firebase_id',
    targetKey: 'firebase_id',
    as: 'Customer'
});

module.exports = {
    Service,
    ServiceDetail,
    TaskerApplication,
    Customer,
    Tasker
};
