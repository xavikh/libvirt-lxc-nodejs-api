
const setErrorRes = require('./wrappers/errorsLibvirt').setErrorRes;

const volumes_lvirt = require('../controllers/wrappers/libvirtVolumes_wrapper');

function createVolume(req, res) {
    let name = req.body.name;
    let size = req.body.size;
    let vol = {
        "name": name,
        "size": size
    };

    if(name === "swap" || name === "root") return res.sendStatus(400);

    volumes_lvirt.createVolume(vol, (err, success) => {
        if(err) return setErrorRes(res, err);
        return res.status(200).send(success);
    });
}

function getVolumeInfo(req, res) {
    let name = req.params.name;

    if(name === "swap" || name === "root") return res.sendStatus(400);

    volumes_lvirt.getVolumeByName(name, (err, volume) => {
        if(err) return setErrorRes(res, err);

        volumes_lvirt.getVolInfo(volume,(err, info) => {
            if(err) return setErrorRes(res, err);
            return res.status(200).send(info);
        });
    })
}

function getVolumeList(req, res) {
    volumes_lvirt.getVolumeList((err, volumes) => {
        if(err) return setErrorRes(res, err);
        return res.status(200).send(volumes);
    })
}


function removeVolume(req, res) {
    let name = req.params.name;
    let vol = {
        "name": name
    };

    if(name === "swap" || name === "root") return res.sendStatus(400);

    volumes_lvirt.removeVolume(vol, (err, success) => {
        if(err) return setErrorRes(res, err);
        return res.status(200).send({message: success});
    })
}

function cloneVolume(req, res) {
    let volName = req.params.name;
    let cloneVolName = req.body.copyName;

    if(!cloneVolName) cloneVolName = volName + "_clone";

    let vol = {
        name: volName
    };
    let volClone = {
        name: cloneVolName
    };

    volumes_lvirt.cloneVolume(vol, volClone, (err, cloneVolume) => {
        if(err) return setErrorRes(res, err);

        res.status(200).send({message: "Everything is OK"});
    })
}

module.exports = {
    createVolume,
    getVolumeInfo,
    getVolumeList,
    removeVolume,
    cloneVolume
};