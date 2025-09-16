App = window.App || {};
App.DB = (function DB() {

    const DB_NAME = 'playlistsDB';
    const STORE_NAME = 'playlists';
    const DB_VERSION = 1;
    var db = null;
    var playTimeout = null;
    var channelQueue = null;

    function init() {
        return new Promise((resolve, reject) => {
            var request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = e => reject(e.target.error);
            request.onsuccess = e => { db = e.target.result; resolve(); };
            request.onupgradeneeded = e => {
                db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    function savePlaylist(playlist, name, id) {
        id = id || null;
        return new Promise(function (resolve, reject) {
            if (!playlist || !playlist.length) return reject("empty playlist");

            var shortName = name.split('.')[0];

            var tx = db.transaction(STORE_NAME, 'readwrite');
            var store = tx.objectStore(STORE_NAME);

            var getAllReq = store.getAll();
            getAllReq.onsuccess = function () {
                var result = getAllReq.result || [];
                var existing = null;
                for (var i = 0; i < result.length; i++) {
                    if (result[i].shortName === shortName) {
                        existing = result[i];
                        break;
                    }
                }

                var request;
                if (id || existing) {
                    var targetId = id || (existing ? existing.id : null);
                    request = store.put({ id: targetId, items: playlist, shortName: shortName });
                } else {
                    request = store.add({ items: playlist, shortName: shortName });
                }

                request.onsuccess = function (e) {
                    var newId = id || (existing ? existing.id : null) || e.target.result;

                    var meta;
                    try {
                        meta = JSON.parse(localStorage.getItem('playlistsData') || "[]");
                    } catch (err) {
                        meta = [];
                    }

                    for (var i = 0; i < meta.length; i++) {
                        meta[i].active = (meta[i].id === newId);
                    }

                    var idx = -1;
                    for (var i = 0; i < meta.length; i++) {
                        if (meta[i].id === newId) {
                            idx = i;
                            break;
                        }
                    }

                    if (idx >= 0) {
                        meta[idx] = { id: newId, shortName: shortName, active: true };
                    } else {
                        meta.push({ id: newId, shortName: shortName, active: true });
                    }

                    localStorage.setItem('playlistsData', JSON.stringify(meta));
                    localStorage.setItem('currentPlaylistId', newId);
                    localStorage.setItem('currentChannelId', 0);

                    App.Player.play(playlist[0].uri);
                    App.Channel.showAndUpd({
                        logo: playlist[0].tvgLogo,
                        name: playlist[0].name,
                        number: 1
                    });

                    resolve(newId);
                };

                request.onerror = function (e) {
                    reject(e.target.error);
                };
            };

            getAllReq.onerror = function (e) {
                reject(e.target.error);
            };
        });
    }

    function appendPlaylist(items) {
        var current = JSON.parse(localStorage.getItem("playlistBuf") || "[]");
        current = current.concat(items);
        localStorage.setItem("playlistBuf", JSON.stringify(current));
    }

    function completePlaylist() {
        var playlist = JSON.parse(localStorage.getItem("playlistBuf") || "[]");
        localStorage.removeItem("playlistBuf");
        if (playlist.length) {
            savePlaylist(playlist, App.State.name);
        }
    }


    function getSavedPlaylists() {
        return new Promise((resolve, reject) => {
            try {
                var list = JSON.parse(localStorage.getItem('playlistsData') || "[]");
                resolve(list);
            } catch (e) {
                reject(e);
            }
        });
    }

    function getCurrentChannel() {
        return new Promise((resolve, reject) => {
            var activeId = parseInt(localStorage.getItem('currentPlaylistId') || '1');
            var tx = db.transaction(STORE_NAME, 'readonly');
            var store = tx.objectStore(STORE_NAME);
            var req = store.get(activeId);

            req.onsuccess = e => {
                var playlist = [];
                if (e.target.result && e.target.result.items) {
                    playlist = e.target.result.items;
                }
                var idx = parseInt(localStorage.getItem('currentChannelId') || 0);
                resolve({ playlist, index: idx });
            };
            req.onerror = e => reject(e.target.error);
        });
    }

    function setPlayQue(channel, index) {
        channelQueue = { channel, index };

        if (playTimeout) clearTimeout(playTimeout);

        playTimeout = setTimeout(() => {
            if (!channelQueue) return;
            App.Player.play(channelQueue.channel.uri);
            channelQueue = null;
            playTimeout = null;
        }, 400);
    }

    function playNext() {
        getCurrentChannel().then(({ playlist, index }) => {
            if (!playlist.length) return;
            var nextIdx = (index + 1) % playlist.length;
            var channel = playlist[nextIdx];

            localStorage.setItem('currentChannelId', nextIdx);
            App.Channel.showAndUpd({ 
                logo: channel.tvgLogo, 
                name: channel.name, 
                number: nextIdx + 1 
            });

            setPlayQue(channel, nextIdx);
        });
    }

    function playPrev() {
        getCurrentChannel().then(({ playlist, index }) => {
            if (!playlist.length) return;
            var prevIdx = (index - 1 + playlist.length) % playlist.length;
            var channel = playlist[prevIdx];

            localStorage.setItem('currentChannelId', prevIdx);
            App.Channel.showAndUpd({ 
                logo: channel.tvgLogo, 
                name: channel.name, 
                number: prevIdx + 1 
            });

            setPlayQue(channel, prevIdx);
        });
    }

    function loadPlaylistById(id, name) {
        return new Promise((resolve, reject) => {
            var tx = db.transaction(STORE_NAME, 'readonly');
            var store = tx.objectStore(STORE_NAME);
            var req = store.get(id);

            req.onsuccess = e => {
                var result = e.target.result;
                localStorage.setItem('currentPlaylistId', id);
                localStorage.setItem('currentChannelId', 0);
                if (result && result.items && result.items.length) {
                    var items = result.items;

                    App.DB.savePlaylist(items, name, id)
                        .then(() => {
                            App.Channel.showAndUpd({
                                logo: items[0].tvgLogo,
                                name: items[0].name,
                                number: 1
                            });
                            resolve({ items, firstUri: items[0].uri });
                        })
                        .catch(err => reject(err));
                } else {
                    resolve({ items: [], firstUri: null });
                }
            };

            req.onerror = e => reject(e.target.error);
        });
    }

    function deletePlaylistById(id) {
        return new Promise((resolve, reject) => {
            var tx = db.transaction(STORE_NAME, 'readwrite');
            var store = tx.objectStore(STORE_NAME);
            var req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e.target.error);
        });
    }

    async function playChannelByNum(number) {
        return getCurrentChannel().then(({ playlist, index }) => {
            if (!playlist.length) return;

            var targetIdx;
            if (isNaN(number) || number < 1 || number > playlist.length) {
                targetIdx = Math.max(0, index);
            } else {
                targetIdx = number - 1;
            }

            var channel = playlist[targetIdx];

            localStorage.setItem('currentChannelId', targetIdx);
            App.Channel.showAndUpd({
                logo: channel.tvgLogo,
                name: channel.name,
                number: targetIdx + 1
            });

            setPlayQue(channel, targetIdx);
        });
    }

    return {
        init,
        savePlaylist,
        playNext,
        playPrev,
        appendPlaylist,
        completePlaylist,
        getSavedPlaylists,
        loadPlaylistById,
        deletePlaylistById,
        getCurrentChannel,
        playChannelByNum
    };
})();
