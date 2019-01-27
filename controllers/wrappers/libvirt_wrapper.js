const HP = require('../../lib/index').Hypervisor;
const parseError = require('./errorsLibvirt').parseError;

// const hp = new HP('qemu+ssh://admin@192.168.0.10/system');
const hp = new HP('qemu:///system');

function connect(next) {
    hp.isConnectionAlive((err, isAlive) => {
        if (isAlive) {
            next();
        } else {
            hp.connect((err) => {
                if (err) return next(parseError(err));
                next();
            })
        }
    });
}

module.exports = {
    connect,
    hp
};