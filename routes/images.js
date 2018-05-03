'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const imagesCtrl = require('../controllers/images');

router.get('/', imagesCtrl.isoList);
router.post('/download', imagesCtrl.downloadIso);
router.get('/download/info', imagesCtrl.downloadsInfo);
router.put('/download/stop', imagesCtrl.stopDownload);
router.delete('/', imagesCtrl.removeIso);

module.exports = router;