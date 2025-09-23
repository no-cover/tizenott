var checkUrl = function(url) {
  return (/^https?:\/\//i.test(url)) ? url : 'http://' + url;
}

function download(url, callback) {
    url = checkUrl(url);
    var request = new tizen.DownloadRequest(url, 'tmp');

    var listener = {
        oncompleted: function(id, fullPath) {
            callback(null, fullPath);
        },
        onfailed: function(id, error) {
            callback(new Error(error.message));
        }
    };

    try {
        tizen.download.start(request, listener);
    } catch (e) {
        callback(new Error(e.message));
    }
}

exports.download = download;
