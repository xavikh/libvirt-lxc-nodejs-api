'use strict';

const token = require('../services/token');
const User = require('../models/user');

function isMidAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.sendStatus(401);
    }

    const tokenReq = auth.split(" ")[1];

    token.decode(tokenReq)
        .then(response => {
            User.findOne({_id: response.sub})
                .exec((err, user) => {
                    if (err) return res.sendStatus(500);
                    if (!user) return res.sendStatus(401);

                    req.user = response.sub;
                    next()
                })
        })
        .catch(() => {
            return res.sendStatus(401)
        })
}

module.exports = isMidAuth;
