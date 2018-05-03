'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const volCtrl = require('../controllers/vol');

router.post('/', volCtrl.createVolume);
router.get('/', volCtrl.getVolumeList);
router.get('/info', volCtrl.getVolumeInfoList);
router.get('/:name', volCtrl.getVolumeInfo);
router.delete('/:name', volCtrl.removeVolume);
router.post('/:name/clone', volCtrl.cloneVolume);

module.exports = router;