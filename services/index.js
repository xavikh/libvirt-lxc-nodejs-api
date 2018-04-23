'use strict';

const crypto = require('crypto');
const config = require('../config');

function encrypt(text) {
    let cipher = crypto.createCipheriv(config.ALGORITHM, config.CIPHER_KEY, config.CIPHER_IV);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    let decipher = crypto.createDecipheriv(config.ALGORITHM, config.CIPHER_KEY, config.CIPHER_IV);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

function normEmail(email) {
    return email.toLowerCase();
}

module.exports = {
    encrypt,
    decrypt,
    normEmail
};