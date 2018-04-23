'use strict';

const express = require ('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const userCtrl = require ('../controllers/user');

//AUTH
router.get('/', auth, userCtrl.getUserData);
router.patch('/', auth, userCtrl.updateUserData);

//ADMIN TODO
router.get('/list', userCtrl.getUserList);
router.get('/id/:id', userCtrl.getUser);
router.delete('/id/:id', userCtrl.deleteUser);

module.exports = router;