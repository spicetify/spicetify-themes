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

// register drib menu item
DribbblishShared.configMenu.register();
DribbblishShared.configMenu.addItem(new Spicetify.Menu.Item(
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

waitForElement([
    `ul[tabindex="0"]`, 
    `ul[tabindex="0"] .GlueDropTarget--playlists.GlueDropTarget--folders`
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
                uri = `spotify:playlist:${uid}`;
            } else if (app === "folder") {
                const base64 = localStorage.getItem("dribbblish:folder-image:" + uid);
                let img = link.querySelector("img");
                if (!img) {
                    img = document.createElement("img");
                    img.classList.add("playlist-picture");
                    link.prepend(img);
                }
                img.src = base64  || "https://cdn.jsdelivr.net/gh/spicetify/spicetify-themes@master/Dribbblish/images/tracklist-row-song-fallback.svg";
                continue;
            }

            Spicetify.CosmosAsync.get(
                `sp://core-playlist/v1/playlist/${uri}/metadata`, 
            { policy: { picture: true } }
            ).then(res => {
                const meta = res.metadata;
                let img = link.querySelector("img");
                if (!img) {
                    img = document.createElement("img");
                    img.classList.add("playlist-picture");
                    link.prepend(img);
                }
                img.src = meta.picture || "https://cdn.jsdelivr.net/gh/spicetify/spicetify-themes@master/Dribbblish/images/tracklist-row-song-fallback.svg";
            });
        }
    }

    DribbblishShared.loadPlaylistImage = loadPlaylistImage;
    loadPlaylistImage();

    new MutationObserver(loadPlaylistImage)
        .observe(listElem, {childList: true});
});

waitForElement([".Root__top-container"], ([topContainer]) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    topContainer.prepend(shadow);
});

// allow resizing of the navbar
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

// allow resizing of the buddy feed
waitForElement([".Root__right-sidebar .LayoutResizer__input, .Root__right-sidebar .LayoutResizer__resize-bar input"], ([resizer]) => {
    const observer = new MutationObserver(updateVariable);
    observer.observe(resizer, { attributes: true, attributeFilter: ["value"] });
    function updateVariable() {
        let value = resizer.value;
        if (value == 280) {
            value = 72;
            document.documentElement.classList.add("buddyFeed-hide-text");
        } else {
            document.documentElement.classList.remove("buddyFeed-hide-text");
        }
    }
    updateVariable();
});

// add fade effect on playlist/folder list
waitForElement([".main-navBar-navBar .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
    scrollNode.setAttribute("fade", "bottom");
    scrollNode.addEventListener("scroll", () => {
        if (scrollNode.scrollTop == 0) {
            scrollNode.setAttribute("fade", "bottom");
        } else if (scrollNode.scrollHeight - scrollNode.clientHeight - scrollNode.scrollTop == 0) {
            scrollNode.setAttribute("fade", "top");
        } else {
            scrollNode.setAttribute("fade", "full");
        }
    });
});

// improve styles at smaller sizes
waitForElement([".Root__main-view .os-resize-observer-host"], ([resizeHost]) => {
    const observer = new ResizeObserver(updateVariable);
    observer.observe(resizeHost);
    function updateVariable([ event ]) {
        document.documentElement.style.setProperty(
            "--main-view-width", event.contentRect.width + "px");
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
    // dynamic playback time tooltip
    const progBar = document.querySelector(".playback-bar");
    const root = document.querySelector(".Root");

    if (!Spicetify.Player.origin || !progBar || !root) {
        setTimeout(Dribbblish, 300);
        return;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "prog-tooltip";
    progBar.append(tooltip);

    const progKnob = progBar.querySelector(".progress-bar__slider");

    function updateProgTime({ data: e }) {
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
    }
    Spicetify.Player.addEventListener("onprogress", updateProgTime);
    updateProgTime({ data: Spicetify.Player.getProgress() });

    Spicetify.CosmosAsync.sub("sp://connect/v1", (state) => {
        const isExternal = state.devices.some(a => a.is_active);
        if (isExternal) {
            root.classList.add("is-connectBarVisible");
        } else {
            root.classList.remove("is-connectBarVisible");
        }
    });

    // filepicker for custom folder images
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

    // context menu items for custom folder images
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
