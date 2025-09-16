App = window.App || {};
App.Player = (function Player() {

    var avplay = null;
    var currentUri = null;

    function init() {
        if (avplay) return;
        avplay = document.getElementById('av-player');

        webapis.avplay.setListener({
            onbufferingstart: () => {
                App.Log.print("[AVPlayer] buffer start");
                App.Lottie.showLoading();
            },
            onbufferingprogress: (percent) => {
                App.Log.print(`[AVPlayer] buffer progress: ${percent}%`);
            },
            onbufferingcomplete: () => {
                App.Log.print("[AVPlayer] buffer complete");
                App.Lottie.hideLoading();
            },
            onerror: (err) => {
                App.Log.print("[AVPlayer] ERROR: " + JSON.stringify(err));
                App.Lottie.hideLoading();
                App.Background.show();
            }
        });
    }

    function play(uri) {
        if (!uri) {
            App.Log.print("[AVPlayer] no URI to play");
            return;
        }

        init();
        try {
            if (webapis.avplay.getState() !== "NONE") {
                webapis.avplay.stop();
            }
        } catch (e) {
            App.Log.print(`[AVPlayer] stop error: ${e.message}`);
        }

        currentUri = uri;
        webapis.avplay.open(currentUri);
        webapis.avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);

        webapis.avplay.prepareAsync(() => {
            webapis.avplay.play();
            App.Log.print(`[AVPlayer] playing URI: ${currentUri}`);
            App.Background.hide();
        }, (err) => {
            App.Log.print(`[AVPlayer] prepare error: ${JSON.stringify(err)}`);
            App.Background.show();
        });
    }

    function stop() {
        try {
            webapis.avplay.stop();
            App.Log.print("[AVPlayer] stopped");
            App.Background.show();
        } catch (e) {
            App.Log.print(`[AVPlayer] stop error: ${e.message}`);
        }
    }

    return {
        init,
        play,
        stop
    };
}());
