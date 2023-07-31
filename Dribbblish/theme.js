function waitForElement(els, func, timeout = 100) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

let DribbblishShared = {};

// back shadow
waitForElement([".Root__top-container"], ([topContainer]) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    topContainer.prepend(shadow);
});

// Spicetify.Platform.ConnectAPI.state.connectionStatus;

// add fade effect on playlist/folder list
waitForElement([".main-navBar-mainNav .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
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

let version;

(function Dribbblish() {
    // dynamic playback time tooltip
    const progBar = document.querySelector(".playback-bar");
    const root = document.querySelector(".Root");

    if (!Spicetify.Player.origin || !progBar || !root) {
        setTimeout(Dribbblish, 300);
        return;
    }

    version = Spicetify.Platform.PlatformData.event_sender_context_information.client_version_int;

    if (version < 121200000) {
        document.documentElement.classList.add("legacy");
        legacy();
    } else if (version >= 121200000 && version < 121400000) {
        document.documentElement.classList.add("legacy-gridChange");
        legacy();
    } else if (version >= 121400000) {
        document.documentElement.classList.add("ylx");
    }

    const tooltip = document.createElement("div");
    tooltip.className = "prog-tooltip";
    progBar.append(tooltip);

    function updateProgTime({ data: e }) {
        const maxWidth = progBar.offsetWidth;
        const curWidth = Spicetify.Player.getProgressPercent() * maxWidth;
        const ttWidth = tooltip.offsetWidth / 2;
        if (curWidth < ttWidth + 12) {
            tooltip.style.left = "12px";
        } else if (curWidth > maxWidth - ttWidth - 12) {
            tooltip.style.left = String(maxWidth - ttWidth * 2 - 12) + "px";
        } else {
            tooltip.style.left = String(curWidth - ttWidth) + "px";
        }
        tooltip.innerText = Spicetify.Player.formatTime(e) + " / " + Spicetify.Player.formatTime(Spicetify.Player.getDuration());
    }
    Spicetify.Player.addEventListener("onprogress", updateProgTime);
    updateProgTime({ data: Spicetify.Player.getProgress() });

    waitForElement(
        [`.main-yourLibraryX-libraryRootlist`, `.main-rootlist-wrapper > div:nth-child(2)`, "li.main-yourLibraryX-listItem"],
        ([rootlist, listElement]) => {
            listElement.classList.add("dribs-playlist-list");

            const loadFolderImages = items => {
                if (!items) items = listElement.children;
                for (const item of items) {
                    let id = item.querySelector("div > div:nth-child(2)").id;
                    if (!id.includes("folder")) continue;

                    id = id.split(":")[4];
                    console.log(id);

                    const base64 = localStorage.getItem("dribbblish:folder-image:" + id);

                    const img_container = item.querySelector(".HeaderSideArea .x-entityImage-imageContainer");

                    if (!base64) {
                        if (img_container.querySelector("img")) img_container.children[0].remove();
                        continue;
                    }

                    img_container.children[0].remove();
                    const img = document.createElement("img");
                    img.classList.add("main-image-image", "x-entityImage-image", "main-image-loaded");
                    img.src = base64;
                    img_container.append(img);
                }
            };

            const getNewEls = mutationsList => {
                for (const mutation of mutationsList) {
                    if (mutation.type === "childList") {
                        if (!mutation.addedNodes.length) continue;
                        loadFolderImages(mutation.addedNodes);
                    }
                }
            };

            const refresh = mutationsList => {
                console.log("refresh");
                for (const mutation of mutationsList) {
                    if (mutation.type === "attributes" && mutation.attributeName === "class") {
                        loadFolderImages(listElement.children);
                    }
                }
            };

            loadFolderImages();

            new MutationObserver(getNewEls).observe(listElement, { childList: true });
            new MutationObserver(refresh).observe(rootlist, { attributes: true, attributeFilter: ["class"] });

            DribbblishShared.loadFolderImages = loadFolderImages;
        }
    );

    // filepicker for custom folder images
    const filePickerForm = document.createElement("form");
    filePickerForm.setAttribute("aria-hidden", true);
    filePickerForm.innerHTML = '<input type="file" class="hidden-visually" />';
    document.body.appendChild(filePickerForm);
    /** @type {HTMLInputElement} */
    const filePickerInput = filePickerForm.childNodes[0];
    filePickerInput.accept = ["image/jpeg", "image/apng", "image/avif", "image/gif", "image/png", "image/svg+xml", "image/webp"].join(",");

    filePickerInput.onchange = () => {
        if (!filePickerInput.files.length) return;

        const file = filePickerInput.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const result = event.target.result;
            const id = Spicetify.URI.from(filePickerInput.uri).id;
            try {
                localStorage.setItem("dribbblish:folder-image:" + id, result);
            } catch {
                Spicetify.showNotification("File too large");
            }
            if (version < 121200000) {
                DribbblishShared.loadPlaylistImage?.call();
            } else {
                DribbblishShared.loadFolderImages?.call();
            }
        };
        reader.readAsDataURL(file);
    };

    // context menu items for custom folder images
    new Spicetify.ContextMenu.Item(
        "Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            if (version < 121200000) {
                DribbblishShared.loadPlaylistImage?.call();
            } else {
                DribbblishShared.loadFolderImages?.call();
            }
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "x"
    ).register();
    new Spicetify.ContextMenu.Item(
        "Choose folder image",
        ([uri]) => {
            filePickerInput.uri = uri;
            filePickerForm.reset();
            filePickerInput.click();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "edit"
    ).register();
})();

// LEGACY NAVBAR ONLY
function legacy() {
    if (!Spicetify.Platform) {
        setTimeout(legacy, 300);
        return;
    }

    // allow resizing of the navbar
    waitForElement([".Root__nav-bar .LayoutResizer__input"], ([resizer]) => {
        const observer = new MutationObserver(updateVariable);
        observer.observe(resizer, { attributes: true, attributeFilter: ["value"] });
        function updateVariable() {
            let value = resizer.value;
            if (value < 121) {
                value = 72;
                document.documentElement.classList.add("left-sidebar-collapsed");
            } else {
                document.documentElement.classList.remove("left-sidebar-collapsed");
            }
            document.documentElement.style.setProperty("--nav-bar-width", value + "px");
        }
        updateVariable();
    });

    // allow resizing of the buddy feed
    waitForElement([".Root__right-sidebar .LayoutResizer__input"], ([resizer]) => {
        const observer = new MutationObserver(updateVariable);
        observer.observe(resizer, { attributes: true, attributeFilter: ["value"] });
        function updateVariable() {
            let value = resizer.value;
            let min_value = version < 121200000 ? 321 : 281;
            if (value < min_value) {
                value = 72;
                document.documentElement.classList.add("buddyFeed-hide-text");
            } else {
                document.documentElement.classList.remove("buddyFeed-hide-text");
            }
        }
        updateVariable();
    });

    waitForElement([".main-nowPlayingBar-container"], ([nowPlayingBar]) => {
        const observer = new MutationObserver(updateVariable);
        observer.observe(nowPlayingBar, { childList: true });
        function updateVariable() {
            if (nowPlayingBar.childElementCount === 2) {
                document.documentElement.classList.add("connected");
            } else {
                document.documentElement.classList.remove("connected");
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

    waitForElement([`ul[tabindex="0"]`, `ul[tabindex="0"] .GlueDropTarget--playlists.GlueDropTarget--folders`], ([root, firstItem]) => {
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
                    uri = `spotify:playlist:${uid}`;
                } else if (app === "folder") {
                    const base64 = localStorage.getItem("dribbblish:folder-image:" + uid);
                    let img = link.querySelector("img");
                    if (!img) {
                        img = document.createElement("img");
                        img.classList.add("playlist-picture");
                        link.prepend(img);
                    }
                    img.src = base64 || "https://cdn.jsdelivr.net/gh/spicetify/spicetify-themes@master/Dribbblish/images/tracklist-row-song-fallback.svg";
                    continue;
                }

                Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}/metadata`, { policy: { picture: true } }).then(res => {
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

        new MutationObserver(loadPlaylistImage).observe(listElem, { childList: true });
    });
}
