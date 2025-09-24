var storage = require('./storage.js');
var playlist = require('./playlist.js');
var download = require('./download.js');

var LOCAL_PORT = 'BACKEND_PORT';
var REMOTE_PORT = 'FRONTEND_PORT';
var WEB_APP_ID = 'trXOaEAdwm.TOttWebApp';

var localPort = null;
var remotePort = null;

function init() {
    localPort = tizen.messageport.requestLocalMessagePort(LOCAL_PORT);
    remotePort = tizen.messageport.requestRemoteMessagePort(WEB_APP_ID, REMOTE_PORT);
    initMessagePort();
}

function sendMessage(key, value) {
    if (typeof value === "object") {
        value = JSON.stringify(value);
    }
    remotePort.sendMessage([{ key, value }]);
}

function initMessagePort() {
    localPort.addMessagePortListener(function (data) {
        var command = data[0].value;

        if (command === "scanUSB") {
            storage.scanUSB(function (err, files) {
                if (err) return sendMessage("error", err);
                sendMessage("files", files);
            });

        } else {
            try {
                var payload = JSON.parse(command);

                if (payload.cmd === "parseM3U") {
                    sendMessage("status", "parsing the playlist in progress");

                    playlist.parsePlaylist(payload.file, 50, function (err, chunk, offset, total) {
                        if (err) return sendMessage("error", err);

                        sendMessage("playlistChunk", { items: chunk, offset, total });

                        if (offset + chunk.length >= total) {
                            sendMessage("playlistComplete", { total });
                        }
                    });
                
                } else if (payload.cmd === "loadURL") {
                    sendMessage("status", "downloading the playlist in progress");
                    
                    download.download(payload.url, function (err, filePath) {
                        if (err) return sendMessage("error", err.message);

                        sendMessage("status", "parsing the playlist in progress");

                        playlist.parsePlaylist(filePath, 25, function (err, chunk, offset, total) {
                            if (err) {
                                sendMessage("error", err);
                                return storage.drop(filePath, function () {});
                            }

                            sendMessage("playlistChunk", { items: chunk, offset, total });

                            if (offset + chunk.length >= total) {
                                sendMessage("playlistComplete", { total });
                                storage.drop(filePath, function () {});
                            }
                        }, true);
                    });
                }
            } catch (e) {
                sendMessage("error", "invalid command format");
            }
        }
    });

    sendMessage("status", "the service is ready");
}

exports.init = init;
exports.sendMessage = sendMessage;
