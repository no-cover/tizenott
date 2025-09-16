App = window.App || {};
App.Channel = (function Channel() {

    var hideTimeout = null;

    function newChannelInfo() {
        var channel = document.createElement("div");
        channel.id = "ch";
        channel.classList.add("hidden");
        document.body.appendChild(channel);
    }

    function showChannelInfo() {
        var channel = document.getElementById("ch");
        if (!channel) return;

        channel.classList.remove("hidden");

        if (hideTimeout) clearTimeout(hideTimeout);

        hideTimeout = setTimeout(() => {
            hideChannelInfo();
            hideTimeout = null;
        }, 10000);
    }

    function hideChannelInfo() {
        var channel = document.getElementById("ch");
        if (!channel) return;
        channel.classList.add("hidden");
    }

    function updChannelInfo({ logo, name, number }) {
        var channel = document.getElementById("ch");
        if (!channel) return;
        channel.innerHTML = `
            <img src="${logo}" alt="" onerror="this.style.display='none'" />
            <p class="small">${name}</p>
            <p>${number}</p>
        `;
    }

    function updChannelNum(number) {
        var channel = document.getElementById("ch");
        if (!channel) return;

        channel.innerHTML = `
            <p>${number}</p>
        `;
        showChannelInfo();
    }


    function showAndUpd(info) {
        updChannelInfo(info);
        showChannelInfo();
    }

    return {
        newChannelInfo,
        showChannelInfo,
        hideChannelInfo,
        updChannelInfo,
        showAndUpd,
        updChannelNum
    };
})();
