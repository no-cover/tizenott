App = window.App || {};
App.Menu = (function Menu() {

    const menuDate = [{ [App.Len.TIZEN_LEN.COM_LOAD]: [ { [App.Len.TIZEN_LEN.COM_LOAD_URL]: [{ type: "input", placeholder: "" }] }, App.Len.TIZEN_LEN.COM_LOAD_STORAGE ]},
        App.Len.TIZEN_LEN.COM_PLAYLISTS,
        App.Len.TIZEN_LEN.COM_EXIT
    ];

    var menuStack = [];
    var currentData = menuDate;
    var focusedIndex = 0;
    App.State = { isScanning: false, currentPlaylist: null, isDeleteMode: false, isMenuActive: false };

    function newBoard() {
        var popup = document.createElement("div");
        popup.id = "popup";
        popup.classList.add("hidden");
        document.body.appendChild(popup);

    }

    function renderMenu(data) {
        var popup = document.getElementById("popup");
        popup.innerHTML = "";

        var ul = document.createElement("ul");
        var firstInput = null;

        var savedPlaylists = JSON.parse(localStorage.getItem("playlistsData") || "[]");
        var playlistNames = savedPlaylists
            .map(p => p && p.shortName)
            .filter(Boolean);

        data.forEach(item => {
            if (!item) return;

            if (typeof item === "string") {
                var li = document.createElement("li");

                li.textContent = item;

                if (playlistNames.includes(item)) {
                    li.dataset.playlistName = item;

                    li.textContent = item.length > 18 ? item.slice(0, 15) + "…" : item;

                    var lottieContainer = document.createElement("div");
                    lottieContainer.classList.add("checkbox");
                    li.appendChild(lottieContainer);
                }

                ul.appendChild(li);
            }

            else if (item.type === "input") {
                var input = document.createElement("input");
                input.classList.add("input");
                input.type = "text";
                input.placeholder = item.placeholder || "";
                input.addEventListener("keydown", App.Input.handleKeyDownInput);

                ul.appendChild(input);

                if (!firstInput) firstInput = input;
            }

            else if (typeof item === "object") {
                var li = document.createElement("li");
                li.textContent = Object.keys(item)[0];
                ul.appendChild(li);
            }
        });

        popup.appendChild(ul);
        ul.scrollTop = 0;

        currentData = data;
        focusedIndex = 0;
        focusItem();

        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
                App.State.isInputActive = true;
            });
        }

        App.Lottie.init().then(() => {
            var items = document.querySelectorAll("#popup li");

            items.forEach(li => {
                if (li.dataset && li.dataset.playlistName) {
                    var pl = savedPlaylists.find(p => p.shortName === li.dataset.playlistName);
                    var checkbox = li.querySelector(".checkbox");

                    if (pl && checkbox) {
                        App.Lottie.setStatic(checkbox, pl.active ? "on" : "off");
                    }
                }
            });

            if (App.State.currentPlaylist) {
                items.forEach(li => {
                    if (li.dataset.playlistName === App.State.currentPlaylist) {
                        var checkbox = li.querySelector(".checkbox");
                        if (checkbox) App.Lottie.setActive(checkbox, true);
                    }
                });
            }
        });
    }

    function focusItem() {
        var items = document.querySelectorAll("#popup li");
        items.forEach(li => li.classList.remove("focused"));
        if (items[focusedIndex]) {
            items[focusedIndex].classList.add("focused");
            items[focusedIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }

    function goBack() {
        if (menuStack.length > 0) {
            renderMenu(menuStack.pop());
        } else {
            hideBoard();
        }
        var ul = document.querySelector("#popup ul");
        if (ul) ul.scrollTop = 0;
        App.State.isDeleteMode = false;
    }

    function moveFocus(step) {
        var lis = document.querySelectorAll("#popup li");
        if (!lis.length) return;
        focusedIndex = (focusedIndex + step + lis.length) % lis.length;
        focusItem();
    }

    function selectItem() {
        var item = currentData[focusedIndex];
        if (!item) return;

        var savedPlaylists = JSON.parse(localStorage.getItem('playlistsData') || "[]");
        var playlistNames = savedPlaylists.map(p => p && p.shortName).filter(Boolean);

        if (playlistNames.includes(item)) {
            var li = document.querySelectorAll("#popup li")[focusedIndex];
            var checkbox = li && li.querySelector(".checkbox");

            if (checkbox && checkbox.dataset.state === "on") {
                App.Log.print(`[FRONT] playlist is already active`);
                return;
            }

            if (checkbox) {
                App.Lottie.init().then(() => App.Lottie.setActive(checkbox));
            }

            var pl = savedPlaylists.find(p => p.shortName === item);
            if (pl) {
                App.DB.loadPlaylistById(pl.id, item);
                App.State.currentPlaylist = item;
            }
            return;
        }


        if (typeof item === "string") {
            if (item.endsWith(".m3u") || item.endsWith(".m3u8")) {
                if (App.State.isScanning) return;
                App.State.isScanning = true;
                App.State = { name: item };
                App.Lottie.showLoading();
                App.Message.sendMsg([{ key: "data", value: JSON.stringify({ cmd: "parseM3U", file: item }) }]);
                App.Menu.hideBoard();
            } else if (item === "Playlists") {
                App.DB.getSavedPlaylists().then(list => {
                    if (!list.length) {
                        App.Log.print("[FRONT] no saved playlists");
                        App.Log.printAlert("You have no saved playlists");
                        return;
                    }
                    var displayList = list.filter(p => p && p.shortName).map(p => p.shortName);
                    menuStack.push(currentData);
                    renderMenu(displayList);
                    App.State.isDeleteMode = true;
                });
            } else {
                switch (item) {
                    case "Exit app":
                        tizen.application.getCurrentApplication().exit()
                        break;
                    case "Load URL":
                        App.Log.print("[FRONT] load from url");
                        break;
                    case "Load Storage":
                        if (App.State.isScanning) return;
                        App.State.isScanning = true;
                        App.Lottie.showLoading();
                        App.Message.sendMsg([{ key: 'data', value: 'scanUSB' }]);
                        break;
                    default:
                        App.Log.print("[FRONT] no action assigned");
                }
            }
        } else if (typeof item === "object") {
            var key = Object.keys(item)[0];
            menuStack.push(currentData);
            renderMenu(item[key]);
        }
    }


    function showBoard() {
        var popup = document.getElementById("popup");
        if (!popup) return;
        popup.classList.remove("hidden");
        App.State.isMenuActive = true;
        renderMenu(menuDate);
    }

    function hideBoard() {
        var popup = document.getElementById("popup");
        if (!popup) return;
        popup.classList.add("hidden");
        App.State.isMenuActive = false;
    }

    function renderFiles(files) {
        if (menuStack[menuStack.length - 1] !== currentData) {
            menuStack.push(currentData);
        }
        renderMenu(files);
        App.State.isScanning = false;
        App.Lottie.hideLoading();
    }


    function deletePlaylist() {
        var item = currentData[focusedIndex];
        if (!item) return;

        var savedPlaylists = JSON.parse(localStorage.getItem('playlistsData') || "[]");
        var playlist = savedPlaylists.find(p => p && p.shortName === item);
        if (!playlist) return;

        if (confirm(`Delete ${playlist.shortName} playlist?`)) {
            App.DB.deletePlaylistById(playlist.id).then(() => {
                var newMeta = savedPlaylists.filter(p => p.id !== playlist.id);
                localStorage.setItem('playlistsData', JSON.stringify(newMeta));

                if (newMeta.length > 0) {
                    var first = newMeta[0];
                    App.DB.loadPlaylistById(first.id, first.shortName);
                    App.State.currentPlaylist = first.shortName;
                    renderMenu(newMeta.map(p => p.shortName));
                } else {
                    App.State.currentPlaylist = null;
                    goBack();
                    App.Player.stop && App.Player.stop();
                }
            });
        }
    }

    return {
        renderFiles,
        newBoard,
        showBoard,
        hideBoard,
        moveFocus,
        selectItem,
        goBack,
        deletePlaylist
    };
})();
