'use strict';
const fs = require('fs');

function isoList(next) {
    const testFolder = '/isos/';

    fs.readdir(testFolder, (err, files) => {
        if (err) return next(err);
        next(null, files);
    })
}


module.exports = {
    isoList
};