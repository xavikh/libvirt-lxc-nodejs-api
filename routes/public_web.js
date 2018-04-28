'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const lvirt = require('../controllers/libvirtAPI_wrapper');


//PUBLIC
router.get('/signup', (req, res) => {
    return res.render('register');
});

router.get('/login', (req, res) => {
    return res.render('login');
});

router.get('/code', (req, res) => {
    return res.render('midauth_code');
});

router.get('/dashboard', /*auth,*/ (req, res) => {
    lvirt.getDomainInfoList((err, infos) => {
        if (err) return setErrorRes(res, err);
        let data = {
            title: "CDWS",
            domains: infos
        };
        return res.render('index', {data : data});
    });
});

router.get('/dashboard/vm', /*auth,*/ (req, res) => {
    lvirt.getDomainInfoList((err, infos) => {
        if (err) return setErrorRes(res, err);
        let data = {
            title: "CDWS",
            domains: infos
        };
        return res.render('index', {data : data});
    });
});

module.exports = router;
