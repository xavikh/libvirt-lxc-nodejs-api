'use strict';

const express = require ('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const volCtrl = require ('../controllers/vol');

router.post('/', volCtrl.createVolume);
router.get('/', volCtrl.getVolumeList);
router.get('/:name', volCtrl.getVolume);
router.delete('/:name', volCtrl.removeVolume);
router.post('/clone/:name', volCtrl.cloneVolume)

module.exports = router;