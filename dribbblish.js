// Hide popover message
// document.getElementById("popover-container").style.height = 0;
class ConfigMenu {
    constructor() {
        this.config = {};
        this.configButton = new Spicetify.Menu.Item("Dribbblish config", false, () => DribbblishShared.config.open());
        this.configButton.register();

        const container = document.createElement("div");
        container.id = "dribbblish-config";
        container.innerHTML = /* html */ `
            <div class="dribbblish-config-container">
                <button aria-label="Close" class="dribbblish-config-close main-trackCreditsModal-closeBtn">
                    <svg width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M31.098 29.794L16.955 15.65 31.097 1.51 29.683.093 15.54 14.237 1.4.094-.016 1.508 14.126 15.65-.016 29.795l1.414 1.414L15.54 17.065l14.144 14.143" fill="currentColor" fill-rule="evenodd"></path></svg>
                </button>
                <h1>Dribbblish Settings</h1>
            </div>
            <div class="dribbblish-config-backdrop"></div>
        `;

        document.body.appendChild(container);
        document.querySelector(".dribbblish-config-close").addEventListener("click", () => DribbblishShared.config.close());
        document.querySelector(".dribbblish-config-backdrop").addEventListener("click", () => DribbblishShared.config.close());
    }

    open() {
        document.getElementById("dribbblish-config").setAttribute("active", "");
    }

    close() {
        document.getElementById("dribbblish-config").removeAttribute("active");
    }

    /** @private */
    addInputHTML({ type, key, name, description, input, insertOnTop }) {
        const elem = document.createElement("div");
        elem.classList.add("dribbblish-config-item");
        elem.setAttribute("key", `dribbblish:config:${key}`);
        elem.setAttribute("type", type);
        elem.innerHTML = /* html */ `
            <h2 class="x-settings-title main-type-cello" as="h2">${name}</h2>
            <label class="main-type-mesto" as="label" for="dribbblish-config-input-${key}" style="color: var(--spice-subtext);">${description}</label>
            <label class="x-toggle-wrapper x-settings-secondColumn">
                ${input}
            </label>
        `;
        if (insertOnTop && document.querySelector(".dribbblish-config-item")) {
            console.log("before");
            document.querySelector(".dribbblish-config-container").insertBefore(elem, document.querySelector(".dribbblish-config-item:first-of-type"));
        } else {
            document.querySelector(".dribbblish-config-container").appendChild(elem);
        }
    }

    register({ type, options, key, name, description, defaultValue, insertOnTop, onChange }) {
        if (!key) key = cyrb53Hash(name);
        var fireChange = true;

        if (type == "checkbox") {
            const input = /* html */ `
                <input id="dribbblish-config-input-${key}" class="x-toggle-input" type="checkbox"${this.get(key, defaultValue) ? " checked" : ""}>
                <span class="x-toggle-indicatorWrapper">
                    <span class="x-toggle-indicator"></span>
                </span>
            `;
            this.addInputHTML({ type, key, name, description, input, insertOnTop });

            document.getElementById(`dribbblish-config-input-${key}`).addEventListener("change", (e) => {
                this.set(key, e.target.checked);
                onChange(this.get(key));
            });
        } else if (type == "select") {
            const input = /* html */ `
                <span class="x-settings-secondColumn">
                    <select class="main-dropDown-dropDown" id="dribbblish-config-input-${key}">
                        ${options.map((option, i) => `<option value="${i}"${this.get(key, defaultValue) == i ? " selected" : ""}>${option}</option>`).join("")}
                    </select>
                </span>
            `;
            this.addInputHTML({ type, key, name, description, input, insertOnTop });

            document.getElementById(`dribbblish-config-input-${key}`).addEventListener("change", (e) => {
                this.set(key, e.target.value);
                onChange(this.get(key));
            });
        } else if (type == "button") {
            const input = /* html */ `
                <span class="x-settings-secondColumn">
                    <button class="main-buttons-button main-button-primary" type="button" id="dribbblish-config-input-${key}">
                        <div class="x-settings-buttonContainer">
                            <span>${name}</span>
                        </div>
                    </button>
                </span>
            `;
            this.addInputHTML({ type, key, name, description, input, insertOnTop });

            document.getElementById(`dribbblish-config-input-${key}`).addEventListener("click", (e) => {
                onChange(true);
            });
            fireChange = false;
        } else {
            throw new Error(`Config Type "${type}" invalid`);
        }

        if (fireChange) onChange(this.get(key, defaultValue));
    }

    get(key, defaultValue) {
        const val = localStorage.getItem(`dribbblish:config:${key}`);
        if (val == null) return defaultValue;

        if (val == "true" || val == "false") return val == "true"; // Boolean
        if (!isNaN(val) && !isNaN(parseInt(val))) return parseInt(val); // Number
        return val; // String
    }

