App = window.App || {};
App.Navigation = (function Navigation() {

    var channelBuf = "";
    var bufTimeout = null;

    function initRemoteKeys() {
        tizen.tvinputdevice.registerKey("ChannelUp");
        tizen.tvinputdevice.registerKey("ChannelDown");
        tizen.tvinputdevice.registerKeyBatch(["0","1","2","3","4","5","6","7","8","9"]);

        document.addEventListener('keydown', function (event) {
            if (App.State.isInputActive) return;
            
            switch (event.keyCode) {
                case 48: case 49: case 50: case 51: case 52:
                case 53: case 54: case 55: case 56: case 57:
                case 96: case 97: case 98: case 99: case 100:
                case 101: case 102: case 103: case 104: case 105: {
                    const digit = (event.keyCode >= 96) ? event.keyCode - 96 : event.keyCode - 48;
                    if (channelBuf.length < 4) {
                        channelBuf += digit;
                    }

                    App.Channel.updChannelNum(channelBuf);

                    if (bufTimeout) clearTimeout(bufTimeout);
                    bufTimeout = setTimeout(() => {
                        var num = parseInt(channelBuf, 10);
                        channelBuf = "";
                        bufTimeout = null;

                        if (!isNaN(num)) {
                            App.DB.playChannelByNum(num);
                        }
                    }, 3000);
                    break;
                }
                case 427: // ChannelUp
                    App.DB.playNext();
                    break;
                case 428: // ChannelDown
                    App.DB.playPrev();
                    break;
                case 37: // Left = Back
                case 10009: // Return
                    App.Menu.goBack();
                    break;
                case 38: // Up
                    App.Menu.moveFocus(-1);
                    break;
                case 40: // Down
                    App.Menu.moveFocus(1);
                    break;
                case 13: // Enter
                    if (App.State.isMenuActive) {
                        App.Menu.selectItem();
                    }
                    break;
                case 39: // Right ==> show menu
                    if (App.State.isDeleteMode) {
                        App.Menu.deletePlaylist();
                    } else {
                        App.Menu.showBoard();
                    }
                    break;
            }
        });
    }

    return { initRemoteKeys };
})();
