var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var os = require('os');
var storage = require('./storage.js');

function download(url, callback) {
    var client = url.startsWith('https') ? https : http;
    var filename = path.join(os.tmpdir(), path.basename(url));
    var file = fs.createWriteStream(filename);

    client.get(url, function(res) {
        if (res.statusCode === 302 && res.headers.location) {
            file.close(function() {
                storage.drop(filename, function() {
                    download(res.headers.location, callback);
                }, true);
            });
            return;
        }

        if (res.statusCode !== 200) {
            file.close(function() {
                storage.drop(filename, function() {
                    callback(new Error("Download failed, status: " + res.statusCode));
                }, true);
            });
            return;
        }

        res.pipe(file);
        file.on("finish", function() {
            file.close(function() {
                callback(null, filename);
            });
        });

    }).on("error", function(err) {
        file.close(function() {
            storage.drop(filename, function() {
                callback(err);
            }, true);
        });
    });
}

exports.download = download;
