'use strict';
const promisify = require('util').promisify;

module.exports = function (configVar) {

    let obj = {};
    const child = require('child'),
        config = configVar || {},
        sshBind = config.sshBind || false;

    function textToArgs(s) {
        let words = [];
        s.replace(/"([^"]*)"|'([^']*)'|(\S+)/g, function (g0, g1, g2, g3) {
            words.push(g1 || g2 || g3 || '')
        });
        return words
    }

    let sysExec = function (command, onClose) {

        onClose = onClose || function () {
        };
        let runCommand;
        if (sshBind !== false) {
            runCommand = sshBind.slice();
            runCommand.push(command)
        } else {
            runCommand = textToArgs(command);
        }

        let errors = '';
        let output = '';

        child({
            command: runCommand.slice(0, 1)[0],
            args: runCommand.slice(1),
            cbStdout: function (data) {
                console.log('OutLog: ' + data);
                output += data;
            },
            cbStderr: function (data) {
                console.log('ErrLog' + data);
                output += data;
                errors += data;
            },
            cbClose: function (exitCode) {
                output += "exitcode: " + exitCode;
                errors += "exitcode: " + exitCode;
                if (exitCode !== 0) {
                    return onClose({"exitCode": exitCode, "errors": errors}, undefined);
                } else {
                    return onClose(null, output);
                }
            }
        }).start()
    };

    /**
     * Lists all snapshots
     * @param name
     * @param template
     * @param bdevOptions [can be null]
     * @param next
     */

    obj.create = promisify(function (name, template, bdevOptions, next) {
        if (!bdevOptions) {
            sysExec('lxc-create -n ' + name +
                ' -t ' + template,
                next);
        } else {
            sysExec('lxc-create -n ' + name +
                ' -t ' + template +
                ' -B ' + bdevOptions.bdev +
                ' --vgname ' + bdevOptions.vgname +
                ' --lvname ' + bdevOptions.lvname +
                ' --fssize ' + bdevOptions.fssize,
                next);
        }
    });

    obj.destroy = promisify(function (name, next) {
        sysExec('lxc-destroy -n ' + name, next);
    });

    obj.start = promisify(function (name, next) {
        sysExec('lxc-start -n ' + name + ' -d', next);
    });

    obj.stop = promisify(function (name, next) {
        sysExec('lxc-stop -n ' + name, next);
    });

    obj.freeze = promisify(function (name, next) {
        sysExec('lxc-freeze -n ' + name, next);
    });

    obj.unfreeze = promisify(function (name, next) {
        sysExec('lxc-unfreeze -n ' + name, next);
    });

    /**
     * creates a new snapshot
     * @param name
     * @param next
     */
    obj.createSnapshot = promisify(function (name, next) {
        sysExec('lxc-snapshot -n ' + name, next);
    });

    /**
     * deletes a snapshot
     * @param name
     * @param snapshotName
     * @param next
     */
    obj.deleteSnapshot = promisify(function (name, snapshotName, next) {
        sysExec('lxc-snapshot -n ' + name + ' -d ' + snapshotName, next);
    });

    /**
     * restores a snapshot
     * @param name
     * @param snapshotName
     * @param newName [optional] name of restored lxc.
     * @param next
     */
    obj.restoreSnapshot = promisify(function (name, snapshotName, newName, next) {
        if (typeof newName === 'function') {
            next = newName;
            newName = name;
        }
        sysExec('lxc-snapshot -n ' + name + ' -r ' + snapshotName + " -N " + newName, next);
    });

    /**
     * Lists all snapshots
     * @param name
     * @param next
     */
    obj.listSnapshots = promisify(function (name, next) {
        sysExec('lxc-snapshot -L -n ' + name,
            function (errors, output) {
                if (errors) return next(errors, undefined);
                output = output.split("\n");

                let snapshots = [];
                output.forEach(function (line) {
                    line = line.split(" ");
                    ret.push({
                        name: line[0],
                        dir: line[1],
                        date: line[2] + " " + line[3]
                    });
                });

                return next(null, snapshots);
            });
    });

    /**
     * Returns machine's ip
     * @param name
     * @param next
     */
    obj.getIP = promisify(function (name, next) {
        sysExec('lxc-info -H -i -n ' + name, next);
    });

    /**
     * Wrapper for lxc-attach command
     * @param name
     * @param command
     * @param next
     */
    obj.attach = promisify(function (name, command, next) {
        sysExec('lxc-attach -n ' + name + ' -- ' + command, next);
    });

    /**
     * Wrapper for lxc-ls command (lxc-ls -f -F name,state,ipv4,ipv6,autostart,pid,memory,ram,swap)
     * @param next
     */
    obj.list = promisify(function (next) {
        sysExec('lxc-ls -f -F name,state,ipv4,ipv6,autostart,pid,memory,ram,swap',
            function (errors, output) {
                if (errors) return next(errors, undefined);
                let containers = [];
                output = output.split("\n");
                for (let i in output) {
                    let content = output[i].trim();
                    if (content.indexOf('RUNNING') >= 0 ||
                        content.indexOf('FROZEN') >= 0 ||
                        content.indexOf('STOPPED') >= 0) {
                        let vals = content.split(/\s+/gi);
                        if (vals.length >= 2) {
                            containers.push({
                                "name": vals[0],
                                "state": vals[1],
                                "ipv4": vals[2] === '-' ? undefined : vals[2],
                                "ipv6": vals[3] === '-' ? undefined : vals[3],
                                "autostart": vals[4] === '-' ? undefined : vals[4],
                                "pid": vals[5] === '-' ? undefined : vals[5],
                                "memory": vals[6] === '-' ? 0 : parseFloat(vals[6]),
                                "ram": vals[7] === '-' ? 0 : parseFloat(vals[7]),
                                "swap": vals[8] === '-' ? 0 : parseFloat(vals[8]),
                            });
                        }
                    }
                }
                return next(null, containers);
            }
        );
    });

    obj.autostart = promisify(function (name, next) {
        sysExec('lxc-autostart', next);
    });

    obj.isRunning = promisify(function (name, next) {
        sysExec('lxc-info -n ' + name, (errors, output) => {
            if (errors) return next(errors, undefined);
            output = output.split("\n");
            if (output[1] && output[1].indexOf("RUNNING") >= 0) {
                return next(null, true);
            } else {
                return next(null, false);
            }
        });
    });

    obj.getInfo = promisify(function (name, next) {
        obj.list().then((list) => {
            let ct = list.filter((ct) => {
                return ct.name === name;
            })[0];
            next(null, ct);
        }).catch((err) => {
            next(err, undefined);
        })
    });

    return obj;
};
