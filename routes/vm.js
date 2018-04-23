'use strict';

const express = require ('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const vmCtrl = require ('../controllers/vm');

router.post('/', vmCtrl.createDomain);
router.get('/', vmCtrl.getDomainList);
router.get('/isos', vmCtrl.isoList);
router.get('/:name/status', vmCtrl.getDomainStatus);
router.put('/:name/:status', vmCtrl.statusDomain);
router.put('/:name', vmCtrl.attachDevice);
router.get('/:name', vmCtrl.getDomain);
router.delete('/:name', vmCtrl.removeDomain);

module.exports = router;