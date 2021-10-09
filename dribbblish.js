// Hide popover message
// document.getElementById("popover-container").style.height = 0;
class ConfigMenu {
    /**
     * @typedef {Object} DribbblishConfigOptions
     * @property {"checkbox" | "select" | "button" | "slider" | "number" | "text"} type
     * @property {String?} area
     * @property {any?} data
     * @property {String?} key
     * @property {String?} name
     * @property {String?} description
     * @property {any?} defaultValue
     * @property {Boolean?} insertOnTop
     * @property {Function?} onAppended
     * @property {Function?} onChange
     */

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
                <div class="dribbblish-config-items"></div>
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

    /**
     * @private
     * @param {DribbblishConfigOptions} options
     */
    addInputHTML(options) {
        let parent;
        if (options.area != null) {
            if (!document.querySelector(`.dribbblish-config-area[name="${options.area}"]`)) {
                const areaElem = document.createElement("div");
                areaElem.classList.add("dribbblish-config-area");
                areaElem.setAttribute("name", options.area);
                areaElem.innerHTML = `<h2>${options.area}</h2>`;
                document.querySelector(".dribbblish-config-items").appendChild(areaElem);
            }
            parent = document.querySelector(`.dribbblish-config-area[name="${options.area}"]`);
        } else {
            parent = document.querySelector(".dribbblish-config-items");
        }

        const elem = document.createElement("div");
        elem.classList.add("dribbblish-config-item");
        elem.setAttribute("key", `dribbblish:config:${options.key}`);
        elem.setAttribute("type", options.type);
        elem.innerHTML = /* html */ `
            <h2 class="x-settings-title main-type-cello${!options.description ? " no-desc" : ""}" as="h2">${options.name}</h2>
            <label class="main-type-mesto" as="label" for="dribbblish-config-input-${options.key}" style="color: var(--spice-subtext);">${options.description}</label>
            <label class="x-toggle-wrapper x-settings-secondColumn">
                ${options.input}
            </label>
        `;

        if (options.insertOnTop && parent.children.length > 0) {
            parent.insertBefore(elem, parent.children[0]);
        } else {
            parent.appendChild(elem);
        }
    }

