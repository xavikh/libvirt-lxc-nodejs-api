const libvirt = require('../lib');
const HP = libvirt.Hypervisor;
const modelToXML = require('../services/libvirt_helpers').modelToXML;
const parseError = require('../errorsLibvirt').parseError;
const Promise = require("bluebird");
const xmlParser = require('xml-js');

let hp = new HP('qemu:///system');

function connect(next) {
    hp.connect((err) => {
        if (err) return next(parseError(err));
        next();
    })
}

function defineDomain(vm, next) {
    connect((err) => {
        if (err) return next(err);
        modelToXML(vm, 'vm_base.xml', (err, xml) => {
            if (err) return next(setError(500, "A error occurred parsing the VM to XML"));

            hp.defineDomain(xml, (err, domain) => {
                if (err) return next(parseError(err));

                next(null, domain !== undefined);
            })
        })
    });
}

function getDomainByName(name, next) {
    connect((err) => {
        if (err) return next(err);
        hp.lookupDomainByName(name, (err, domain) => {
            if (err) return next(parseError(err));
            next(null, domain);
        });
    });
}

function getDomainList(next) {
    connect((err) => {
        if (err) return next(err);

        Promise.join(
            hp.listDefinedDomainsAsync(),
            hp.listActiveDomainsAsync(),
            (defined, active) => {
                let promises = active.map((id) => {
                    return new Promise((resolve, reject) => {
                        hp.lookupDomainById(id, (err, domain) => {
                            domain.getName((err, name) => {
                                if (err) reject(err);
                                resolve(name);
                            })
                        })
                    })
                });

                Promise.all(promises).then((names) => {
                    next(null, names.concat(defined));
                }).catch((err) => {
                    next(err);
                })

            });
    })
}

function getDomainInfoList(next) {
    getDomainList((err, domains) => {
        if (err) return next(err);
        let promises = domains.map((vm_name) => {
            let vm = {
                name: vm_name
            };
            return new Promise((resolve, reject) => {
                getDomainInfo(vm, (err, info) => {
                    if (err) reject(err);
                    info.name = vm.name;
                    getVolumeByName(info.name, (err, vol) => {
                        getVolInfo(vol, (err, vol_info) => {
                            info.volume = vol_info;
                            resolve(info);
                        })
                    });
                })
            })
        });
        Promise.all(promises).then((infos) => {
            next(null, infos);
        }).catch((err) => {
            next(err);
        })
    })
}

function removeDomain(vm, next) {
    getDomainByName(vm.name, (err, domain) => {
        if (err) return next(err);
        domain.undefine((err, success) => {
            if (err) return next(parseError(err));
            next(null, success);
        });
    });
}

function getDomainInfo(vm, next) {
    getDomainByName(vm.name, (err, domain) => {
        if (err) return next(err);
        domain.getInfo((err, info) => {
            if (err) return next(setError(err));
            next(null, info);
        })
    });

}


function editDomain(vm, edit, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);

            switch (edit.type) {
                case "AddCdrom":
                    if (xml.search("<boot dev='cdrom'/>") !== -1) return next(setError(409, "The domain already have a Cdrom"));
                    if (xml.search("<disk type='block' device='cdrom'>") !== -1) return next(setError(409, "The domain already have a Cdrom"));
                    let cdrom = {
                        name: edit.iso
                    };
                    modelToXML(cdrom, 'device_base.xml', (err, cdxml) => {

                        xml = xml.replace("<type arch='x86_64' machine='pc-i440fx-rhel7.0.0'>hvm<\/type>", "$&\n<boot dev='cdrom'/>");
                        xml = xml.replace("</disk>", "$&\n" + cdxml);
                        hp.defineDomain(xml, (err, domain) => {
                            if (err) return next(parseError(err));
                            next(null, domain !== undefined);
                        });
                    });
                    break;
                case "AddDisk":
                    if (xml.search("<source dev='" + edit.hddname + "'/>") !== -1) return next(setError(409, "The domain already have that disk"));
                    let numDisk = (xml.match(/<disk type='block' device='disk'>/g) || []).length;
                    let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
                    let disk = {
                        storagePath: edit.storagePath,
                        letter: letters[numDisk]
                    };
                    modelToXML(disk, 'disk_base.xml', (err, diskxml) => {

                        xml = xml.replace("</disk>", "$&\n" + diskxml);
                        console.log(xml);
                        // hp.defineDomain(xml, (err, domain) => {
                        //     if (err) return next(parseError(err));
                        //     next(null, domain !== undefined);
                        // });
                    });
                    break;
                case "DeleteCdrom":
                    xml = xml.replace(/<disk type='file' device='cdrom'>\n([^\/]*|\/>\n(\s)*|(\s)*)*\/disk>/, "");
                    console.log(xml);
                    // hp.defineDomain(xml, (err, domain) => {
                    //     if (err) return next(parseError(err));
                    //     next(null, domain !== undefined);
                    // });

                    break;
                default:
                    return next(setError(500, "Error"));
            }

            // hp.defineDomain(xml, (err, domain) => {
            //     if (err) return next(parseError(err));
            //     next(null, domain !== undefined);
            // })
        })
    });
}


