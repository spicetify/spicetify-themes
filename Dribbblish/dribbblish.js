// Hide popover message
// document.getElementById("popover-container").style.height = 0;
const DribbblishShared = {
    configMenu: new Spicetify.Menu.SubMenu("Dribbblish", []),
    rightBigCover: localStorage.getItem("dribs-right-big-cover") === "true",
    setRightBigCover: () => {
        if (DribbblishShared.rightBigCover) {
            document.documentElement.classList.add("right-expanded-cover");
        } else {
            document.documentElement.classList.remove("right-expanded-cover");
        }
    }
};

DribbblishShared.configMenu.register();
DribbblishShared.configMenu.subItems.push(new Spicetify.Menu.Item(
    "Right expanded cover",
    DribbblishShared.rightBigCover,
    (self) => {
        self.isEnabled = !self.isEnabled;
        DribbblishShared.rightBigCover = self.isEnabled;
        localStorage.setItem("dribs-right-big-cover", self.isEnabled);
        DribbblishShared.setRightBigCover();
    }
));
DribbblishShared.setRightBigCover();

function waitForElement(els, func, timeout = 100) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

waitForElement([".main-rootlist-rootlistPlaylistsScrollNode ul"], ([query]) => {
    /** Replace Playlist name with their pictures */
    function loadPlaylistImage() {
        const sidebarItem = query.querySelectorAll("li.GlueDropTarget");
        for (let i = 0; i < sidebarItem.length; i++) {
            const item = sidebarItem[i];
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
                if (base64) {
                    img.src = base64;
                } else {
                    img.src = "";
                }
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
                img.src = meta.picture;
            });
        }
    }

    DribbblishShared.loadPlaylistImage = loadPlaylistImage;
    loadPlaylistImage();

    new MutationObserver(loadPlaylistImage)
        .observe(query, {childList: true});
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
    ".main-navBar-entryPoints",
    ".main-rootlist-rootlistPlaylistsScrollNode .os-content",
    ".main-rootlist-rootlistContent"
], ([appItems, playlistItems, personalLibrary]) => {
    const HIDDEN = 0, SHOW = 1, STICKY = 2;

    let buttons = [];
    let storage = [];
    let ordered;
    const list = document.createElement("ul");
    const hiddenList = document.createElement("ul");
    hiddenList.id = "dribs-hidden-list";
    hiddenList.classList.add("hidden-visually");
    const playlistList = playlistItems.querySelector("ul");
    playlistList.id = "dribs-playlist-list";
    playlistItems.prepend(list, hiddenList);

    const up = document.createElement("button"); up.innerText = "Up";
    const down = document.createElement("button"); down.innerText = "Down";
    const hide = document.createElement("button");
    const stick = document.createElement("button");
    const container = document.createElement("div");
    container.id = "dribs-sidebar-config";
    container.append(up, down, hide, stick);

    for (const ele of appItems.children) {
        ele.dataset.id = ele.querySelector("a").pathname;
        buttons.push(ele);
    }

    for (const ele of personalLibrary.querySelectorAll("div.GlueDropTarget")) {
        const link = ele.querySelector("a");
        if (!link) {
            ele.dataset.id = "/add";
        } else {
            ele.dataset.id = link.pathname;
        }
        ele.classList.add("personal-library");
        buttons.push(ele);
    }

    try {
        storage = JSON.parse(localStorage.getItem("dribs-sidebar-config"))
        if (!Array.isArray(storage)) throw "";
    } catch {
        storage = buttons.map(el => [el.dataset.id, SHOW]);
    }

    function arrangeItems() {
        const newButtons = [...buttons];
        const orderedButtons = [];
        for (const ele of storage) {
            const index = newButtons.findIndex(a => ele[0] === a?.dataset.id);
            if (index !== -1) {
                orderedButtons.push([newButtons[index], ele[1]]);
                newButtons[index] = undefined;
            }
        }
        newButtons
            .filter(a => a)
            .forEach(a => orderedButtons.push([a, STICKY]));
        ordered = orderedButtons;
    }

    function appendItems() {
        const toShow = [], toHide = [], toStick = [];
        for (const el of ordered) {
            const [ item, status ] = el;
            if (status === STICKY) {
                appItems.append(item);
                toStick.push(el);
            } else if (status === SHOW) {
                list.append(item);
                toShow.push(el);
            } else {
                hiddenList.append(item);
                toHide.push(el);
            }
        }
        ordered = [ ...toStick, ...toShow, ...toHide ];
    }

    function writeStorage() {
        const array = ordered.map(a => [a[0].dataset.id, a[1]]);
        console.log(array);
        localStorage.setItem("dribs-sidebar-config", JSON.stringify(array));
    }

    arrangeItems();
    appendItems();

    const observer = new MutationObserver(() => {
        const residues = personalLibrary.querySelectorAll(".main-rootlist-rootlistContent > div.GlueDropTarget");
        for (const ele of residues) {
            ele.dataset.id = ele.querySelector("a").pathname;
            ele.classList.add("personal-library");
            buttons.push(ele);
        }
        arrangeItems();
        appendItems();
    });
    observer.observe(personalLibrary, { childList: true });
    setTimeout(() => observer.disconnect(), 10000);

    function onSwap(item, dir) {
        container.remove();
        const curPos = ordered.findIndex(e => e[0] === item);
        const newPos = curPos + dir;
        if (newPos < 0 || newPos > (ordered.length - 1)) return;
        if (ordered[curPos][1] !== ordered[newPos][1]) return;
        [ordered[curPos], ordered[newPos]] = [ordered[newPos], ordered[curPos]];
        appendItems();
    }

    function onChangeStatus(item, status) {
        container.remove();
        const curPos = ordered.findIndex(e => e[0] === item);
        ordered[curPos][1] = ordered[curPos][1] === status ? SHOW : status;
        appendItems();
    }

    function injectInteraction() {
        document.documentElement.style.setProperty("--sidebar-width", "280px");
        document.documentElement.classList.remove("sidebar-hide-text");
        hiddenList.classList.remove("hidden-visually");
        for (const el of ordered) {
            el[0].onmouseover = () => {
                const [ item, status ] = el;
                const index = ordered.findIndex(a => a === el);
                if (index === 0 || ordered[index][1] !== ordered[index - 1][1]) {
                    up.disabled = true;
                } else {
                    up.disabled = false;
                    up.onclick = () => onSwap(item, -1);
                }
                if (index === (ordered.length - 1) || ordered[index][1] !== ordered[index + 1][1]) {
                    down.disabled = true;
                } else {
                    down.disabled = false;
                    down.onclick = () => onSwap(item, 1);
                }

                stick.innerText = status === STICKY ? "Unstick" : "Stick";
                hide.innerText = status === HIDDEN ? "Unhide" : "Hide";
                hide.onclick = () => onChangeStatus(item, HIDDEN);
                stick.onclick = () => onChangeStatus(item, STICKY);

                item.append(container);
            };
        }
    }

    function removeInteraction() {
        hiddenList.classList.add("hidden-visually");
        container.remove();
        ordered.forEach(a => a[0].onmouseover = undefined);
        writeStorage();
    }

    DribbblishShared.configMenu.subItems.push(new Spicetify.Menu.Item(
        "Sidebar config",
        false,
        (self) => {
            self.isEnabled = !self.isEnabled;
            if (self.isEnabled) {
                injectInteraction();
            } else {
                removeInteraction();
            }
        }
    ));
});

waitForElement([".Root__nav-bar .LayoutResizer__input"], ([resizer]) => {
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

    if (!Spicetify.Player.origin || !progBar) {
        setTimeout(Dribbblish, 300);
        return;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "prog-tooltip";
    progBar.append(tooltip);

    const progKnob = progBar.querySelector(".progress-bar__slider");
    
    Spicetify.Player.addEventListener("onprogress", ({ data: e }) => {
        const offsetX = progKnob.offsetLeft + progKnob.offsetWidth / 2;
        const maxWidth = progBar.offsetWidth;
        const curWidth = Spicetify.Player.getProgressPercent() * maxWidth;
        const ttWidth = tooltip.offsetWidth / 2;
        if (curWidth < ttWidth) {
            tooltip.style.left = String(offsetX) + "px";
        } else if (curWidth > maxWidth - ttWidth) {
            tooltip.style.left = String(offsetX - ttWidth * 2) + "px";
        } else {
            tooltip.style.left = String(offsetX - ttWidth) + "px";
        }
        tooltip.innerText = Spicetify.Player.formatTime(e) + " / " +
            Spicetify.Player.formatTime(Spicetify.Player.getDuration());
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
