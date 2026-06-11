(function SakuraTheme() {
    function init() {
        console.log("🌸 Sakura Theme Loaded");

        if (document.getElementById("sakura-container")) {
            return;
        }

        const style = document.createElement("style");

        style.textContent = `
#sakura-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 9999;
}

.sakura-petal {
    position: absolute;
    top: -50px;
    background: rgba(255, 183, 197, 0.9);
    border-radius: 70% 0 70% 0;
    transform-origin: center center;
    animation: sakuraFall linear forwards;
    filter: blur(0.4px) drop-shadow(0 0 8px rgba(255,183,197,.35));
}

@keyframes sakuraFall {
    0% {
        transform: translateX(0px) rotate(0deg);
        opacity: 0;
    }

    10% {
        opacity: 1;
    }

    50% {
        transform: translateX(80px) rotate(180deg);
    }

    100% {
        transform: translateX(-120px) translateY(110vh) rotate(360deg);
        opacity: 0;
    }
}
`;

        document.head.appendChild(style);

        const container = document.createElement("div");
        container.id = "sakura-container";
        document.body.appendChild(container);

        function createPetal() {
            const petal = document.createElement("div");
            petal.className = "sakura-petal";

            const size = Math.random() * 14 + 8;

            petal.style.width = size + "px";
            petal.style.height = size + "px";
            const opacity = Math.random() * 0.4 + 0.5;
            petal.style.opacity = opacity;

            petal.style.left = Math.random() * window.innerWidth + "px";

            const duration = Math.random() * 6 + 8;
            petal.style.animationDuration = duration + "s";

            petal.style.transform =
                "rotate(" + Math.random() * 360 + "deg)";

            container.appendChild(petal);

            petal.addEventListener("animationend", function () {
                petal.remove();
            });
        }

        setInterval(createPetal, 300);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
