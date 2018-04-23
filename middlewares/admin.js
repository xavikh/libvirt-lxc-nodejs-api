'use strict';

const config = require('../config');
const User = require('../models/user');

function isAdmin(req, res, next) {
    User.findOne({_id: req.user})
        .select('+admin')
        .exec((err, user) => {
            if (err) res.sendStatus(500);
            if (!user) res.sendStatus(401);

            if (user.admin === config.ADMIN_TOKEN) {
                next()
            } else {
                res.sendStatus(401)
            }

        })
}

module.exports = isAdmin;
