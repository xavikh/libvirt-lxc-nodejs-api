'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const midauth = require('../middlewares/midAuth');

const lxc_templates = require('../services/lxcTemplateHelper');

const setErrorRes = require('../controllers/wrappers/errorsLibvirt').setErrorRes;
const setError = require('../controllers/wrappers/errorsLibvirt').setError;

const domains_lvirt = require('../controllers/wrappers/libvirtDomains_wrapper');
const volumes_lvirt = require('../controllers/wrappers/libvirtVolumes_wrapper');
const images = require('../controllers/wrappers/filesystem_wrapper');
const lxc = require('../controllers/wrappers/lxc_wrapper')();
const User = require('../models/user');

router.get('/signup', (req, res) => {
    return res.render('register');
});

router.get('/login', (req, res) => {
    return res.render('login');
});

router.get('/code', midauth, (req, res) => {
    return res.render('midauth_code');
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.redirect('/login');
});

router.get('/verify-telegram', /*midauth,*/ (req, res) => {
    return res.render('verify-telegram');
});

router.get('/dashboard', /*auth,*/ (req, res) => {
    res.redirect('/dashboard/vm');
});

router.get('/dashboard/vm', auth, (req, res) => {
    User.findById(req.user)
        .select("-_id")
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            domains_lvirt.getDomainInfoList((err, infos) => {
                if (err) return setErrorRes(res, err);
                let data = {
                    section: 'vm',
                    title: "CDWS",
                    domains: infos,
                    user: user
                };
                return res.render('index', {data: data});
            });
        });
});

router.get('/dashboard/vm/:name', auth, (req, res) => {
    let vm = {
        name: req.params.name
    };
    User.findById(req.user)
        .select("-_id")
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            domains_lvirt.getDomainInfo(vm, (err, info) => {
                if (err) return setErrorRes(res, err);
                images.isoList((err, isos) => {
                    if (err) return setErrorRes(res, err);
                    let data = {
                        section: 'vm',
                        title: "CDWS",
                        domain: info,
                        isos: isos,
                        user: user
                    };
                    return res.render('virtual_machine', {data: data});
                });
            });
        });
});

router.get('/dashboard/vol', auth, (req, res) => {
    User.findById(req.user)
        .select("-_id")
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            volumes_lvirt.getVolumesInfoList((err, vol_list) => {
                if (err) return setErrorRes(res, err);
                let data = {
                    section: 'vol',
                    title: "CDWS",
                    volumes: vol_list,
                    user: user
                };
                return res.render('volumes', {data: data});
            });
        });
});


router.get('/dashboard/images', auth, (req, res) => {
    User.findById(req.user)
        .select("-_id")
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            images.isoList((err, isos) => {
                console.log(err);
                if (err) return setErrorRes(res, setError(500, "A error occurred retrieving the images"));
                let data = {
                    section: 'images',
                    title: "CDWS",
                    isos: isos,
                    user: user
                };
                return res.render('images', {data: data});
            });
        });
});

router.get('/dashboard/ct', auth, (req, res) => {
    User.findById(req.user)
        .select("-_id")
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            lxc.list().then((infos) => {
                let data = {
                    section: 'ct',
                    title: "CDWS",
                    containers: infos,
                    templates: lxc_templates.getTemplates(),
                    user: user
                };
                return res.render('containers', {data: data});
            }).catch((err) => {
                return setErrorRes(res, err);
            });
        });
});

router.get('/console', auth, (req, res) => {
    let data = {};
    return res.render('console', {data: data});
});

module.exports = router;
