// Helper functions

const generateRandomId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}_${randomStr}`;
};

module.exports = {
    generateRandomId
};
