'use strict';

const token = require('../services/token');
const User = require('../models/user');

function isMidAuth(req, res, next) {
    const auth = req.headers.authorization;
    const authCookie = req.cookies.token;

    let tokenReq;
    if(auth)
        tokenReq = auth.split(" ")[1];
    else if(authCookie)
        tokenReq = authCookie;
    else
        return res.sendStatus(401);

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
