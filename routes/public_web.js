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
    domains_lvirt.getDomainInfoList((err, infos) => {
        if (err) return setErrorRes(res, err);
        let promises = infos.map((info) => {
            return new Promise((resolve, reject) => {
                volumes_lvirt.populateVolumesInfo(info, (err, popInfo) => {
                    if(err) reject(err);
                    info.volumes = popInfo;
                    resolve(info);
                });
            });
        });
        Promise.all(promises).then((infos) => {
            let data = {
                title: "CDWS",
                domains: infos
            };
            return res.render('index', {data : data});
        }).catch((err) => {
            return res.status(500).send(err);
        });
    });
});

router.get('/dashboard/vm', /*auth,*/ (req, res) => {
    domains_lvirt.getDomainInfoList((err, infos) => {
        if (err) return setErrorRes(res, err);
        let promises = infos.map((info) => {
            return new Promise((resolve, reject) => {
                volumes_lvirt.populateVolumesInfo(info, (err, popInfo) => {
                    if(err) reject(err);
                    info.volumes = popInfo;
                    resolve(info);
                });
            });
        });
        Promise.all(promises).then((infos) => {
            let data = {
                title: "CDWS",
                domains: infos
            };
            return res.render('index', {data : data});
        }).catch((err) => {
            return res.status(500).send(err);
        });
    });
});

module.exports = router;
