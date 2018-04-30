'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const domains_lvirt = require('../controllers/wrappers/libvirtDomains_wrapper');
const volumes_lvirt = require('../controllers/wrappers/libvirtVolumes_wrapper');


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
    res.redirect('/dashboard/vm');
});

router.get('/dashboard/vm', /*auth,*/ (req, res) => {
    domains_lvirt.getDomainInfoList((err, infos) => {
        if (err) return setErrorRes(res, err);
        let data = {
            title: "CDWS",
            domains: infos
        };
        return res.render('index', {data: data});
    });
});

router.get('/dashboard/vm/:name', /*auth,*/ (req, res) => {
    let vm = {
        name: req.params.name
    };

    domains_lvirt.getDomainInfo(vm, (err, info) => {
        let data = {
            title: "CDWS",
            domain: info
        };
        return res.render('virtual_machine', {data: data});
    })
});

module.exports = router;
