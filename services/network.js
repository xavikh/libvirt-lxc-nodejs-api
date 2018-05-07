'use strict';

const fs = require("fs");
const {exec} = require('child_process');
const cron = require('node-cron');

const config = require('../config');

let mac_ip_list = [];

function randomMAC(prefix) {
    let mac = prefix || '52:54:00';
    for (let i = 0; i < 6; i++) {
        if (i % 2 === 0) mac += ':';
        mac += Math.floor(Math.random() * 16).toString(16);
    }
    return mac;
}

function ipMacAnalysis() {
    console.log("Analysing IPs...");
    exec("nmap -sP --send-ip 192.168.0.0/24", () => {
        exec("/sbin/ip n | grep REACHABLE", (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            let promises = stdout.split('\n').slice(0, -1).map((line) => {
                return new Promise((resolve, reject) => {
                    if (line.length > 0) {
                        let splitedLine = line.split(' ');
                        let ip = splitedLine[0];
                        let mac = splitedLine[4];
                        resolve({
                            mac: mac,
                            ip: ip
                        });
                    }
                });
            });
            Promise.all(promises).then((mac_ip) => {
                mac_ip_list = mac_ip.sort((a, b) => {
                    return a.ip.split('.')[3] - b.ip.split('.')[3];
                });
                console.log(mac_ip_list);
                console.log(mac_ip_list.length + " IPs found");
                fs.writeFileSync('ip_mac_scanner_results.json', JSON.stringify(mac_ip_list));
            });
        });
    });
}

function getIpMacList() {
    return mac_ip_list;
}

function getIpForMac(mac) {
    return mac_ip_list.filter((elem) => {
        return elem.mac === mac;
    })[0];
}

function startContinousIpScan() {
    fs.readFile('ip_mac_scanner_results.json', (err, data) => {
        if (err) return;
        mac_ip_list = JSON.parse(data.toString());
    });
    ipMacAnalysis();
    cron.schedule('*/' + config.IP_MAC_UPDATETIME + ' * * * *', function () {
        ipMacAnalysis();
    });
}


module.exports = {
    startContinousIpScan,
    getIpForMac,
    getIpMacList,
    ipMacAnalysis,
    randomMAC
};