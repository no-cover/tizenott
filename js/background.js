App = window.App || {};
App.Background = (function Background() {

    var canvas, ctx, img;
    var stars = [];
    var width, height;
    var loopId;
    var isRunning = false;
    var spawnTimer;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;
    }

    function spawnStar() {
        var size = 20 + Math.random() * 100;
        var speed = 0.3 + (size / 40);

        stars.push({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            speed: speed,
            size: size,
            life: 0
        });
    }

    function update() {
        for (var i = stars.length - 1; i >= 0; i--) {
            var s = stars[i];
            s.x += s.vx * s.speed * (1 + s.life * 0.03);
            s.y += s.vy * s.speed * (1 + s.life * 0.03);
            s.life++;

            if (s.x < -200 || s.x > width + 200 || s.y < -200 || s.y > height + 200) {
                stars.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            ctx.globalAlpha = Math.max(1 - s.life / 300, 0.05);
            ctx.drawImage(img, s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }

    function loop() {
        if (!isRunning) return;
        update();
        draw();
        loopId = requestAnimationFrame(loop);
    }

    function init() {
        canvas = document.getElementById("bg");
        ctx = canvas.getContext("2d");
        img = new Image();
        img.src = "../res/particle.webp";

        resize();
        window.addEventListener("resize", resize);
    }

    function show() {
        if (!canvas) init();
        if (canvas) canvas.classList.remove("hidden");
        if (!isRunning) {
            isRunning = true;
            spawnTimer = setInterval(() => {
                var count = 3 + Math.floor(Math.random() * 4);
                for (var i = 0; i < count; i++) spawnStar();
            }, 800);
            loop();
        }
    }

    function hide() {
        if (canvas) canvas.classList.add("hidden");
        if (isRunning) {
            isRunning = false;
            cancelAnimationFrame(loopId);
            clearInterval(spawnTimer);
        }
    }

    function destroy() {
        hide();
        stars = [];
        if (ctx) ctx.clearRect(0, 0, width, height);
    }

    return {
        init,
        destroy,
        show,
        hide
    };

}());
