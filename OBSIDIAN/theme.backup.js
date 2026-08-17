(() => {
    console.log("theme.js: loaded");

    function startSplash() {
        if (!document.body) {
            requestAnimationFrame(startSplash);
            return;
        }

        if (document.getElementById("obsidian-splash")) return;

        console.log("theme.js: starting splash");

        const splash = document.createElement("div");
        splash.id = "obsidian-splash";
        Object.assign(splash.style, {
            position: "fixed",
            inset: "0",
            zIndex: "999999",
            backgroundColor: "#181924",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: "1",
            transition: "opacity 300ms ease"
        });

        const img = document.createElement("img");
        Object.assign(img.style, {
            width: "40%",
            imageRendering: "pixelated"
        });

        img.addEventListener("error", () => {
            console.error("Splash image failed to load:", img.src);
        });

        splash.appendChild(img);
        document.body.appendChild(splash);

        // If Spicetify exposes theme.js as a normal script URL, this resolves
        // assets relative to theme.js instead of relative to Spotify's page.
        const scriptUrl = document.currentScript?.src;
        const assetUrl = (name) => {
            if (scriptUrl) {
                return new URL(`./assets/spotify-splash/${name}.png`, scriptUrl).href;
            }

            // Change this fallback if the console shows the wrong URL.
            return `assets/spotify-splash/${name}.png`;
        };

        const frames = [
            8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
            1, 2, 3, 4, 5, 6, 7
        ];

        const step = 50;
        let time = 0;

        function showFrame(number, delay) {
            setTimeout(() => {
                const src = assetUrl(number);
                console.log("loading frame:", src);
                img.src = src;
            }, delay);
        }

        // Frames 8–18.
        for (const number of frames.slice(0, 11)) {
            showFrame(number, time);
            time += step;
        }

        // Hold frame 18.
        time += 1500;

        // Frames 1–7.
        for (const number of frames.slice(11)) {
            showFrame(number, time);
            time += step;
        }

        // Hold the final frame, then fade out.
        time += 1500;
        setTimeout(() => {
            splash.style.opacity = "0";
            setTimeout(() => splash.remove(), 300);
        }, time);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startSplash, { once: true });
    } else {
        startSplash();
    }
})();
