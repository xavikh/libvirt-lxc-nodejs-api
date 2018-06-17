const express = require('express');
const http = require('http');
const path = require('path');
const url = require('url');
const pty = require('pty.js');
const WebSocketServer = require('ws').Server;

const config = require('../config');

let tokenVar = [];

function findToken(token) {
    return tokenVar.filter((object) => {
        return object["token"] === token;
    })[0]
}

function findTokenByHost(ctName) {
    return tokenVar.filter((object) => {
        return object["ctName"] === ctName;
    })[0]
}

function addTokenVar(token, ctName) {
    let obj = findTokenByHost(ctName);
    let index = tokenVar.indexOf(obj);
    if (index > -1) {
        tokenVar.splice(index, 1);
    }
    tokenVar.push({
        token: token,
        ctName: ctName,
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

    console.log('TOKEN ' + JSON.stringify(findToken(queries.token)));
    const term = pty.spawn('lxc-attach', ['-n' + findToken(queries.token).ctName]);

    console.log((new Date()) + " PID=" + term.pid + " STARTED");

    term.on('data', function (data) {
        client.send(stringifyMsg('output', data));
    });

    term.on('exit', function (code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED with CODE=" + code);
    });

    client.on('message', function (data) {
        let msg = parseMsg(data);
        switch (msg.type) {
            case 'input':
                term.stdin.write(msg.data);
                break;
            case 'resize':
                if (!term.readable || !term.writable || term.destroyed) break;
                term.resize(msg.data.col, msg.data.row);
                break;
        }
    });

    client.on('close', function () {
        term.end();
    });
};

function stringifyMsg(type, data) {
    return JSON.stringify({
        type: type,
        data: data
    });
}

function parseMsg(msg) {
    if (!msg) return {
        type: null,
        data: null
    };
    let msgAux = JSON.parse(msg);
    if (!msgAux.type) return {
        type: null,
        data: null
    };
    return {
        type: msgAux.type,
        data: msgAux.data
    };
}

let http_request = function (request, response) {
    response.writeHead(403, {"Content-Type": "text/plain"});
    response.write("403 Permission Denied\n");
    response.end();
};

function init_ws(host, port) {
    console.log("WebSocket settings: ");
    console.log("  Proxying to " + host + ":" + port);

    const app = express();
    app.use('/', express.static(path.join(__dirname, 'public')));

    let webServer = http.createServer(app);

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