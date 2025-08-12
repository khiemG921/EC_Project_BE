const {getAllUser,createUser,updateUser, deleteUser, setUserRole} = require('../../controllers/admin/admin.users.controller');

const express = require('express');
const router = express.Router();

router.get('/getAllUser', getAllUser);
router.post('/createUser', createUser);
router.put('/updateUser/:userId', updateUser);
router.delete('/deleteUser/:userId', deleteUser);
router.post('/setRole/:userId', setUserRole);

module.exports = router;