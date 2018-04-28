'use strict';

const express = require('express');
const router = express.Router();

const mid_auth = require('../middlewares/midAuth');

const userCtrl = require('../controllers/user');

//PUBLIC
router.post('/signUp', userCtrl.signUp);
router.post('/login', userCtrl.login);
router.get('/send-code', mid_auth, userCtrl.sendCode);
router.get('/verify-telegram-account', mid_auth, userCtrl.verifyTelegramAccount);
router.post('/verify-code', mid_auth, userCtrl.verifyCode);
router.get('/verify-email', userCtrl.verifyEmail);
router.get('/reset-password', userCtrl.restorePasswordRequest);
router.post('/reset-password', userCtrl.setNewPassword);

module.exports = router;
