App = window.App || {};
App.Message = (function Message() {

    const BKG_APP_ID = 'trXOaEAdwm.TOttService';
    const REMOTE_PORT = 'BACKEND_PORT';
    const LOCAL_PORT = 'FRONTEND_PORT';

    const localPort = tizen.messageport.requestLocalMessagePort(LOCAL_PORT);
    var remotePort = null;
    var messageQueue = [];
    var isServiceStarted = false;

    function launchService(appId) {
        App.Log.print(`[FRONT] launch : ${appId}`);
        var appctrl = new tizen.ApplicationControl(
            'http://tizen.org/appcontrol/operation/service',
            null, null, null, null
        );
        tizen.application.launchAppControl(
            appctrl,
            appId,
            function() { App.Log.print(`[FRONT] service app started : ${appId}`); isServiceStarted = true; },
            function(error) {
                App.Log.print(`[FRONT] failed: ${error.message}`);
                tizen.application.getCurrentApplication().exit();
            }
        );
    }

    function registerLocalPortListener() {
        localPort.addMessagePortListener(function (data) {
            data.forEach(function (message) {
                var key = message.key;
                var value = message.value;
                isServiceStarted = true;

                switch (key) {
                    case "files":
                        try {
                            var files = JSON.parse(value);
                            App.State.isScanning = false;
                            App.Menu.renderFiles(files);
                        } catch (e) {
                            App.Log.print(`[FRONT] invalid files data ${value}`);
                        }
                        App.Lottie.hideLoading();
                        break;

                    case "playlistChunk":
                        try {
                            var data = (typeof value === "string") ? JSON.parse(value) : value;
                            var { items, offset, total } = data;

                            App.Log.print(`[FRONT] chunk ${offset}..${offset + items.length}/${total}`);
                            App.DB.appendPlaylist(items);

                            if (offset === 0 && items.length > 0) {
                                App.DB.playFirst(items[0]);
                            }
                        } catch (e) {
                            App.Log.print(`[FRONT] invalid chunk data ${value}`);
                        }
                        break;

                    case "playlistComplete":
                        try {
                            var { total } = JSON.parse(value);
                            App.Log.print(`[FRONT] playlist transfer complete | total : ${total}`);
                            App.DB.completePlaylist();
                            App.State.isScanning = false;
                        } catch (e) {
                            App.Log.print(`[FRONT] invalid chunk data ${value}`);
                        }
                        break;

                    case "error":
                        App.Log.printAlert(value);
                        App.State.isScanning = false;
                        App.Lottie.hideLoading();
                        break;

                    case "status":
                        App.Log.print(`[BACK] ${value}`);
                        break;

                    default:
                        App.Log.print(`[FRONT] unknown key from service: ${key} | ${value}`);
                }

                while (messageQueue.length > 0) {
                    sendMsg(messageQueue.shift());
                }
            });
        });
    }

    function sendMsg(msg) {
        if (!isServiceStarted) {
            messageQueue.push(msg);
            launchService(BKG_APP_ID);
        } else {
            try {
                remotePort = tizen.messageport.requestRemoteMessagePort(BKG_APP_ID, REMOTE_PORT);
                App.Log.print(msg);
                remotePort.sendMessage(msg, localPort);
                App.Log.print(`[FRONT] push message`);
            } catch (error) {
                App.Log.print(`[FRONT] message sending error ${error}`);
            }
        }
    }

    return {
        sendMsg,
        registerLocalPortListener
    };
}());
