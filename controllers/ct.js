'use strict';
const crypto = require('crypto');
const lxc = require('./wrappers/lxc_wrapper')();
const wetty = require('../wetty');

function create(req, res) {
    const name = req.body.name;
    const template = req.body.template;
    const bdev_options = req.body.bdev_options;

    lxc.create(name, template, bdev_options).then(() => {
        res.status(201).send({message: "Container created"});
    }).catch((err) => {
        console.log(err);
        res.status(500).send({message: "Some error occurred"});
    });
}

function list(req, res) {
    lxc.list().then((list) => {
        res.status(200).send(list);
    }).catch((err) => {
        console.log(err);
        res.status(500).send({message: "Some error occurred"});
    })
}

function getInfo(req, res) {
    const name = req.params.name;

    lxc.getInfo(name).then((info) => {
        res.status(200).send(info);
    }).catch((err) => {
        res.status(500).send(err);
    })
}

function edit(req, res) {
    res.status(400).send("Unimplemented");
}

function changeStatus(req, res) {
    const name = req.params.name;
    const status = req.params.status;

    switch (status) {
        case "start":
            lxc.isRunning(name).then((isRunning) => {
                if (!isRunning) {
                    lxc.start(name).then(() => {
                        res.status(200).send({message: "Container started"});
                    }).catch((err) => {
                        console.log(err);
                        res.status(500).send({message: "Some error occurred"});
                    });
                } else {
                    req.status(409).send({message: "The container is already running"})
                }
            });
            break;
        case "stop":
            lxc.isRunning(name).then((isRunning) => {
                if (isRunning) {
                    lxc.stop(name).then(() => {
                        res.status(200).send({message: "Container stopped"});
                    }).catch((err) => {
                        console.log(err);
                        res.status(500).send({message: "Some error occurred"});
                    });
                } else {
                    res.status(409).send({message: "The container is already stopped"})
                }
            });
            break;
        case "restart":
            lxc.isRunning(name).then((isRunning) => {
                if (isRunning) {
                    lxc.stop(name).then(() => {
                        return lxc.start(name)
                    }).then(() => {
                        res.status(200).send({message: "Container restarted"});
                    }).catch((err) => {
                        console.log(err);
                        res.status(500).send({message: "Some error occurred"});
                    });
                } else {
                    res.status(409).send({message: "The container is stopped"});
                }
            }).catch((err) => {
                console.log(err);
                res.status(500).send({message: "Some error occurred"});
            });
            break;
    }


}

function exec(req, res) {
    const name = req.params.name;
    const command = req.params.command;

    lxc.attach(name, command).then(() => {
        res.status(200).send({message: "Some error occurred"});
    }).catch((err) => {
        console.log(err);
        res.status(500).send({message: "Some error occurred"});
    })
}

function remove(req, res) {
    const name = req.params.name;

    lxc.destroy(name).then(() => {
        res.status(200).send({message: "Container removed"});
    }).catch((err) => {
        console.log(err);
        res.status(500).send({message: "Some error occurred"});
    })
}

function getConsoleSession(req, res) {
    let ct_name = req.params.name;
    lxc.isRunning(ct_name).then((isRunning) => {
        if (isRunning) {
            let token = crypto.randomBytes(10).toString('hex');
            wetty.addTokenVar(token, ct_name);
            res.status(200).send({token: token});
        } else {
            res.status(409).send({message: "The container is not running"})
        }
    });

}

module.exports = {
    create,
    list,
    getInfo,
    edit,
    changeStatus,
    exec,
    remove,
    getConsoleSession
};