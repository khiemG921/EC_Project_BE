const express = require('express');
const verifyToken = require('../middleware/auth.middle');
const { createLocation, getLocation, autocompleteLocation, reverseGeocoding, forwardGeocoding } = require('../controllers/location.controller');
// const auth = require('../middleware/auth');  // middleware gán req.user
const router = express.Router();

router.post('/location/create', verifyToken, createLocation);

router.get('/location/get', verifyToken, getLocation);

router.post('/location/autocomplete', autocompleteLocation);

router.post('/location/reverse', reverseGeocoding);

router.post('/location/forward', forwardGeocoding);

module.exports = router;