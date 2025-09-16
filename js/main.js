App = window.App || {};
App.Main = (function Main() {

    window.onload = async function () {
        App.Background.init();
        App.Background.show();
        await App.DB.init();
        App.Navigation.initRemoteKeys();
        App.Channel.newChannelInfo();
        App.Menu.newBoard();
        App.Lottie.newLoading();
        App.Message.registerLocalPortListener();

        var currentPlaylistId = localStorage.getItem('currentPlaylistId');
        if (currentPlaylistId) {
            try {
                var { playlist, index } = await App.DB.getCurrentChannel();
                if (playlist.length) {
                    var channel = playlist[index];
                    App.Player.play(channel.uri);
                    App.Channel.showAndUpd({ logo: channel.tvgLogo, name: channel.name, number: index + 1 });
                } else {
                    App.Menu.showBoard();
                }
            } catch (err) {
                App.Log.print(`[FRONT] error loading last channel ${err}`);
                App.Menu.showBoard();
            }
        } else {
            App.Menu.showBoard();
        }
    };

}());
