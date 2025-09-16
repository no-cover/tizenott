App = window.App || {};
App.Input = (function Input() {

    function handleKeyDownInput(event) {
        switch (event.keyCode) {
            case 13: // Enter
            case 65376: // OK
                var url = event.target.value.trim();

                var name = url.split("/").pop();

                if (url) {
                    App.Log.print(`[FRONT] url entered ${url}`);
                    App.Message.sendMsg([{ 
                        key: "data", 
                        value: JSON.stringify({ cmd: "loadURL", url }) 
                    }]);
                }
                App.Lottie.showLoading();
                App.Menu.hideBoard();
                App.State.isInputActive = false;
                App.State.name = name;
                break;
            
            case 27: // Escape
            case 10009: // RETURN
                App.Menu.goBack();
                App.State.isInputActive = false;
                break;

            default:
                // skip
                break;
        }
    }

    return { handleKeyDownInput };
})();
