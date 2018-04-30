'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const vmCtrl = require('../controllers/vm');

router.post('/', vmCtrl.createDomain);
router.get('/', vmCtrl.getDomainList);

router.get('/info', vmCtrl.getDomainInfoList);
router.get('/isos', vmCtrl.isoList);
router.get('/:name', vmCtrl.getDomain);
router.put('/:name', vmCtrl.editDomain);
router.delete('/:name', vmCtrl.removeDomain);
router.put('/:name/attach-cdrom', vmCtrl.attachCdrom);
router.put('/:name/detach-cdrom', vmCtrl.detachCdrom);
router.put('/:name/attach-disk', vmCtrl.attachDisk);
router.put('/:name/detach-disk', vmCtrl.detachDisk);
router.get('/:name/volumes', vmCtrl.getMountedVolumes);
router.get('/:name/info', vmCtrl.getDomainInfo);
router.put('/:name/:status', vmCtrl.statusDomain);

module.exports = router;