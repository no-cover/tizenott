function scanUSB(callback, findFile) {
    tizen.filesystem.listStorages(function(storages) {
        var usb = storages.find(function(s) {
            return s.type === "EXTERNAL" && s.state === "MOUNTED";
        });
        if (!usb) return callback("USB flash drive not connected", null);

        tizen.filesystem.resolve(usb.label, function(dir) {
            dir.listFiles(function(items) {
                if (findFile) {
                    var fileEntry = items.find(function(item) {
                        return item.isFile && item.name === findFile;
                    });
                    if (!fileEntry) return callback("file " + findFile + " not found", null);
                    return callback(null, fileEntry.toURI());
                } else {
                    var files = [];
                    items.forEach(function(item) {
                    if (item.isFile && (item.name.endsWith(".m3u") || item.name.endsWith(".m3u8"))) {
                        files.push(item.name);
                    }
                    });
                    if (files.length > 0) callback(null, files);
                    else callback("No playlist files found", null);
                }
            });
        });
    });
}

function getFile(fileName, callback) {
    scanUSB(callback, fileName);
}

function drop(filePath, callback) {
    tizen.filesystem.resolve(filePath, function(fileEntry) {
        tizen.filesystem.deleteFile(fileEntry.fullPath,
            function() {
                callback(null);
            },
            function(err) {
                callback(err);
            }
        );
    }, function(err) {
        callback(err);
    });
}

exports.scanUSB = scanUSB;
exports.getFile = getFile;
exports.drop = drop;