    set(key, val) {
        localStorage.setItem(`dribbblish:config:${key}`, val);
    }
}

class _DribbblishShared {
    constructor() {
        this.config = new ConfigMenu();
    }
}
const DribbblishShared = new _DribbblishShared();

DribbblishShared.config.register({
    type: "checkbox",
    key: "rightBigCover",
    name: "Right expanded cover",
    description: "Have the expanded cover Image on the right instead of onn the left.",
    defaultValue: true,
    onChange: (val) => {
        if (val) {
            document.documentElement.classList.add("right-expanded-cover");
        } else {
            document.documentElement.classList.remove("right-expanded-cover");
        }
    }
});

DribbblishShared.config.register({
    type: "checkbox",
    key: "roundSidebarIcons",
    name: "Round Sidebar Icons",
    description: "If the Sidebar Iconns should be round instead of square",
    defaultValue: false,
    onChange: (val) => {
        if (val) {
            document.documentElement.style.setProperty("--sidebar-icons-border-radius", "50%");
        } else {
            document.documentElement.style.setProperty("--sidebar-icons-border-radius", "var(--image-radius)");
        }
    }
});

waitForElement(["#main"], () => {
    DribbblishShared.config.register({
        type: "select",
        options: ["None", "None (With Top Padding)", "Solid", "Transparent"],
        key: "winTopBar",
        name: "Windows Top Bar",
        description: "Have differennt top Bars (Ore none at all)",
        defaultValue: 0,
        onChange: (val) => {
            switch (val) {
                case 0:
                    document.getElementById("main").setAttribute("top-bar", "none");
                    break;
                case 1:
                    document.getElementById("main").setAttribute("top-bar", "none-padding");
                    break;
                case 2:
                    document.getElementById("main").setAttribute("top-bar", "solid");
                    break;
                case 3:
                    document.getElementById("main").setAttribute("top-bar", "transparent");
                    break;
            }
        }
    });
});

function waitForElement(els, func, timeout = 100) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

function cyrb53Hash(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

waitForElement([
    `.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"]`,
    `.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"] li`
], ([root, firstItem]) => {
    const listElem = firstItem.parentElement;
    root.classList.add("dribs-playlist-list");

    /** Replace Playlist name with their pictures */
    function loadPlaylistImage() {
        for (const item of listElem.children) {
            let link = item.querySelector("a");
            if (!link) continue;

            let [_, app, uid ] = link.pathname.split("/");
            let uri;
            if (app === "playlist") {
                uri = Spicetify.URI.playlistV2URI(uid);
            } else if (app === "folder") {
                const base64 = localStorage.getItem("dribbblish:folder-image:" + uid);
                let img = link.querySelector("img");
                if (!img) {
                    img = document.createElement("img");
                    img.classList.add("playlist-picture");
                    link.prepend(img);
                }
                img.src = base64  || "/images/tracklist-row-song-fallback.svg";
                continue;
            }

            Spicetify.CosmosAsync.get(
                `sp://core-playlist/v1/playlist/${uri.toURI()}/metadata`,
                { policy: { picture: true } }
            ).then(res => {
                const meta = res.metadata;
                let img = link.querySelector("img");
                if (!img) {
                    img = document.createElement("img");
                    img.classList.add("playlist-picture");
                    link.prepend(img);
                }
                img.src = meta.picture || "/images/tracklist-row-song-fallback.svg";
            });
        }
    }

    DribbblishShared.loadPlaylistImage = loadPlaylistImage;
    loadPlaylistImage();

    new MutationObserver(loadPlaylistImage)
        .observe(listElem, {childList: true});
});

waitForElement([".main-rootlist-rootlist", ".main-rootlist-wrapper > :nth-child(2) > :first-child"], ([rootlist]) => {
    function checkSidebarPlaylistScroll() {
        const topDist = rootlist.getBoundingClientRect().top - document.querySelector(".main-rootlist-wrapper > :nth-child(2) > :first-child").getBoundingClientRect().top;
        const bottomDist = document.querySelector(".main-rootlist-wrapper > :nth-child(2) > :last-child").getBoundingClientRect().bottom - rootlist.getBoundingClientRect().bottom;

        rootlist.classList.remove("no-top-shadow", "no-bottom-shadow");
        if (topDist < 10) rootlist.classList.add("no-top-shadow");
        if (bottomDist < 10) rootlist.classList.add("no-bottom-shadow");
    }
    checkSidebarPlaylistScroll();

    // Use Interval because scrolling takes a while and getBoundingClientRect() gets position at the moment of calling, so the interval keeps calling for 1s
    let c = 0;
    let interval;
    rootlist.addEventListener("wheel", () => {
        checkSidebarPlaylistScroll();
        c = 0;
        if (interval == null)
            interval = setInterval(() => {
                if (c > 20) {
                    clearInterval(interval);
                    interval = null;
                    return;
                }

                checkSidebarPlaylistScroll();
                c++;
            }, 50);
    });
});

waitForElement([".Root__main-view"], ([mainView]) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    mainView.prepend(shadow);
});

