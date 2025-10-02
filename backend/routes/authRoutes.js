const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const authController = require('../controllers/authController');

// ensure your main app uses cookieParser() as well
router.use(cookieParser());

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh); // expects refresh token cookie

module.exports = router;