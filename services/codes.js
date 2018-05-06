'use strict';

const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const config = require("../config");
const input = require('../services/inputValidators');
const User = require('../models/user');

const bot = new TelegramBot(config.TELEGRAM_TOKEN, {polling: true});

function generateCode() {
    let code = "";
    for (let n = 0; n < 6; n++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

function sendCode(telegramId, code){
    bot.sendMessage(telegramId, "Your code is: " + code)
}

function initTelegram() {
    bot.onText(/^\/register/, (msg, match) => {

        const chatId = msg.chat.id;
        const email = msg.text.split(' ')[1];
        const code = msg.text.split(' ')[2];
        if (!input.validEmail(email)) return bot.sendMessage(chatId, "The email '" + email + "' isn't valid");
        if (!input.validCode(code)) return bot.sendMessage(chatId, "The code '" + code + "' isn't valid");

        User.findOne({email: email})
            .select("+telegramId +verificationCode +verificationCodeTimestamp")
            .exec((err, user) => {
                if (err) return bot.sendMessage(chatId, "Internal error");
                if (!user || user.length < 1) return bot.sendMessage(chatId, "Doesn't exist a user with that email");
                if (user.telegramId) return bot.sendMessage(chatId, "Telegram account already assigned");
                if (!user.verificationCode || !user.verificationCodeTimestamp) return bot.sendMessage(chatId, "Unauthorized");
                if (code !== user.verificationCode) return bot.sendMessage(chatId, "Invalid code");

                if (user.verificationCodeTimestamp < moment()) return bot.sendMessage(chatId, "Expired code");
                //Add changes to user
                user.telegramId = chatId;
                user.verificationCode = undefined;
                user.verificationCodeTimestamp = undefined;
                user.save((err) => {
                    if(err) return bot.sendMessage(chatId, "A error occurred");
                    return bot.sendMessage(chatId, "Success");
                })
            });
    });
}



module.exports = {
    generateCode,
    sendCode,
    initTelegram
};