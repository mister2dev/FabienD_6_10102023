const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');

const checkPassword = require('../middleware/password-validator');
const checkEmail = require("../middleware/email-validator");

router.post('/signup', checkEmail, checkPassword, userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;