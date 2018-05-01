const Promise = require("bluebird");

const modelToXML = require('../../services/libvirt_helpers').modelToXML;
const setError = require('./errorsLibvirt').setError;
const parseError = require('./errorsLibvirt').parseError;

const lvirt = require('./libvirt_wrapper');
const volumes_lvirt = require('./libvirtVolumes_wrapper');

function defineDomain(vm, next) {
    lvirt.connect((err) => {
        if (err) return next(err);
        getDomainByName(vm.name, (err, vmExist) => {
            if (vmExist) return next(setError(409, "A VM with this name already exist"));

            modelToXML(vm, 'vm_base.xml', (err, xml) => {
                if (err) return next(setError(500, "A error occurred parsing the VM to XML"));

                lvirt.hp.defineDomain(xml, (err, domain) => {
                    if (err) return next(parseError(err));

                    next(null, domain !== undefined);
                })
            })
        });
    })
}

function getDomainByName(name, next) {
    lvirt.connect((err) => {
        if (err) return next(err);
        lvirt.hp.lookupDomainByName(name, (err, domain) => {
            if (err) return next(parseError(err));
            next(null, domain);
        });
    });
}

function getDomainList(next) {
    lvirt.connect((err) => {
        if (err) return next(err);

        Promise.join(
            lvirt.hp.listDefinedDomainsAsync(),
            lvirt.hp.listActiveDomainsAsync(),
            (defined, active) => {
                let promises = active.map((id) => {
                    return new Promise((resolve, reject) => {
                        lvirt.hp.lookupDomainById(id, (err, domain) => {
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
                    resolve(info);
                });
            });
        });

        Promise.all(promises).then((infos) => {
            next(null, infos);
        }).catch((err) => {
            next(err);
        });
    })
}

function getDomainInfo(vm, next) {
    getDomainByName(vm.name, (err, domain) => {
        if (err) return next(err);
        domain.getInfo((err, info) => {
            if (err) return next(parseError(err));
            info.name = vm.name;
            getMountedCdrom(vm, (err, mountedCd) => {
                if(err) next(err);
                info.iso = mountedCd;
                getMountedVolumes(vm, (err, vol_list) => {
                    if (err) next(err);
                    info.volumesNames = vol_list;
                    volumes_lvirt.populateVolumesInfo(info, (err, popInfo) => {
                        if (err) next(err);
                        info.volumes = popInfo;
                        next(null, info);
                    });
                });
            });
        });
    });
}

function getMountedVolumes(vm, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);

            let regex = /<source dev='\/dev\/centos\/([^']+)'\/>/g;
            let matched;
            let output = [];
            while (matched = regex.exec(xml)) {
                output.push(matched[1]);
            }
            return next(null, output);
        });
    });
}

function getMountedCdrom(vm, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);

            let regex = /<source file='\/isos\/([^']+)'\/>/g;
            let match = regex.exec(xml);
            if(match)
                return next(null, match[1]);
            else
                return next(null, undefined);
        });
    });
}


function attachCdrom(vm, iso, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);
            if (xml.search("<boot dev='cdrom'/>") !== -1) return next(setError(409, "The domain already have a Cdrom"));
            if (xml.search("<disk type='block' device='cdrom'>") !== -1) return next(setError(409, "The domain already have a Cdrom"));
            let cdrom = {
                name: iso
            };
            modelToXML(cdrom, 'device_base.xml', (err, cdxml) => {
                xml = xml.replace("<type arch='x86_64' machine='pc-i440fx-rhel7.0.0'>hvm<\/type>", "$&\n<boot dev='cdrom'/>");
                xml = xml.replace("</disk>", "$&\n" + cdxml);
                lvirt.hp.defineDomain(xml, (err, domain) => {
                    if (err) return next(parseError(err));
                    next(null, domain !== undefined);
                });
            });
        });
    });
}

function aCdromIsAttached(vm, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);
            if (xml.search("<boot dev='cdrom'/>") !== -1) return next(null, true);
            if (xml.search("<disk type='block' device='cdrom'>") !== -1) return next(null, true);
            return next(null, false);
        });
    });
}

function detachCdrom(vm, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);

            xml = xml.replace("<boot dev='cdrom'/>", "");
            let del_from = xml.indexOf("<disk type='file' device='cdrom'>");
            let del_to = xml.indexOf("</disk>", del_from);
            if (del_from === -1 || del_to === -1) return next(setError(404, "The domain didn't have a Cdrom"));
            xml = xml.substring(0, del_from).concat(xml.substring(del_to + 7));
            lvirt.hp.defineDomain(xml, (err, domain) => {
                if (err) return next(parseError(err));
                next(null, domain !== undefined);
            });
        });
    });
}

function attachDisk(vm, volPath, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);
            if (xml.search("<source dev='" + volPath + "'/>") !== -1) return next(setError(409, "The domain already have that disk"));
            let numDisk = (xml.match(/<disk type='block' device='disk'>/g) || []).length;
            let letters = ['a', 'b', 'd', 'e', 'f', 'g'];
            let disk = {
                storagePath: volPath,
                letter: letters[numDisk]
            };
            modelToXML(disk, 'disk_base.xml', (err, diskxml) => {
                if (err) return next(err);
                xml = xml.replace("</disk>", "$&\n" + diskxml);

                lvirt.hp.defineDomain(xml, (err, domain) => {
                    if (err) return next(parseError(err));
                    next(null, domain !== undefined);
                });
            });
        });
    });
}

function detachDisk(vm, volPath, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);
        vm.toXml((err, xml) => {
            if (err) return next(err);

            let del_center = xml.indexOf("<source dev='" + volPath + "'/>");
            if (del_center === -1) return next(setError(404, "The domain didn't have that disk"));

            let del_from = xml.lastIndexOf("<disk type='block' device='disk'>", del_center);
            let del_to = xml.indexOf("</disk>", del_center);

            if (del_from === -1 || del_to === -1) return next(setError(500, "A error occurred deleting the disk"));
            xml = xml.substring(0, del_from).concat(xml.substring(del_to + 7));

            lvirt.hp.defineDomain(xml, (err, domain) => {
                if (err) return next(parseError(err));
                next(null, domain !== undefined);
            });
        });
    });
}

function cloneDomain(vm, vm_clone, next) {

}

function attachDeviceTest(vm, device, next) {
    getDomainByName(vm.name, (err, vm) => {
        if (err) return next(err);

        modelToXML(device, 'device_base.xml', (err, xml) => {
            if (err) return next(setError(500, "A error occurred parsing the VM to XML"));

            vm.attachDevice(xml, (err, result) => {
                if (err) return next(err);
                return next(null, result);
            });
        })
    });
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

module.exports = {
    defineDomain,
    getDomainByName,
    getDomainList,
    getMountedVolumes,
    getDomainInfo,
    getDomainInfoList,
    attachCdrom,
    getMountedCdrom,
    aCdromIsAttached,
    detachCdrom,
    attachDisk,
    detachDisk,
    attachDeviceTest,
    removeDomain
};