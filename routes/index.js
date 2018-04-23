'use strict';

const express = require('express');
const router = express.Router();

const mid_auth = require('../middlewares/midAuth');

const userCtrl = require('../controllers/user');

const lvirt = require('../controllers/libvirtAPI_wrapper');


//PUBLIC
router.post('/signUp', userCtrl.signUp);
router.post('/login', userCtrl.login);
router.get('/send-code', mid_auth, userCtrl.sendCode);
router.get('/verify-telegram-account', mid_auth, userCtrl.verifyTelegramAccount);
router.post('/verify-code', mid_auth, userCtrl.verifyCode);
router.get('/verify-email', userCtrl.verifyEmail);
router.get('/reset-password', userCtrl.restorePasswordRequest);
router.post('/reset-password', userCtrl.setNewPassword);

router.get('/', (req, res) => {
    lvirt.getDomainList((err, domains) => {
        if (err) return setErrorRes(res, err);
        return res.render('index',
            {
                data:{
                    title: "CDWS",
                    domains: [
                        {
                            name: "Vm1",
                            vcpu: 1,
                            ram: 2,
                            status: "Running"
                        },
                        {
                            name: "Vm2",
                            vcpu: 2,
                            ram: 4,
                            status: "Running"
                        }
                    ],
                    dd: domains
                }
            })
    })

});

module.exports = router;
