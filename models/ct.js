'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CTSchema = new Schema({
    name: {type: String, unique: true, required: true},
    autoStart: {type: Boolean, default: true},
    isMother: {type: Boolean},
    description: {type: String},
    shortDescription: {type: String},
    openPorts: {type: String},
    status: {type: String}
}, {versionKey: false});


module.exports = mongoose.model('CT', CTSchema);