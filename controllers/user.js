'use strict';

const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const moment = require('moment');

const services = require('../services');
const token = require('../services/token');
const codes = require('../services/codes');
const input = require('../services/inputValidators');
const mail = require('../services/mailManager');
const config = require('../config');

const User = require('../models/user');

function signUp(req, res) {
    const email = services.normEmail(req.body.email);
    const name = req.body.name;
    const password = req.body.password;
    const avatar_image = req.body.avatar_image;

    if (!input.validName(name)) return res.status(400).send({
        status: 400,
        message: "The 'name' field isn't correct or is missing"
    });
    if (!input.validEmail(email)) return res.status(400).send({
        status: 400,
        message: "The 'email' field isn't correct or is missing"
    });
    if (!input.validPassword(password)) return res.status(400).send({
        status: 400,
        message: "The 'password' field isn't correct or is missing"
    });

    User.findOne({email: email})
        .exec((err, userExist) => {
            if (err) return res.sendStatus(500);
            if (userExist) return res.status(409).send({
                status: 409,
                message: "Already exist a user with that email"
            });

            crypto.randomBytes(20, (err, token) => {
                if (err) return res.sendStatus(500);
                if (!token) return res.sendStatus(500);
                const expires = Date.now() + 3600000 * config.VERIFY_EMAIL_EXP;
                const user = new User({
                    email: email,
                    name: name,
                    password: password,
                    avatar_image: avatar_image,
                    status: "Created",
                    verifyEmailToken: token.toString('hex'),
                    verifyEmailExpires: expires
                });
                user.save((err, user) => {
                    if (err) return res.sendStatus(500);
                    if (!user) return res.sendStatus(500);
                    if (config.SEND_VERIFICATION_EMAIL)
                        mail.sendWelcomeEmail(user.email, user.displayName, user.verifyEmailToken);
                    return res.status(201).send({
                        status: 201,
                        message: "User created"
                    });
                });
            });
        })
}

function login(req, res) {
    const email = services.normEmail(req.body.email);
    const password = req.body.password;

    if (!input.validEmail(email)) return res.status(400).send({
        status: 400,
        message: "The 'email' isn't correct"
    });
    if (!input.validPassword(password)) return res.status(400).send({
        status: 400,
        message: "The 'password' isn't correct"
    });

    User.findOne({email: email})
        .select('+password +telegramId ')
        .exec((err, user) => {
            if (err) return res.status(500).send({status: 500, message: "Internal server error"});
            if (!user) return res.status(404).send({
                status: 404,
                message: "The combination of user and password received doesn't exist"
            });

            if (config.SEND_VERIFICATION_EMAIL)
                if (user.status !== 'Verified') return res.status(401).send({
                    status: 401,
                    message: "The email needs to be verified"
                });

            bcrypt.compare(req.body.password, user.password, (err, equals) => {
                if (err) return res.status(500).send({status: 500, message: "Internal server error"});
                if (!equals) return res.status(404).send({
                    status: 404,
                    message: "The combination of user and password received doesn't exist"
                });
                user.password = undefined;

                //if (!user.telegramId) return res.redirect('public/verifyTelegram');
                return res.status(200).send({
                    token: token.generate(user)
                })
            })
        })
}

function loginWeb(req, res) {
    const email = services.normEmail(req.body.email);
    const password = req.body.password;

    if (!input.validEmail(email)) return res.status(400).send({
        status: 400,
        message: "The 'email' isn't correct"
    });
    if (!input.validPassword(password)) return res.status(400).send({
        status: 400,
        message: "The 'password' isn't correct"
    });

    User.findOne({email: email})
        .select('+password +telegramId ')
        .exec((err, user) => {
            if (err) return res.status(500).send({status: 500, message: "Internal server error"});
            if (!user) return res.status(404).send({
                status: 404,
                message: "The combination of user and password received doesn't exist"
            });

            if (config.SEND_VERIFICATION_EMAIL)
                if (user.status !== 'Verified') return res.status(401).send({
                    status: 401,
                    message: "The email needs to be verified"
                });

            bcrypt.compare(req.body.password, user.password, (err, equals) => {
                if (err) return res.status(500).send({status: 500, message: "Internal server error"});
                if (!equals) return res.status(404).send({
                    status: 404,
                    message: "The combination of user and password received doesn't exist"
                });
                user.password = undefined;

                res.cookie('token', token.generate(user), {maxAge: 10800000, httpOnly: true});
                let redirect = '/code';
                if (!user.telegramId) redirect = '/verify-telegram';
                return res.status(200).send({
                    redirect: redirect
                })
            })
        })
}

