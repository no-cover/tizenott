var fs = require('fs');
var path = require('path');

var USB_ROOT = '/opt/media';

function scanUSB(callback, findFile) {
    fs.readdir(USB_ROOT, function(err, drives) {
        if (err) return callback("USB root not accessible: " + err, null);
        if (!drives || drives.length === 0) return callback("USB flash drive not connected", null);

        var usbPath = path.join(USB_ROOT, drives[0]);

        fs.readdir(usbPath, function(err, files) {
            if (err) return callback("Failed to read USB: " + err, null);

            if (findFile) {
                var fileEntry = files.find(function(f) {
                    return f === findFile;
                });
                if (!fileEntry) return callback("file " + findFile + " not found", null);
                return callback(null, path.join(usbPath, fileEntry));

            } else {
                var playlists = [];
                files.forEach(function(f) {
                    if (f.endsWith(".m3u") || f.endsWith(".m3u8")) {
                        playlists.push(f);
                    }
                });
                if (playlists.length > 0) callback(null, playlists);
                else callback("No playlist files found", null);
            }
        });
    });
}

function getFile(fileName, callback) {
    scanUSB(callback, fileName);
}

function drop(filePath, callback) {
    unlink(filePath, function(err) {
        if (err) return callback(err);
        callback(null);
    });
}

exports.scanUSB = scanUSB;
exports.getFile = getFile;
exports.drop = drop;
