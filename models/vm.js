'use strict';

const lvirt = require('../controllers/libvirtAPI_wrapper');

function VM(name, vcpu, ram, storage) {
    this.name = name,
    this.uuid = undefined,
    this.vcpu = (vcpu)?vcpu:1,
    this.ram = (ram)?ram:2048,
    this.storage = storage,
    this.autoStart = true,
    this.isMother = false,
    this.description = "",
    this.shortDescription = "",
    this.openPorts = "",
    this.status = "",
    this.os = "Linux"

    this.define = function (err, success) {

    }

}