function verifyTelegramAccount(req, res) {
    User.findById(req.user)
        .select("+telegramId +verificationCode +verificationCodeTimestamp")
        .exec((err, user) => {
            if (err) return res.status(500).send({
                status: 500,
                message: "Internal server error"
            });
            if (!user) return res.status(404).send({
                status: 404,
                message: "Some error occurred retrieving the user"
            });
            if (user.telegramId) return res.status(401).send({
                status: 401,
                message: "This user already have a Telegram account linked"
            });

            let code = codes.generateCode();
            user.verificationCode = code;
            user.verificationCodeTimestamp = Date.now() + config.CODE_VERIFICATION_EXP_TIME;
            user.save((err) => {
                if (err) return res.status(500).send({
                    status: 500,
                    message: "Internal server error"
                });
                return res.status(200).send({
                    status: 200,
                    code: code,
                    expireTime: user.verificationCodeTimestamp,
                    message: "Ok. Now go to your Telegram and talk to '@CDWS_bot'"
                });
            });
        })
}

function verifyCode(req, res) {
    const code = req.body.code;

    if (!input.validCode(code)) return res.status(400).send({message: "The 'code' field isn't correct or is missing"});

    User.findById(req.user)
        .select("+telegramId +twoFactorCode +twoFactorCodeTimestamp")
        .exec((err, user) => {
            if (err) return res.status(500).send({status: 500, message: "Internal server error"});
            if (!user) return res.status(404).send({
                status: 404,
                message: "Some error occurred retrieving the user"
            });
            if (!user.telegramId || !user.twoFactorCode || !user.twoFactorCodeTimestamp) {
                return res.status(401).send({status: 401, message: "Unauthorized"});
            } else if (code !== user.twoFactorCode) {
                return res.status(401).send({status: 401, message: "Unauthorized code"});
            } else if (user.twoFactorCodeTimestamp.getTime() < Date.now()) {
                return res.status(401).send({status: 401, message: "Expired code"});
            } else {
                user.twoFactorCode = undefined;
                user.twoFactorCodeTimestamp = undefined;
                user.save((err, user) => {
                    if (err) return res.status(500).send({
                        status: 500,
                        message: "Internal server error"
                    });
                    user.telegramId = undefined;
                    return res.status(200).send({
                        token: token.generate(user, true),
                        user: user
                    })
                });
            }
        })
}

function verifyCodeWeb(req, res) {
    const code = req.body.code;

    if (!input.validCode(code)) return res.status(400).send({message: "The 'code' field isn't correct or is missing"});

    User.findById(req.user)
        .select("+telegramId +twoFactorCode +twoFactorCodeTimestamp")
        .exec((err, user) => {
            if (err) return res.status(500).send({status: 500, message: "Internal server error"});
            if (!user) return res.status(404).send({
                status: 404,
                message: "Some error occurred retrieving the user"
            });
            if (!user.telegramId || !user.twoFactorCode || !user.twoFactorCodeTimestamp) {
                return res.status(401).send({status: 401, message: "Unauthorized"});
            } else if (code !== user.twoFactorCode) {
                return res.status(401).send({status: 401, message: "Unauthorized code"});
            } else if (user.twoFactorCodeTimestamp.getTime() < Date.now()) {
                return res.status(401).send({status: 401, message: "Expired code"});
            } else {
                user.twoFactorCode = undefined;
                user.twoFactorCodeTimestamp = undefined;
                user.save((err, user) => {
                    if (err) return res.status(500).send({
                        status: 500,
                        message: "Internal server error"
                    });
                    user.telegramId = undefined;

                    res.cookie('token', token.generate(user, true), {
                        maxAge: config.EXP_TOKEN * 3600000,
                        httpOnly: true
                    });
                    return res.status(200).send({
                        redirect: '/dashboard'
                    })
                });
            }
        })
}

function sendCode(req, res) {
    User.findById(req.user)
        .select("+telegramId")
        .exec((err, user) => {
            if (err) return res.status(500).send({
                status: 500,
                message: "Internal server error"
            });
            if (!user) return res.status(404).send({
                status: 404,
                message: "Some error occurred retrieving the user"
            });
            if (!user.telegramId) return res.status(404).send({
                status: 404,
                message: "The user hasn't link a Telegram account"
            });

            let code = codes.generateCode();
            user.twoFactorCode = code;
            user.twoFactorCodeTimestamp = Date.now() + config.CODE_EXP_TIME;

            console.log("Code: " + code + " sent to " + user.telegramId);
            user.save((err) => {
                if (err) return res.status(500).send({
                    status: 500,
                    message: "Internal server error"
                });
                codes.sendCode(user.telegramId, code);
                return res.status(200).send({
                    message: "Code sent",
                    expireTime: user.twoFactorCodeTimestamp
                })
            });

        });
}


