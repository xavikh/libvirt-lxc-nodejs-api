const modelToXML = require('../../services/libvirt_helpers').modelToXML;
const setError = require('./errorsLibvirt').setErrorRes;
const parseError = require('./errorsLibvirt').parseError;
const lvirt = require('./libvirt_wrapper');

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
    lvirt.connect((err) => {
        if (err) return next(err);

        lvirt.hp.lookupStoragePoolByName('centos', (err, pool) => {
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
            let index = volumes.indexOf("root");
            if (index !== -1) volumes.splice(index, 1);
            index = volumes.indexOf("swap");
            if (index !== -1) volumes.splice(index, 1);
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

function getVolumesInfoList(next) {
    getVolumeList((err, vol_list) => {
        let promises = vol_list.map((vol_name) => {
            return new Promise((resolve, reject) => {
                getVolumeByName(vol_name, (err, vol) => {
                    if (err) reject(err);
                    getVolInfo(vol, (err, vol_info) => {
                        if (err) reject(err);
                        vol_info.name = vol_name;
                        resolve(vol_info);
                    });
                });
            });
        });

        Promise.all(promises).then((info) => {
            next(null, info)
        }).catch((err) => {
            next(err);
        });
    });
}

function populateVolumesInfo(vm_info, next) {
    let vol_names = vm_info.volumesNames;
    vm_info.volumesNames = undefined;

    let promises = vol_names.map((vol_name) => {
        return new Promise((resolve, reject) => {
            getVolumeByName(vol_name, (err, vol) => {
                if (err) reject(err);
                getVolInfo(vol, (err, vol_info) => {
                    if (err) reject(err);
                    vol_info.name = vol_name;
                    resolve(vol_info);
                });
            });
        });
    });

    Promise.all(promises).then((info) => {
        next(null, info)
    }).catch((err) => {
        next(err);
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


module.exports = {
    createVolume,
    getVolumeByName,
    getVolumeList,
    getVolInfo,
    getVolumesInfoList,
    populateVolumesInfo,
    removeVolume,
    cloneVolume
};