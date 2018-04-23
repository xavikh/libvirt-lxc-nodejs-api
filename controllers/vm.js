const setErrorRes = require('../errorsLibvirt').setErrorRes;

const lvirt = require('../controllers/libvirtAPI_wrapper');


function createDomain(req, res) {
    const name = req.body.name;
    const vcpu = req.body.vcpu;
    const ram = req.body.ram;
    const volume = req.body.volume;

    let vm = {
        "name": name,
        "vcpu": vcpu,
        "ram": ram, //MiB
        "storagePath": "/dev/centos/" + req.body.name
    };
    let vol = {
        "name": vm.name,
        "size": 2
    };
    lvirt.defineDomain(vm, (err, success) => {
        if (err) return setErrorRes(res, err);
        if (!volume || volume === name) {
            lvirt.createVolume(vol, (err, success) => {
                if (err) return setErrorRes(res, err);
                return res.status(200).send(success);
            });
        } else {
            lvirt.cloneVolume(clone, vol, (err, success) => {
                if (err) return setErrorRes(res, err);
                return res.status(200).send(success);
            });
        }
    })
}

function getDomain(req, res) {
    let vm = {
        "name": req.params.name
    };
    lvirt.getDomainByName(vm.name, (err, domain) => {
        if (err) return setErrorRes(res, err);
        domain.toXml((err, xml) => {
            if (err) return setErrorRes(res, err);
            return res.status(200).send(xml);
        });
    })
}

function getDomainStatus(req, res) {
    let vm = {
        name: req.params.name
    };
    lvirt.getDomainStatus(vm, (err, status) => {
        if (err) return res.status(200).send(err);
        return res.status(200).send({status: status});
    })
}

function getDomainList(req, res) {
    lvirt.getDomainList((err, domains) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send(domains);
    })
}

function removeDomain(req, res) {
    let vm = {
        "name": req.params.name,
        "vcpu": 1,
        "ram": 2048, //MiB
        "storagePath": "/dev/centos/vm1"
    };
    lvirt.removeDomain(vm, (err, success) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send(success);
    })
}

function isoList(req, res) {
    const testFolder = '/isos/';
    const fs = require('fs');

    fs.readdir(testFolder, (err, files) => {
        if (err) return res.status(500).send({message: err});
        res.status(200).send({isos: files});
    })
}

function attachDevice(req, res) {
    let vm = {
        name: req.params.name
    };
    let device = {
        name: req.body.iso
    };

    lvirt.attachDevice(vm, device, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({result: result});
    })
}

function statusDomain(req, res) {
    let status = req.params.status;
    let vm = {
        name: req.params.name
    };

    lvirt.getDomainByName(vm.name, (err, domain) => {
        if (err) return setErrorRes(res, err);
        switch (status) {
            case "start":
                domain.start((err, success) => {
                    return res.status(200).send(success);
                });
                break;
            case "shutdown":
                domain.shutdown((err, success) => {
                    return res.status(200).send(success);
                });
                break;
            case "force-shutdown":
                domain.destroy((err, success) => {
                    return res.status(200).send(success);
                });
                break;
            case "reboot":
                domain.reboot((err, success) => {
                    return res.status(200).send(success);
                });
                break;
            default:
                res.status(400).send({
                    code: 400,
                    message: "The state " + status + " doesn't exist. Choose one of this: 'start', 'reboot' and 'shutdown'"
                });
                break;
        }
    })
}


module.exports = {
    createDomain,
    getDomain,
    getDomainList,
    removeDomain,
    isoList,
    attachDevice,
    statusDomain,
    getDomainStatus
};