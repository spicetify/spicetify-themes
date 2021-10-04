// Hide popover message
// document.getElementById("popover-container").style.height = 0;
const DribbblishShared = {
    configMenu: new Spicetify.Menu.SubMenu("Dribbblish", []),
    config: {
        register: (name, key, defaultValue, update) => {
            const menuItem = new Spicetify.Menu.Item(name, defaultValue, (self) => {
                self.setState(!self.isEnabled);
                DribbblishShared.config.toggle(key);
            });
            DribbblishShared.configMenu.addItem(menuItem);

            if (localStorage.getItem(`dribbblish:config:${key}`) == null) localStorage.setItem(`dribbblish:config:${key}`, defaultValue);

            DribbblishShared.configData[key] = {
                menuItem,
                update
            };

            DribbblishShared.config.update(key);
        },
        registerSelect: (name, key, choices, defaultChoice, update) => {
            const menuItem = new Spicetify.Menu.SubMenu(name, []);
            const menuItems = choices.map((choice, i) => {
                const subItem = new Spicetify.Menu.Item(choice, i == defaultChoice, (self) => {
                    self.setState(!self.isEnabled);
                    DribbblishShared.config.set(key, i);
                });
                menuItem.addItem(subItem);
                return subItem;
            });
            DribbblishShared.configMenu.addItem(menuItem);
            menuItem.register();

            if (localStorage.getItem(`dribbblish:config:${key}`) == null) localStorage.setItem(`dribbblish:config:${key}`, defaultChoice);

            DribbblishShared.configData[key] = {
                subItems: menuItems,
                menuItem,
                update
            };

            DribbblishShared.config.update(key);
        },
        get: (key) => {
            const val = localStorage.getItem(`dribbblish:config:${key}`);
            if (val == "true" || val == "false") return val == "true";
            if (!isNaN(val) && !isNaN(parseInt(val))) return parseInt(val);
        },
        set: (key, val) => {
            if (DribbblishShared.configData[key].hasOwnProperty("subItems")) {
                DribbblishShared.configData[key].subItems.forEach((item, i) => {
                    item.setState(val == i);
                });
            } else {
                DribbblishShared.configData[key].menuItem.setState(val);
            }
            localStorage.setItem(`dribbblish:config:${key}`, val);
            DribbblishShared.config.update(key);
        },
        toggle: (key) => {
            DribbblishShared.config.set(key, !DribbblishShared.config.get(key));

            if (DribbblishShared.configData[key].hasOwnProperty("subItems")) {
                // Can't toggle lists
            } else {
                DribbblishShared.configData[key].menuItem.setState(DribbblishShared.config.get(key));
            }
        },
        update: (key) => {
            const val = DribbblishShared.config.get(key);
            if (DribbblishShared.configData[key].hasOwnProperty("subItems")) {
                DribbblishShared.configData[key].subItems.forEach((item, i) => {
                    item.setState(val == i);
                });
            } else {
                DribbblishShared.configData[key].menuItem.setState(val);
            }
            DribbblishShared.configData[key].update(val);
        }
    },
    configData: {}
};
DribbblishShared.configMenu.register();

// Initialize Config
DribbblishShared.config.register("Right expanded cover", "rightBigCover", true, (value) => {
    if (value) {
        document.documentElement.classList.add("right-expanded-cover");
    } else {
        document.documentElement.classList.remove("right-expanded-cover");
    }
});

DribbblishShared.config.register("OS Icon Dodge", "osIconDodge", false, (value) => {
    if (value) {
        document.documentElement.style.setProperty("--os-windows-icon-dodge", 1);
    } else {
        document.documentElement.style.setProperty("--os-windows-icon-dodge", 0);
    }
});

function waitForElement(els, func, timeout = 100) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
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

waitForElement([".Root__main-view"], ([mainView]) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    mainView.prepend(shadow);
});

waitForElement([".main-rootlist-rootlistPlaylistsScrollNode"], (queries) => {
    const fade = document.createElement("div");
    fade.id = "dribbblish-sidebar-fade-in";
    queries[0].append(fade);
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
