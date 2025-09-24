var fs = require('fs');
var storage = require('./storage.js');

function parsePlaylist(fileName, chunkSize, callback, isFullPath) {
    if (chunkSize === undefined) chunkSize = 30;
    if (isFullPath === undefined) isFullPath = false;
    var processFile = function(filePath) {
        var content;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            return callback(err);
        }

        var lines = content.split(/\r?\n/);
        var playlist = [];
        var currentInfo = {};

        lines.forEach(function(line) {
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

        if (!playlist.length) return callback("No channels found");

        for (var i = 0; i < playlist.length; i += chunkSize) {
            callback(null, playlist.slice(i, i + chunkSize), i, playlist.length);
        }
    };

    if (isFullPath) {
        processFile(fileName);
    } else {
        storage.getFile(fileName, (err, resolvedFileName) => {
            if (err) return callback(err);
            processFile(resolvedFileName);
        });
    }
}

exports.parsePlaylist = parsePlaylist;
