'use strict';

const express = require ('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const vmCtrl = require ('../controllers/vm');

router.post('/', vmCtrl.createDomain);
router.get('/', vmCtrl.getDomainList);

router.get('/info', vmCtrl.getDomainInfoList);
router.get('/isos', vmCtrl.isoList);
router.put('/:name', vmCtrl.editDomain);
router.put('/:name/attach-cdrom', vmCtrl.editDomain);
router.put('/:name/detach-cdrom', vmCtrl.editDomain);
router.put('/:name/attach-disk', vmCtrl.editDomain);
router.put('/:name/detach-disk', vmCtrl.editDomain);
router.get('/:name/info', vmCtrl.getDomainInfo);
router.put('/:name/:status', vmCtrl.statusDomain);
// router.put('/:name', vmCtrl.attachDeviceTest);
// router.put('/:name', vmCtrl.attachDevice);
router.get('/:name', vmCtrl.getDomain);
router.delete('/:name', vmCtrl.removeDomain);

module.exports = router;