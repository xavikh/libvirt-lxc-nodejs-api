'use strict';

let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'));
const request = require('request');
const progress = require('request-progress');

const isoFolder = require('../../config').ISO_FOLDER;

let downloadState = {};
let downloadRequests = {};

function checkFolder(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

function isoList(next) {
    checkFolder(isoFolder);
    fs.readdir(isoFolder, (err, files) => {
        if (err) return next(err);

        let filesPromises = files.map((file) => {
            return fs.statAsync(isoFolder + file).then((stat) => {
                return {
                    path: isoFolder + file,
                    filename: file,
                    size: stat.size,
                    creation: stat.birthtime
                };
            });
        });

        Promise.all(filesPromises).then((stats) => {
            return next(null, stats);
        }).catch((err) => {
            return next(err);
        });
    });
}

function downloadIso(url, next) {
    checkFolder(isoFolder);
    let filename = url.split('/');
    filename = filename[filename.length - 1];
    let path = isoFolder + filename;

    if (!downloadRequests[filename]) {
        downloadRequests[filename] = request(url);

        progress(downloadRequests[filename]).on('progress', function (state) {
            downloadState[filename] = state; //TODO: add file & url??
        }).on('error', function (err) {
            console.log(err);
            downloadState[filename] = undefined;
            downloadRequests[filename] = undefined;
            fs.unlink(path);
        }).on('end', function () {
            downloadState[filename] = undefined;
            downloadRequests[filename] = undefined;
        }).pipe(fs.createWriteStream(path));
        return next(null, true);
    } else {
        return next({err: "Duplicate download"});
    }
}

function downloadsInfo(next) {
    next(null, downloadState);
}

function stopDownload(filename, next) {
    if (downloadRequests[filename]) {
        downloadRequests[filename].abort();
        removeIso(filename, (err) => {
            return next(null, true);
        })
    } else {
        return next(true);
    }
}

function removeIso(iso, next) {
    checkFolder(isoFolder);
    let path = isoFolder + iso;

    fs.unlink(path, (err) => {
        if (err) return next(err);
        return next(null, true);
    });
}

module.exports = {
    isoList,
    downloadIso,
    downloadsInfo,
    stopDownload,
    removeIso
};