function updateUserData(req, res) {
    if (!req.body.name &&
        !req.body.password)
        return res.sendStatus(400);

    let updatedFields = {};
    if (req.body.displayName) {
        updatedFields.name = req.body.name;
        if (!input.validName(updatedFields.displayName)) return res.sendStatus(400)
    }
    if (req.body.password) {
        updatedFields.password = req.body.password;
        if (!input.validPassword(updatedFields.password)) return res.sendStatus(400)
    }

    User.findById(req.user, (err, user) => {
        if (err) return res.sendStatus(500);
        if (!user) return res.sendStatus(404);
        user.set(updatedFields);
        user.save((err) => {
            if (err) return res.sendStatus(500);
            return res.sendStatus(200)
        })
    })
}

function getUserData(req, res) {
    User.findById(req.user)
        .select("-_id")
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            return res.status(200).send(user)
        })
}

function getUser(req, res) {
    let userId = req.params.id;
    if (!input.validId(userId)) return res.sendStatus(400);

    User.findById(userId, (err, user) => {
        if (err) return res.sendStatus(500);
        if (!user) return res.sendStatus(404);
        return res.status(200).send(user)
    })
}

function getUserList(req, res) {
    User.find({})
        .select("+telegramId +verificationCode +verificationCodeTimestamp +twoFactorCode +twoFactorCodeTimestamp")//TODO delete
        .exec((err, users) => {
            if (err) return res.sendStatus(500);
            if (!users) return res.sendStatus(404);
            res.status(200).send(users)
        })
}

function restorePasswordRequest(req, res) {
    const email = services.normEmail(req.query.email);
    if (!input.validEmail(email)) return res.sendStatus(400);

    User.findOne({email: email})
        .exec((err, user) => {
            if (!user) return res.sendStatus(404);
            crypto.randomBytes(20, (err, token) => {
                if (err) return res.sendStatus(500);
                if (!token) return res.sendStatus(500);
                user.resetPasswordToken = token.toString('hex');
                user.resetPasswordExpires = Date.now() + 3600000 * config.RESTORE_PASS_EXP;
                user.save((err, user) => {
                    mail.sendPasswordEmail(user.email, user.displayName, user.resetPasswordToken);
                    return res.sendStatus(200)
                })
            })
        })
}

function setNewPassword(req, res) {
    const tokenSplit = req.query.token.split('/');
    const email = services.decrypt(tokenSplit[0]);
    const token = tokenSplit[1];
    const password = req.body.password;

    if (!input.validPassword(password)) return res.sendStatus(400);

    User.findOne({email: email})
        .select('+password +resetPasswordExpires +resetPasswordToken')
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            if (!user.resetPasswordExpires ||
                user.resetPasswordExpires < Date.now()) return res.sendStatus(410);
            if (!user.resetPasswordToken ||
                user.resetPasswordToken !== token) return res.sendStatus(401);

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save((err, user) => {
                if (err) return res.sendStatus(500);
                return res.sendStatus(200)
            })
        })
}

function deleteUser(req, res) {
    let userId = req.params.id;
    if (!input.validId(userId)) return res.sendStatus(400);

    User.findById(userId, (err, user) => {
        if (err) return res.sendStatus(500);
        if (!user) return res.sendStatus(404);
        user.remove();
        return res.sendStatus(200)
    })
}

function verifyEmail(req, res) {
    const tokenSplit = req.query.token.split('/');
    const email = services.decrypt(tokenSplit[0]);
    const token = tokenSplit[1];

    User.findOne({email: email})
        .select('+verifyEmailToken +verifyEmailExpires')
        .exec((err, user) => {
            if (err) return res.sendStatus(500);
            if (!user) return res.sendStatus(404);
            if (user.status === 'Verified') return res.sendStatus(410);
            if (!user.verifyEmailExpires ||
                user.verifyEmailExpires < Date.now()) return res.sendStatus(410);
            if (!user.verifyEmailToken ||
                user.verifyEmailToken !== token) return res.sendStatus(401);

            user.status = 'Verified';
            user.verifyEmailToken = undefined;
            user.verifyEmailExpires = undefined;
            user.save((err, user) => {
                if (err) return res.sendStatus(500);
                return res.sendStatus(200)
            })
        })
}



module.exports = {
    signUp,
    login,
    loginWeb,
    sendCode,
    verifyTelegramAccount,
    verifyCode,
    verifyCodeWeb,
    updateUserData,
    getUserData,
    getUser,
    getUserList,
    restorePasswordRequest,
    setNewPassword,
    deleteUser,
    verifyEmail
};