waitForElement([
    ".Root__nav-bar .LayoutResizer__input, .Root__nav-bar .LayoutResizer__resize-bar input"
], ([resizer]) => {
    const observer = new MutationObserver(updateVariable);
    observer.observe(resizer, { attributes: true, attributeFilter: ["value"]});
    function updateVariable() {
        let value = resizer.value;
        if (value < 121) {
            value = 72;
            document.documentElement.classList.add("sidebar-hide-text");
        } else {
            document.documentElement.classList.remove("sidebar-hide-text");
        }
        document.documentElement.style.setProperty(
            "--sidebar-width", value + "px");
    }
    updateVariable();
});

waitForElement([".Root__main-view .os-resize-observer-host"], ([resizeHost]) => {
    const observer = new ResizeObserver(updateVariable);
    observer.observe(resizeHost);
    function updateVariable([ event ]) {
        document.documentElement.style.setProperty(
            "--main-view-width", event.contentRect.width + "px");
        document.documentElement.style.setProperty(
            "--main-view-height", event.contentRect.height + "px");
        if (event.contentRect.width < 700) {
            document.documentElement.classList.add("minimal-player");
        } else {
            document.documentElement.classList.remove("minimal-player");
        }
        if (event.contentRect.width < 550) {
            document.documentElement.classList.add("extra-minimal-player");
        } else {
            document.documentElement.classList.remove("extra-minimal-player");
        }
    }
});

(function Dribbblish() {
    const progBar = document.querySelector(".playback-bar");
    const root = document.querySelector(".Root");

    if (!Spicetify.Player.origin || !progBar || !root) {
        setTimeout(Dribbblish, 300);
        return;
    }

    const progKnob = progBar.querySelector(".progress-bar__slider");

    const tooltip = document.createElement("div");
    tooltip.className = "prog-tooltip";
    progKnob.append(tooltip);

    function updateProgTime(timeOverride) {
        const newText = Spicetify.Player.formatTime(timeOverride || Spicetify.Player.getProgress()) + " / " + Spicetify.Player.formatTime(Spicetify.Player.getDuration());
        // To reduce DOM Updates when the Song is Paused
        if (tooltip.innerText != newText) tooltip.innerText = newText;
    }
    const knobPosObserver = new MutationObserver((muts) => {
        const progressPercentage = Number(getComputedStyle(document.querySelector(".progress-bar")).getPropertyValue("--progress-bar-transform").replace("%", "")) / 100;
        updateProgTime(Spicetify.Player.getDuration() * progressPercentage);
    });
    knobPosObserver.observe(document.querySelector(".progress-bar"), {
        attributes: true,
        attributeFilter: ["style"]
    });
    Spicetify.Player.addEventListener("songchange", () => updateProgTime());
    updateProgTime();

    Spicetify.CosmosAsync.sub("sp://connect/v1", (state) => {
        const isExternal = state.devices.some(a => a.is_active);
        if (isExternal) {
            root.classList.add("is-connectBarVisible");
        } else {
            root.classList.remove("is-connectBarVisible");
        }
    });

    const filePickerForm = document.createElement("form");
    filePickerForm.setAttribute("aria-hidden", true);
    filePickerForm.innerHTML = '<input type="file" class="hidden-visually" />';
    document.body.appendChild(filePickerForm);
    /** @type {HTMLInputElement} */
    const filePickerInput = filePickerForm.childNodes[0];
    filePickerInput.accept = [
        "image/jpeg",
        "image/apng",
        "image/avif",
        "image/gif",
        "image/png",
        "image/svg+xml",
        "image/webp"
    ].join(",");

    filePickerInput.onchange = () => {
        if (!filePickerInput.files.length) return;

        const file = filePickerInput.files[0];
        const reader = new FileReader;
        reader.onload = (event) => {
            const result = event.target.result;
            const id = Spicetify.URI.from(filePickerInput.uri).id;
            try {
                localStorage.setItem(
                    "dribbblish:folder-image:" + id,
                    result
                );
            } catch {
                Spicetify.showNotification("File too large");
            }
            DribbblishShared.loadPlaylistImage?.call();
        }
        reader.readAsDataURL(file);
    }

    new Spicetify.ContextMenu.Item("Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            DribbblishShared.loadPlaylistImage?.call();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "x",
    ).register();
    new Spicetify.ContextMenu.Item("Choose folder image",
        ([uri]) => {
            filePickerInput.uri = uri;
            filePickerForm.reset();
            filePickerInput.click();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "edit",
    ).register();
})();
