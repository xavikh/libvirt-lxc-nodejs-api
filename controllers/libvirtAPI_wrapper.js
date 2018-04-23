const libvirt = require('../lib');
const HP = libvirt.Hypervisor;
const modelToXML = require('../services/libvirt_helpers').modelToXML;
const parseError = require('../errorsLibvirt').parseError;

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

        hp.listDefinedDomains((err, domains) => {
            if (err) return next(parseError(err));
            next(null, domains);
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

function getDomainStatus(vm, next) {
    getDomainByName(vm.name, (err, domain) => {
        if (err) return next(err);
        domain.getInfo((err, info) => {
            if (err) return next(setError(err));
            next(null, info.state);
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

function getInfo(volume, next) {
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
    getDomainByName,
    getDomainList,
    removeDomain,
    attachDevice,
    getDomainStatus,

    createVolume,
    getVolumeByName,
    getVolumeList,
    getInfo,
    removeVolume,
    cloneVolume
};