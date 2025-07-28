const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signUp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/set-password', authController.setPassword);
router.post('/signin', authController.SignIn);
router.post('/signout', authController.SignOut);
router.get('/user/:id', authController.getUserDetails);

module.exports = router;