'use strict';

const jwt = require('jwt-simple');
const moment = require('moment');
const config = require('../config');
const services = require('../services');

function generate(user, isLogged, isAdmin) {
    const payload = {
        sub: services.encrypt(String(user._id)),
        iat: moment().unix(),
        exp: moment().add(config.EXP_TOKEN, 'hours').unix(),
        iss: "coredumped.es",
        logged: isLogged,
        admin: isAdmin
    };
    return jwt.encode(payload, config.SECRET_TOKEN, 'HS512')
}

function decode(token) {
    return new Promise((resolve, reject) => {
        try {
            const payload = jwt.decode(token, config.SECRET_TOKEN, 'HS512');

            if (payload.exp <= moment().unix()) {
                reject({
                    status: 401,
                    message: 'Your authorization has expired'
                })
            }
            if (payload.sub) payload.sub = services.decrypt(payload.sub);
            resolve(payload);
        } catch (err) {
            reject({
                status: 500,
                message: 'Invalid token'
            })
        }
    })
}


module.exports = {
    generate,
    decode
};
