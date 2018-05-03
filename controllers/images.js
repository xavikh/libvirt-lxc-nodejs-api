'use strict';

const setError = require('./wrappers/errorsLibvirt').setError;
const setErrorRes = require('./wrappers/errorsLibvirt').setErrorRes;
const imageWrapper = require('./wrappers/filesystem_wrapper');

function isoList(req, res) {
    imageWrapper.isoList((err, list) => {
        if (err) return setErrorRes(res, setError(500, "A error occurred retrieving the isos"));
        return res.status(200).send(list);
    });
}

function downloadIso(req, res) {
    let url = req.body.url;

    imageWrapper.downloadIso(url, (err, success) => {
        if (err) return res.status(200).send(err);
        return res.status(200).send({message: "Download started"});
    });
}

function downloadsInfo(req, res) {
    imageWrapper.downloadsInfo((err, info) => {
        return res.status(200).send(info);
    });
}

function stopDownload(req, res) {
    let filename = req.body.filename;

    imageWrapper.stopDownload(filename, (err, success) => {
        if (err) return res.status(404).send({message: "This download don't exist"});
        return res.status(200).send({message: "Download stopped"});
    });
}

function removeIso(req, res) {
    let iso = req.body.iso;

    imageWrapper.removeIso(iso, (err, success) => {
        if (err) return res.status(404).send({message: "This iso don't exist"});
        return res.status(200).send({message: "Successfully deleted"});
    });
}

module.exports = {
    isoList,
    downloadIso,
    downloadsInfo,
    stopDownload,
    removeIso
};