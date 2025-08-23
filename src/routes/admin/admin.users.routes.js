const { getAllUser, createUser, updateUser, deleteUser, setUserRole, grantRole, revokeRole } = require('../../controllers/admin/admin.users.controller');
const { adminOnly } = require('../../middleware/auth.middle');
const express = require('express');
const router = express.Router();

// Áp dụng bảo vệ admin cho toàn bộ router
router.use(adminOnly);

router.get('/getAllUser', getAllUser);
router.post('/createUser', createUser);
router.put('/updateUser/:userId', updateUser);
router.delete('/deleteUser/:userId', deleteUser);
router.post('/setRole/:userId', setUserRole);
router.post('/grantRole/:userId', grantRole);
router.post('/revokeRole/:userId', revokeRole);

module.exports = router;