function cloneDomain(vm, vm_clone, next) {

}

function attachDevice(vm, device, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);

        modelToXML(device, 'device_base.xml', (err, xml) => {
            if (err) return next(setError(500, "A error occurred parsing the VM to XML"));

            let flags = [libvirt.VIR_DOMAIN_DEVICE_MODIFY_CONFIG];
            vm.updateDevice(xml, flags, (err, result) => {
                if (err) return next(setError(err));
                return next(null, result);
            });
        })
    });
}

// function attachIso(vm, device, next) {
//     getDomainByName(vm.name, (err, vm) => {
//         if (err) return next(err);
//
//         modelToXML(device, 'device_base.xml', (err, xml) => {
//             if (err) return next(setError(500, "A error occurred parsing the VM to XML"));
//
//
//         })
//     });
// }

function attachDeviceTest(vm, device, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);

        modelToXML(device, 'device_base.xml', (err, xml) => {
            if (err) return next(setError(500, "A error occurred parsing the VM to XML"));

            vm.attachDevice(xml, (err, result) => {
                if (err) return next(setError(err));
                return next(null, result);
            });
        })
    });
}

//Ex. options = {"name":"vm1", "size":2}
function createVolume(options, next) {
    if (!options.size) options.size = 2;
    modelToXML(options, 'vol_base.xml', (err, xml) => {

        getPool((err, pool) => {
            if (err) return next(err);

            pool.createVolume(xml, (err, volume) => {
                if (err) return next(parseError(err));

                next(null, volume !== undefined);
            });
        });
    });
}

function getPool(next) {
    connect((err) => {
        if (err) return next(err);

        hp.lookupStoragePoolByName('centos', (err, pool) => {
            if (err) return next(parseError(err));

            next(null, pool);
        });
    })
}

function getVolumeByName(name, next) {
    getPool((err, pool) => {
        if (err) return next(err);

        pool.lookupStorageVolumeByName(name, (err, volume) => {
            if (err) return next(parseError(err));
            next(null, volume);
        });
    });
}

function getVolumeList(next) {
    getPool((err, pool) => {
        if (err) return next(err);

        pool.getVolumes((err, volumes) => {
            if (err) return next(parseError(err));
            next(null, volumes);
        });
    });
}

function getVolInfo(volume, next) {
    volume.getInfo((err, info) => {
        if (err) return next(parseError(err));
        next(null, info);
    });

}

function removeVolume(vol, next) {
    getVolumeByName(vol.name, (err, volume) => {
        if (err) return next(err);

        volume.remove((err, success) => {
            if (err) return next(parseError(err));
            next(null, success);
        });
    });
}

function cloneVolume(vol, cloneVol, next) {
    getVolumeByName(vol.name, (err, volume) => {
        if (err) return next(err);
        getPool((err, pool) => {
            if (err) return next(err);

            let xmlClone = "<volume type=\'block\'><name>" + cloneVol.name + "</name>" + "</volume>";

            pool.cloneVolume(volume, xmlClone, (err, cloneVolume) => {
                if (err) return next(err);
                next(null, cloneVolume);
            });
        });
    });
}


function setError(code, message) {
    return {
        "code": code,
        "message": message
    };
}

module.exports = {
    connect,

    defineDomain,
    editDomain,
    getDomainByName,
    getDomainList,
    removeDomain,
    attachDevice,
    attachDeviceTest,
    getDomainInfo,
    getDomainInfoList,

    createVolume,
    getVolumeByName,
    getVolumeList,
    getVolInfo,
    removeVolume,
    cloneVolume
};