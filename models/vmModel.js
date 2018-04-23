'use strict';

const VMSchema = new Schema({
    name: {type: String, unique: true},
    uuid: {type: String, unique: true},
    vcpu: {type: String, enum: [1, 2, 3, 4], default: 1},
    ram: {type: String, enum: [512, 1024, 2048, 4096, 8192, 16384, 32768], default: 2048},
    storage: {type: String, required: true},
    autoStart: {type: Boolean, default: true},
    isMother: {type: Boolean},
    description: {type: String},
    shortDescription: {type: String},
    openPorts: {type: String},
    status: {type: String},
    os: {type: String},
}, {versionKey: false});