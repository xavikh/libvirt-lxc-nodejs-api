'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const ctCtrl = require('../controllers/ct');

router.post('/', ctCtrl.create);
router.get('/', ctCtrl.list);

router.get('/:name', ctCtrl.getInfo);
router.put('/:name', ctCtrl.edit);
router.delete('/:name', ctCtrl.remove);
router.put('/:name/exec', ctCtrl.exec);
router.put('/:name/:status', ctCtrl.changeStatus);

module.exports = router;