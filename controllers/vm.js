const setErrorRes = require('./wrappers/errorsLibvirt').setErrorRes;
const parseError = require('./wrappers/errorsLibvirt').parseError;

const domains_lvirt = require('../controllers/wrappers/libvirtDomains_wrapper');
const volumes_lvirt = require('../controllers/wrappers/libvirtVolumes_wrapper');

function createDomain(req, res) {
    const name = req.body.name;
    const vcpu = req.body.vcpu;
    const ram = req.body.ram;
    const volume = req.body.volume;
    const volumeSize = req.body.volume_size;

    const iso = req.body.iso;

    let vm = {
        "name": name,
        "vcpu": vcpu,
        "ram": ram, //MiB
        "storagePath": "/dev/centos/" + req.body.name
    };
    let vol = {
        "name": vm.name,
        "size": volumeSize
    };

    domains_lvirt.defineDomain(vm, (err, success) => {
        if (err) return setErrorRes(res, err);
        if (!volume || volume === name) {
            volumes_lvirt.createVolume(vol, (err, success) => {
                if (err) return setErrorRes(res, err);
                return res.status(200).send(success);
            });
        } else {
            volumes_lvirt.cloneVolume(clone, vol, (err, success) => {
                if (err) return setErrorRes(res, err);
                return res.status(200).send(success);
            });
        }
    });
}

function editDomain(req, res) {
    const name = req.params.name;
    const editType = req.body.editType;
    const iso = req.body.iso;
    const volName = req.body.volName;

    let vm = {
        name: name
    };
    let edit = {
        type: editType,
        iso: iso,
        storagePath: "/dev/centos/" + volName
    };

    domains_lvirt.editDomain(vm, edit, (err, success) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send({message: success});
    })
}

function attachCdrom(req, res) {
    const name = req.params.name;
    const iso = req.body.iso;

    let vm = {
        name: name
    };
    domains_lvirt.aCdromIsAttached(vm, (err, isAttached) => {
        if (err) return setErrorRes(res, err);
        if(isAttached) {
            domains_lvirt.detachCdrom(vm, (err, success) => {
                domains_lvirt.attachCdrom(vm, iso, (err, success) => {
                    if (err) return setErrorRes(res, err);
                    return res.status(200).send({message: success});
                })
            });
        } else {
            domains_lvirt.attachCdrom(vm, iso, (err, success) => {
                if (err) return setErrorRes(res, err);
                return res.status(200).send({message: success});
            })
        }
    });
}

function getMountedCdRom(req, res){
    const name = req.params.name;
    let vm = {
        name: name
    };

    domains_lvirt.getMountedCdrom(vm, (err, cdrom) => {

    })
}

function detachCdrom(req, res) {
    const name = req.params.name;

    let vm = {
        name: name
    };

    domains_lvirt.detachCdrom(vm, (err, success) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send({message: success});
    })
}

function attachDisk(req, res) {
    const name = req.params.name;
    const volName = req.body.volName;

    let vm = {
        name: name
    };
    let volPath = "/dev/centos/" + volName;

    domains_lvirt.attachDisk(vm, volPath, (err, success) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send({message: success});
    })
}

function detachDisk(req, res) {
    const name = req.params.name;
    const volName = req.body.volName;

    let vm = {
        name: name
    };
    let volPath = "/dev/centos/" + volName;

    domains_lvirt.detachDisk(vm, volPath, (err, success) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send({message: success});
    })
}


function getDomain(req, res) {
    let vm = {
        "name": req.params.name
    };
    domains_lvirt.getDomainByName(vm.name, (err, domain) => {
        if (err) return setErrorRes(res, err);
        domain.toXml((err, xml) => {
            if (err) return setErrorRes(res, err);
            return res.status(200).send(xml);
        });
    })
}

function getDomainList(req, res) {
    domains_lvirt.getDomainList((err, domains) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send(domains);
    })
}

function getDomainInfo(req, res) {
    let vm = {
        name: req.params.name
    };
    domains_lvirt.getDomainInfo(vm, (err, info) => {
        if (err) return res.status(200).send(err);
        return res.status(200).send({info});
    })
}

function getDomainInfoList(req, res) {
    domains_lvirt.getDomainInfoList((err, infos) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send(infos);
    });
}

function removeDomain(req, res) {
    let vm = {
        "name": req.params.name,
        "vcpu": 1,
        "ram": 2048, //MiB
        "storagePath": "/dev/centos/vm1"
    };
    domains_lvirt.removeDomain(vm, (err, success) => {
        if (err) return setErrorRes(res, err);
        return res.status(200).send({message: success});
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

    domains_lvirt.attachDevice(vm, device, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({result: result});
    })
}

function attachDeviceTest(req, res) {
    let vm = {
        name: req.params.name
    };
    let device = {
        name: req.body.iso
    };

    domains_lvirt.attachDeviceTest(vm, device, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({result: result});
    })
}

function getMountedVolumes(req, res) {
    let vm = {
        name: req.params.name
    };
    domains_lvirt.getMountedVolumes(vm, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({volumes: result});
    })
}

function statusDomain(req, res) {
    let status = req.params.status;
    let vm = {
        name: req.params.name
    };

    domains_lvirt.getDomainByName(vm.name, (err, domain) => {
        if (err) return setErrorRes(res, err);
        switch (status) {
            case "start":
                domain.start((err, success) => {
                    if (err) return setErrorRes(res, parseError(err));
                    if (success)
                        return res.status(200).send({message: success});
                    else
                        return res.status(500).send({message: "Something didn't go well :("});
                });
                break;
            case "shutdown":
                domain.shutdown((err, success) => {
                    if (err) return setErrorRes(res, parseError(err));
                    if (success)
                        return res.status(200).send({message: success});
                    else
                        return res.status(500).send({message: "Something didn't go well :("});
                });
                break;
            case "force-shutdown":
                domain.destroy((err, success) => {
                    if (err) return setErrorRes(res, parseError(err));
                    if (success)
                        return res.status(200).send({message: success});
                    else
                        return res.status(500).send({message: "Something didn't go well :("});
                });
                break;
            case "reboot":
                domain.reboot((err, success) => {
                    if (err) return setErrorRes(res, parseError(err));
                    if (success)
                        return res.status(200).send({message: success});
                    else
                        return res.status(500).send({message: "Something didn't go well :("});
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
    editDomain,
    getDomain,
    getDomainList,
    getDomainInfoList,
    attachCdrom,
    detachCdrom,
    attachDisk,
    detachDisk,
    removeDomain,
    isoList,
    attachDevice,
    attachDeviceTest,
    getMountedVolumes,
    statusDomain,
    getDomainInfo
};