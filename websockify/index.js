'use strict';

const net = require('net');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const WebSocketServer = require('ws').Server;
const config = require('../config');

let tokenVar = [];

function findToken(token) {
    return tokenVar.filter((object) => {
        return object["token"] === token;
    })[0]
}

function findTokenByHost(host, port) {
    return tokenVar.filter((object) => {
        return object["host"] === host && object["port"] === port;
    })[0]
}

function addTokenVar(token, host, port) {
    let obj = findTokenByHost(host, port);
    let index = tokenVar.indexOf(obj);
    if (index > -1) {
        tokenVar.splice(index, 1);
    }
    tokenVar.push({
        token: token,
        host: host,
        port: port,
        lastUseTimestamp: Date.now()
    });
}

function updateTokenLastUse(token) {
    let obj = findToken(token);
    let index = tokenVar.indexOf(obj);
    if (index > -1) {
        tokenVar[index].lastUseTimestamp = Date.now();
    }
}

function checkTokenVar(token) {
    return findToken(token);
}

function deleteToken(token) {
    let obj = findToken(token);
    let index = tokenVar.indexOf(obj);
    if (index > -1) {
        tokenVar.splice(index, 1);
    }
}

let auth_plugin = function () {
    return function (info, cb) {
        let queries = url.parse(info.req.url, true).query;

        if (!queries.token || queries.token === "null") {
            console.log("Rejected, no token received");
            return cb(false);
        }

        if (!checkTokenVar(queries.token)) {
            console.log("Rejected, invalid token (" + queries.token + ")");
            return cb(false);
        }

        if (Date.now() - checkTokenVar(queries.token).lastUseTimestamp > config.LEASING_CONSOLE_TIME) {
            console.log("Rejected, expired token (" + queries.token + ")");
            return cb(false);
        }

        console.log("Authorized token (" + queries.token + ")");
        cb(true);
    }
};

// Handle new WebSocket client
let new_client = function (client, req) {
    let clientAddr = client._socket.remoteAddress, log;
    console.log("Request-URL: " + req.url);

    let queries = url.parse(req.url, true).query;

    log = function (msg) {
        console.log(' ' + clientAddr + ': ' + msg);
    };
    log('WebSocket connection');

    console.log("Token: " + queries.token);
    ///////////////////////////////////////////////////////////////////////////////////////////// DELETE???
    if (!queries.token || queries.token === "null") {
        console.log("Rejected, no token received");
        return;
    }

    if (!checkTokenVar(queries.token)) {
        console.log("Rejected, invalid token");
        return;
    }
    /////////////////////////////////////////////////////////////////////////////////////////////
    let tokenHostPort = checkTokenVar(queries.token);

    console.log("Creating connection to " + tokenHostPort.host + ":" + tokenHostPort.port);
    let target = net.createConnection(tokenHostPort.port, tokenHostPort.host, function () {
        log('connected to target');
        updateTokenLastUse(queries.token);
    });
    target.on('data', function (data) {
        try {
            client.send(data);
        } catch (e) {
            log("Client closed, cleaning up target");
            target.end();
        }
    });
    target.on('end', function () {
        log('target disconnected');
        client.close();
    });
    target.on('error', function () {
        log('target connection error');
        target.end();
        client.close();
    });
    client.on('message', function (msg) {
        target.write(msg);
    });
    client.on('close', function (code, reason) {
        log('WebSocket client disconnected: ' + code + ' [' + reason + ']');
        updateTokenLastUse(queries.token);
        target.end();
    });
    client.on('error', function (a) {
        log('WebSocket client error: ' + a);
        target.end();
    });
};

let http_request = function (request, response) {
    response.writeHead(403, {"Content-Type": "text/plain"});
    response.write("403 Permission Denied\n");
    response.end();
};

function init_ws(host, port, certFile, keyFile) {
    console.log("WebSocket settings: ");
    console.log("  Proxying to " + host + ":" + port);

    let webServer;
    if (certFile && keyFile) {
        let cert = fs.readFileSync(certFile);
        let key = fs.readFileSync(keyFile);
        console.log("  Running in encrypted HTTPS (wss://) mode using: " + certFile + ", " + keyFile);
        webServer = https.createServer({cert: cert, key: key}, http_request);
    } else {
        console.log("  Running in unencrypted HTTP (ws://) mode\n");
        webServer = http.createServer(http_request);
    }

    let websocket_server_opts = {
        server: webServer,
        verifyClient: auth_plugin()
    };

    webServer.listen(port, function () {
        let wsServer = new WebSocketServer(websocket_server_opts);
        wsServer.on('connection', new_client);
    });
}

module.exports = {
    init_ws,
    addTokenVar,
    deleteToken
};