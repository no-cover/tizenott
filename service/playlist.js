var storage = require('./storage.js');

function parsePlaylist(filePathOrName, chunkSize, callback, isFullPath) {
    if (typeof chunkSize === 'undefined') chunkSize = 25;
    if (typeof isFullPath === 'undefined') isFullPath = false;
    var processFile = function (filePath) {
        tizen.filesystem.resolve(filePath, function (fileEntry) {
            fileEntry.readAsText(function (content) {
                var lines = content.split(/\r?\n/);
                var playlist = [];
                var currentInfo = {};

                lines.forEach(function (line) {
                    line = line.trim();
                    if (!line) return;

                    if (line.startsWith("#EXTINF:")) {
                        var tvgMatch = line.match(/tvg-logo="(.*?)"/);
                        var groupMatch = line.match(/group-title="(.*?)"/);
                        var nameMatch = line.match(/,(.*)$/);

                        currentInfo = {
                            name: (nameMatch && nameMatch[1]) ? nameMatch[1].trim() : "",
                            tvgLogo: (tvgMatch && tvgMatch[1]) ? tvgMatch[1] : "",
                            groupTitle: (groupMatch && groupMatch[1]) ? groupMatch[1] : ""
                        };

                    } else if (!line.startsWith("#")) {
                        if (!currentInfo.name || !line) return;
                        playlist.push({
                            name: currentInfo.name,
                            tvgLogo: currentInfo.tvgLogo,
                            groupTitle: currentInfo.groupTitle,
                            uri: line
                        });
                        currentInfo = {};
                    }
                });

                if (!playlist.length) {
                    return callback("No channels found");
                }

                for (var i = 0; i < playlist.length; i += chunkSize) {
                    var chunk = playlist.slice(i, i + chunkSize);
                    callback(null, chunk, i, playlist.length);
                }

            }, function (err) { callback(err); });
        }, function (err) { callback(err); });
    };

    if (isFullPath) {
        processFile(filePathOrName);
    } else {
        storage.getFile(filePathOrName, function (err, filePath) {
            if (err) return callback(err);
            processFile(filePath);
        });
    }
}

exports.parsePlaylist = parsePlaylist;