    /**
     * @param {DribbblishConfigOptions} options
     */
    register(options) {
        options = {
            ...{
                area: "Main Settings",
                data: {},
                key: cyrb53Hash(options.name ?? ""),
                name: "",
                description: "",
                insertOnTop: false,
                onAppended: () => {},
                onChange: () => {}
            },
            ...options
        };
        var fireChange = true;

        if (options.type == "checkbox") {
            const input = /* html */ `
                <input id="dribbblish-config-input-${options.key}" class="x-toggle-input" type="checkbox"${this.get(options.key, options.defaultValue) ? " checked" : ""}>
                <span class="x-toggle-indicatorWrapper">
                    <span class="x-toggle-indicator"></span>
                </span>
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("change", (e) => {
                this.set(options.key, e.target.checked);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "select") {
            const input = /* html */ `
                <select class="main-dropDown-dropDown" id="dribbblish-config-input-${options.key}">
                    ${options.data.map((option, i) => `<option value="${i}"${this.get(options.key, options.defaultValue) == i ? " selected" : ""}>${option}</option>`).join("")}
                </select>
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("change", (e) => {
                this.set(options.key, e.target.value);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "button") {
            const input = /* html */ `
                <button class="main-buttons-button main-button-primary" type="button" id="dribbblish-config-input-${options.key}">
                    <div class="x-settings-buttonContainer">
                        <span>${options.name}</span>
                    </div>
                </button>
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("click", (e) => {
                options.onChange(true);
            });
            fireChange = false;
        } else if (options.type == "number") {
            if (options.defaultValue == null) options.defaultValue = 0;

            const input = /* html */ `
                <input type="number" id="dribbblish-config-input-${options.key}" value="${this.get(options.key, options.defaultValue)}">
            `;
            this.addInputHTML({ ...options, input });

            // Prevent inputting +, - and e. Why is it even possible in the first place?
            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("keypress", (e) => {
                if (["+", "-", "e"].includes(e.key)) e.preventDefault();
            });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                if (options.data.min != null && e.target.value < options.data.min) e.target.value = options.data.min;
                if (options.data.max != null && e.target.value > options.data.max) e.target.value = options.data.max;

                this.set(options.key, e.target.value);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "text") {
            if (options.defaultValue == null) options.defaultValue = "";

            const input = /* html */ `
                <input type="text" id="dribbblish-config-input-${options.key}" value="${this.get(options.key, options.defaultValue)}">
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                // TODO: maybe add an validation function via `data.validate`
                this.set(options.key, e.target.value);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "slider") {
            if (options.defaultValue == null) options.defaultValue = 0;

            const input = /* html */ `
                <input
                    type="range"
                    id="dribbblish-config-input-${options.key}"
                    name="${options.name}"
                    min="${options.data?.min ?? "0"}"
                    max="${options.data?.max ?? "100"}"
                    step="${options.data?.step ?? "1"}"
                    value="${this.get(options.key, options.defaultValue)}"
                    tooltip="${this.get(options.key, options.defaultValue)}${options.data?.suffix ?? ""}"
                >
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                document.getElementById(`dribbblish-config-input-${options.key}`).setAttribute("tooltip", `${e.target.value}${options.data?.suffix ?? ""}`);
                document.getElementById(`dribbblish-config-input-${options.key}`).setAttribute("value", e.target.value);
                this.set(options.key, e.target.value);
                options.onChange(e.target.value);
            });
        } else {
            throw new Error(`Config Type "${options.type}" invalid`);
        }

        options.onAppended();
        if (fireChange) options.onChange(this.get(options.key, options.defaultValue));
    }

    get(key, defaultValue) {
        const val = localStorage.getItem(`dribbblish:config:${key}`);
        if (val == null) return defaultValue;

        if (val == "true" || val == "false") return val == "true"; // Boolean
        if (!isNaN(val) && /\d+\.\d+/.test(val) && !isNaN(parseFloat(val))) return parseFloat(val); // Float
        if (!isNaN(val) && /\d+/.test(val) && !isNaN(parseInt(val))) return parseInt(val); // Int
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
    description: "Have the expanded cover Image on the right instead of on the left",
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
    description: "If the Sidebar Icons should be round instead of square",
    defaultValue: false,
    onChange: (val) => {
        if (val) {
            document.documentElement.style.setProperty("--sidebar-icons-border-radius", "50%");
        } else {
            document.documentElement.style.setProperty("--sidebar-icons-border-radius", "var(--image-radius)");
        }
    }
});

DribbblishShared.config.register({
    area: "Ads",
    type: "checkbox",
    key: "hideAds",
    name: "Hide Ads",
    description: `Hide ads / premium features (see: <a href="https://github.com/Daksh777/SpotifyNoPremium">SpotifyNoPremium</a>)`,
    defaultValue: false,
    onAppended: () => {
        document.styleSheets[0].insertRule(/* css */ `
            /* Remove upgrade button*/
            body[hide-ads] .main-topBar-UpgradeButton {
                display: none
            }
        `);
        document.styleSheets[0].insertRule(/* css */ `
            /* Remove upgrade to premium button in user menu */
            body[hide-ads] .main-contextMenu-menuItemButton[href="https://www.spotify.com/premium/"] {
                display: none
            }
        `);
        document.styleSheets[0].insertRule(/* css */ `
            /* Remove ad placeholder in main screen */
            body[hide-ads] .main-leaderboardComponent-container {
                display: none
            }
        `);
    },
    onChange: (val) => {
        document.body.setAttribute("hide-ads", val ? "" : null);
    }
});

waitForElement(["#main"], () => {
    DribbblishShared.config.register({
        type: "select",
        data: ["None", "None (With Top Padding)", "Solid", "Transparent"],
        key: "winTopBar",
        name: "Windows Top Bar",
        description: "Have different top Bars (or none at all)",
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

waitForElement([`.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"]`, `.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"] li`], ([root, firstItem]) => {
    const listElem = firstItem.parentElement;
    root.classList.add("dribs-playlist-list");

    /** Replace Playlist name with their pictures */
    function loadPlaylistImage() {
        for (const item of listElem.children) {
            let link = item.querySelector("a");
            if (!link) continue;

            let [_, app, uid] = link.pathname.split("/");
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
                img.src = base64 || "/images/tracklist-row-song-fallback.svg";
                continue;
            }

            Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri.toURI()}/metadata`, { policy: { picture: true } }).then((res) => {
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

    new MutationObserver(loadPlaylistImage).observe(listElem, { childList: true });
});

waitForElement([".main-rootlist-rootlist", ".main-rootlist-wrapper > :nth-child(2) > :first-child", "#spicetify-show-list"], ([rootlist]) => {
    function checkSidebarPlaylistScroll() {
        const topDist = rootlist.getBoundingClientRect().top - document.querySelector("#spicetify-show-list:not(:empty), .main-rootlist-wrapper > :nth-child(2) > :first-child").getBoundingClientRect().top;
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
