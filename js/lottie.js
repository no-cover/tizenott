App = window.App || {};
App.Lottie = (function Lottie() {

    var instances = new Map();

    function newLoading() {
        if (document.getElementById('loader')) return;
        var loader = document.createElement("div");
        loader.id = "loader";
        loader.classList.add("hidden");
        document.body.appendChild(loader);
        App.Scripts.lottie.loadAnimation({
            container: loader,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: './res/i_img_loading.json'
        });
    }

    function showLoading() {
        var loader = document.getElementById('loader'); 
        if (loader) loader.classList.remove("hidden");
    }

    function hideLoading() {
        var loader = document.getElementById('loader'); 
        if (loader) loader.classList.add("hidden"); 
    }

    function init() {
        var containers = Array.from(document.querySelectorAll(".checkbox"));
        var promises = containers.map(container => {
            if (container.dataset.lottieInit && instances.has(container)) return Promise.resolve();

            return new Promise(resolve => {
                var anim = App.Scripts.lottie.loadAnimation({
                    container,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    path: './res/i_img_checkbox.json'
                });

                anim.addEventListener("DOMLoaded", () => {
                    var total = anim.totalFrames || 40;
                    var half = Math.floor(total / 2);

                    container.dataset.totalFrames = total;
                    container.dataset.halfFrame = half;
                    container.dataset.state = "off";
                    container.dataset.lottieInit = "true";

                    anim.goToAndStop(0, true);

                    instances.set(container, anim);
                    resolve();
                });
            });
        });

        return Promise.all(promises);
    }

    function toggle(container) {
        var anim = instances.get(container);
        if (!anim) return;
        instances.forEach((otherAnim, otherContainer) => {
            if (otherContainer !== container) {
                otherAnim.playSegments([Math.floor((otherAnim.totalFrames||40)/2), (otherAnim.totalFrames||40)], true);
                otherContainer.dataset.state = "off";
            }
        });

        var total = parseInt(container.dataset.totalFrames) || (anim.totalFrames || 40);
        var half = parseInt(container.dataset.halfFrame) || Math.floor(total/2);
        if (container.dataset.state !== "on") {
            anim.playSegments([0, half], true);
            container.dataset.state = "on";
        } else {
            anim.playSegments([half, total], true);
            container.dataset.state = "off";
        }
    }

    function setActive(container, instant = false) {
        if (!container) return;
        var ensure = instances.has(container) ? Promise.resolve() : init();

        return ensure.then(() => {
            var anim = instances.get(container);
            if (!anim) return;

            var half = parseInt(container.dataset.halfFrame) || Math.floor((anim.totalFrames || 40)/2);

            instances.forEach((otherAnim, otherContainer) => {
                if (otherContainer !== container && otherContainer.dataset.state === "on") {
                    otherAnim.playSegments([half, 0], true);
                    otherContainer.dataset.state = "off";
                }
            });

            if (instant) {
                try { anim.goToAndStop(half, true); } catch (e) {}
                container.dataset.state = "on";
            } else {
                anim.playSegments([0, half], true);
                container.dataset.state = "on";
            }
        }).catch(err => App.Log.print(`[FRONT] lottie error ${err}`));
    }

    function setStatic(container, state = "off") {
        var anim = instances.get(container);
        if (!anim) return;

        var half = parseInt(container.dataset.halfFrame) || Math.floor((anim.totalFrames || 40)/2);

        if (state === "on") {
            try { anim.goToAndStop(half, true); } catch (e) {}
            container.dataset.state = "on";
        } else {
            try { anim.goToAndStop(0, true); } catch (e) {}
            container.dataset.state = "off";
        }
    }

    return {
        newLoading, 
        showLoading, 
        hideLoading, 
        init, 
        toggle, 
        setActive, 
        setStatic 
    };
})();
