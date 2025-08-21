const accountManage = {
    fileListElement: null,
    pathDisplay: null,
    searchBar: null,
    deleteButton: null,
    contextMenu: null,
    currentPath: "",
    pathHistory: [],
    selectedItems: [],
    draggedItemPath: null,
    currentContextMenuPath: null,
    currentItemList: [],

    renderAccountManageHTML(e) {
        let t = document.createElement("div");
        t.className = "container mt-3";
        let n = document.createElement("nav");
        n.id = "path-display", n.setAttribute("aria-label", "breadcrumb");
        let l = document.createElement("ol");
        l.className = "breadcrumb", n.appendChild(l), t.appendChild(n);
        let a = document.createElement("div");
        a.className = "d-flex", a.style.gap = ".25em";
        let i = document.createElement("div");
        i.id = "search-bar", i.className = "mb-3 w-100";
        let o = document.createElement("input");
        o.className = "form-control", o.placeholder = "Tìm kiếm tên...", o.oninput = function () {
            accountManage.searchItems(o.value)
        }, i.appendChild(o), a.appendChild(i);
        let s = document.createElement("div");
        s.className = "d-flex justify-content-between align-items-center mb-3 d-inline";
        let r = document.createElement("button");
        r.id = "delete-button", r.className = "btn btn-danger", r.style.display = "none", r.onclick = function () {
            accountManage.deleteSelected()
        };
        let c = document.createElement("i");
        c.className = "bi bi-trash", r.appendChild(c), s.appendChild(r);
        let d = document.createElement("span");
        d.id = "selected-count", d.className = "text-muted small d-inline", s.appendChild(d), a.appendChild(s), t.appendChild(a);
        let p = document.createElement("div");
        p.className = "mb-3 d-block d-sm-none";
        let h = document.createElement("input");
        h.type = "file", h.className = "form-control", h.multiple = !0, h.onchange = function () {
            accountManage.handleMobileUpload(accountManage.files)
        }, p.appendChild(h), t.appendChild(p);
        let u = document.createElement("ul");
        u.id = "file-list", u.ondragover = function (e) {
            accountManage.handleDragOver(e)
        }, u.ondrop = function (e) {
            accountManage.handleDrop(e)
        };
        let y = document.createElement("li");
        y.className = "text-center p-5", y.textContent = "Kéo và thả thư mục hoặc tệp vào đây", u.appendChild(y), t.appendChild(u);
        let m = document.createElement("div");
        m.id = "context-menu";
        let f = document.createElement("ul");
        f.className = "list-group", [{
            text: "Xóa",
            class: "delete-option",
            action: "deleteContextItem"
        }, {
            text: "Chọn",
            class: "select-option",
            action: "selectContextItem"
        }, {
            text: "Bỏ chọn",
            class: "unselect-option",
            action: "unselectContextItem"
        }, {
            text: "Tạo tệp mới",
            class: "create-folder-option",
            action: "createFile"
        }].forEach(e => {
            let t = document.createElement("li");
            t.className = `list-group-item ${e.class}`, t.textContent = e.text, t.onclick = function () {
                accountManage[e.action]()
            }, f.appendChild(t)
        }), m.appendChild(f), t.appendChild(m), e && e instanceof HTMLElement ? e.appendChild(t) : root.appendChild(t);
        accountManage.fileListElement = document.getElementById("file-list");
        accountManage.pathDisplay = document.getElementById("path-display");
        accountManage.searchBar = document.getElementById("search-bar");
        accountManage.deleteButton = document.getElementById("delete-button");
        accountManage.contextMenu = document.getElementById("context-menu");
        return t
    },

    async loadFiles(e = "") {
        accountManage.currentPath = e.replace(/\\/g, "/");
        accountManage.updatePathDisplay();
        if (e !== accountManage.currentPath && accountManage.pathHistory[accountManage.pathHistory.length - 1] !== accountManage.currentPath) {
            accountManage.pathHistory.push(accountManage.currentPath);
        }
        let t = await fetch(`/ctrl-cookie/list?path=${e}`),
            n = await t.json();
        accountManage.currentItemList = n;
        accountManage.renderItemList(n);
        accountManage.deleteButton.style.display = accountManage.selectedItems.length > 0 ? "block" : "none";
    },

    updatePathDisplay() {
        let e = accountManage.pathDisplay.querySelector(".breadcrumb");
        e.innerHTML = "";
        let t = document.createElement("li");
        t.className = "breadcrumb-item";
        let n = document.createElement("a");
        n.href = "#", n.textContent = "./accounts", n.onclick = e => {
            e.preventDefault(), accountManage.loadFiles("")
        }, t.appendChild(n), e.appendChild(t);
        let l = accountManage.currentPath.split("/").filter(e => "" !== e),
            a = "";
        l.forEach((t, n) => {
            a += `/${t}`;
            let i = document.createElement("li"),
                o = n === l.length - 1;
            if (i.className = o ? "breadcrumb-item active" : "breadcrumb-item", o) i.setAttribute("aria-current", "page"), i.textContent = t;
            else {
                let s = document.createElement("a");
                s.href = "#", s.textContent = t;
                let r = a.startsWith("/") ? a.slice(1) : a;
                s.onclick = e => {
                    e.preventDefault(), accountManage.loadFiles(r)
                }, i.appendChild(s)
            }
            e.appendChild(i)
        })
    },

    renderItemList(e) {
        accountManage.fileListElement.innerHTML = "";
        if (0 !== e.length) {
            e.forEach(e => {
                let t = document.createElement("li");
                t.classList.add("d-flex", "align-items-center"), t.dataset.path = e.path, t.dataset.type = e.type, t.draggable = !0, t.innerHTML = `<span class="icon ${"folder" === e.type ? "folder-icon" : "file-icon"}"></span> <span style=flex:1>${e.name}</span> <button class='action-btn btn btn-light btn-sm' style=border:none><i class='bi bi-three-dots-vertical'></i></button>`, t.classList.toggle("selected", accountManage.selectedItems.includes(e.path)), t.addEventListener("click", n => {
                    n.stopPropagation();
                    let l = n.ctrlKey || n.metaKey;
                    if (l) {
                        let a = accountManage.selectedItems.indexOf(e.path); - 1 !== a ? (accountManage.selectedItems.splice(a, 1), t.classList.remove("selected")) : (accountManage.selectedItems.push(e.path), t.classList.add("selected")), accountManage.deleteButton.style.display = accountManage.selectedItems.length > 0 ? "block" : "none"
                    } else "folder" === e.type ? accountManage.loadFiles(e.path) : accountManage.handleFileClick(e)
                }), accountManage.fileListElement.appendChild(t), t.querySelector(".action-btn").addEventListener("click", t => {
                    t.stopPropagation(), accountManage.currentContextMenuPath = e.path, accountManage.showContextMenu(t.clientX, t.clientY, !0, "" !== accountManage.currentPath, "folder" === e.type)
                })
            })
        } else {
            accountManage.fileListElement.innerHTML = '<li class="text-center p-3">Không có mục nào</li>'
        }
    },

    handleFileClick(e) {
        let t = e.path,
            n = t.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(n)) {
            accountManage.openImage(t);
        } else if (["mp4", "webm", "ogg", "avi", "mov"].includes(n)) {
            accountManage.openVideo(t);
        } else if (["mp3", "wav", "ogg", "flac", "aac"].includes(n)) {
            accountManage.openAudio(t);
        } else { // Loại bỏ 'json' ở đây
            notify.notifyAction(`Xem tin tệp ${e.path}`, "info"), accountManage.editTextFile(t);
        }
    },

    openImage(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100", t.style.cursor = "pointer";
        let n = document.createElement("div");
        n.style.position = "relative";
        let l = document.createElement("img");
        l.src = `/ctrl-cookie/view?path=${encodeURIComponent(e)}`, l.alt = "Image", l.style.maxWidth = "90vw", l.style.maxHeight = "90vh", l.style.transition = "transform 0.2s ease-in-out";
        let a = document.createElement("div");

        function i(e, t) {
            let n = l.getBoundingClientRect(),
                i = e - n.left,
                o = t - n.top;
            a.style.backgroundImage = `url(${l.src})`, a.style.backgroundSize = `${2 * l.width}px ${2 * l.height}px`, a.style.backgroundPosition = `-${2 * i - 100}px -${2 * o - 100}px`, a.style.top = o - 100 + "px", a.style.left = i - 100 + "px", a.style.display = "block"
        }
        a.style.position = "absolute", a.style.border = "5px solid #fff", a.style.display = "none", a.style.pointerEvents = "none", a.style.zIndex = "10", a.style.width = "200px", a.style.height = "200px", n.appendChild(l), n.appendChild(a), t.appendChild(n), root.appendChild(t), t.addEventListener("click", e => {
            e.target === t && root.removeChild(t)
        }), l.addEventListener("mousemove", e => {
            i(e.clientX, e.clientY)
        }), l.addEventListener("mouseleave", () => {
            a.style.display = "none"
        }), l.addEventListener("touchmove", e => {
            if (1 === e.touches.length) {
                let t = e.touches[0];
                i(t.clientX, t.clientY)
            }
        }), l.addEventListener("touchend", () => {
            a.style.display = "none"
        })
    },

    openVideo(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100", t.style.cursor = "pointer";
        let n = document.createElement("div");
        n.style.position = "relative";
        let l = document.createElement("video");
        l.src = `/ctrl-cookie/view?path=${encodeURIComponent(e)}`, l.controls = !0, l.style.maxWidth = "90vw", l.style.maxHeight = "90vh", l.autoplay = !0, n.appendChild(l), t.appendChild(n), root.appendChild(t), t.addEventListener("click", e => {
            e.target === t && root.removeChild(t)
        })
    },

    openAudio(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100", t.style.cursor = "pointer";
        let n = document.createElement("div");
        n.style.background = "#fff", n.style.padding = "20px", n.style.borderRadius = "8px", n.style.textAlign = "center", n.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)", n.style.maxWidth = "90vw";
        let l = document.createElement("audio");
        l.src = `/ctrl-cookie/view?path=${encodeURIComponent(e)}`, l.controls = !0, l.autoplay = !0, l.style.width = "100%";
        let a = document.createElement("div");
        a.textContent = `🎵 Đang phát: ${decodeURIComponent(e.split("/").pop())}`, a.style.marginBottom = "10px", a.style.fontWeight = "bold";
        let i = document.createElement("button");
        i.textContent = "Đóng", i.className = "btn btn-secondary mt-2", i.onclick = () => root.removeChild(t), n.appendChild(a), n.appendChild(l), n.appendChild(i), t.appendChild(n), root.appendChild(t), t.addEventListener("click", e => {
            e.target === t && root.removeChild(t)
        })
    },

    editTextFile(e) {
        console.log(typeof e, e);

        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100";
        let n = document.createElement("div");
        n.style.backgroundColor = "#fff", n.style.padding = "20px", n.style.borderRadius = "8px", n.style.maxWidth = "90vw", n.style.maxHeight = "90vh", n.style.width = "600px", n.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)", n.style.display = "flex", n.style.flexDirection = "column", n.style.gap = "10px", n.innerHTML = `<h5>Chỉnh sửa tệp: <span style=font-size:.9em;word-break:break-all>${e}</span></h5><textarea id=file-edit-text readonly style=flex:1;min-height:300px;resize:vertical;padding:10px></textarea><div class=text-end><button class="btn btn-secondary"onclick=accountManage.closeEditor()>✖ Đóng</button></div>`, t.appendChild(n), root.appendChild(t), fetch(`/ctrl-cookie/view?path=${encodeURIComponent(e)}`).then(e => e.text()).then(e => {
            document.getElementById("file-edit-text").value = JSON.stringify(JSON.parse(e), null, 3)
        }).catch(e => notify.notifyAction("Không thể tải tệp để chỉnh sửa.")), window.currentTextEditorOverlay = t
    },


    // saveFile(e) {
    //     let t = document.getElementById("file-edit-text");
    //     if (checkCookie(t.value)) {
    //         notify.notifyPromise("Đang lưu tệp", fetch("/ctrl-cookie/save", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({
    //                 path: e,
    //                 content: t.value
    //             })
    //         }).then(e => e.json()).then(e => {
    //             if (!e.success) throw Error(e.error || "Lỗi không xác định")
    //         }))
    //     } else notify.notifyAction("Cần lưu đúng định dạng cookie", "warning");
    // },

    async createFile() {
        let e = prompt("Dán cookie tài khoản facebook của bạn:");
        // if (!checkCookie(e)) {
        //     notify.notifyAction(`${e}\nKHÔNG ĐÚNG ĐỊNH DẠNG COOKIE`, "danger")
        //     return
        // }

        if (e) {
            fetch("/ctrl-cookie/create/file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    // name: '',
                    content: e,
                    path: accountManage.currentPath
                })
            }).then(e => e.json()).then(e => {
                notify.notifyAction(e.message || e.error, e.success ? "success" : "warning"), accountManage.loadFiles(accountManage.currentPath)
            })
        }
    },

    async deleteSelected(e) {
        let t = e || accountManage.selectedItems;
        if (t.length > 0 && confirm(`Bạn có chắc chắn muốn xóa ${t.length} mục đã chọn?`)) {
            let n = await fetch("/ctrl-cookie/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: t
                })
            }),
                l = await n.json();
            notify.notifyAction(l.message || l.error), accountManage.loadFiles(accountManage.currentPath), accountManage.selectedItems = [], accountManage.deleteButton.style.display = "none"
        } else if (e && e.length > 0) {
            accountManage.loadFiles(accountManage.currentPath);
        } else {
            notify.notifyAction("Vui lòng chọn ít nhất một mục để xóa.");
        }
    },

    async renameSelected(e) {
        let t = e || (1 === accountManage.selectedItems.length ? accountManage.selectedItems[0] : null);
        if (!t) {
            return notify.notifyAction("Vui lòng chọn một mục để đổi tên.");
        }
        let n = prompt("Nhập tên mới:");
        if (n) {
            fetch("/ctrl-cookie/rename", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    oldPath: t,
                    newName: n
                })
            }).then(e => e.json()).then(e => {
                notify.notifyAction(e.message || e.error, e.success ? "success" : "warning"), accountManage.loadFiles(accountManage.currentPath), accountManage.selectedItems = [], accountManage.deleteButton.style.display = "none"
            })
        }
    },

    async goBack() {
        if (accountManage.pathHistory.length > 1) {
            accountManage.pathHistory.pop();
            let e = accountManage.pathHistory.pop();
            await accountManage.loadFiles(e);
        } else {
            await accountManage.loadFiles(""), accountManage.pathHistory = []
        }
    },

    closeEditor() {
        if (window.currentTextEditorOverlay) {
            root.removeChild(window.currentTextEditorOverlay);
            window.currentTextEditorOverlay = null;
        }
    },

    handleMobileUpload(e) {
        for (let t of e) {
            let n = accountManage.currentPath || "";
            accountManage.uploadFileWithRelativePath(t, n + "/" + t.name);
        }
        accountManage.loadFiles(accountManage.currentPath);
    },

    handleDragOver(e) {
        e.preventDefault();
    },

    async handleDrop(e) {
        e.preventDefault();
        let t = e.dataTransfer.items;
        if (!t || 0 === t.length) return;
        let n = [];
        for (let l of t) {
            let a = (l && typeof l.webkitGetAsEntry === 'function') ? l.webkitGetAsEntry() : undefined;
            if (a) {
                n.push(accountManage.traverseFileTree(a, accountManage.currentPath));
            }
        }
        await Promise.all(n);
        await accountManage.loadFiles(accountManage.currentPath);
    },

    async traverseFileTree(e, t) {
        if (e.isFile) {
            return new Promise(n => {
                e.file(async e => {
                    let l = accountManage.pathJoin(t, e.name);
                    await accountManage.uploadFileWithRelativePath(e, l);
                    n();
                })
            });
        }
        if (e.isDirectory) {
            let n = e.createReader(),
                l = await new Promise(e => n.readEntries(e)),
                a = accountManage.pathJoin(t, e.name);
            await accountManage.createFileOnServer(a);
            let i = l.map(e => accountManage.traverseFileTree(e, a));
            await Promise.all(i);
        }
    },

    async uploadFileWithRelativePath(e, t) {
        let n = new FormData;
        n.append("file", e), n.append("relativePath", accountManage.pathDirname(t));
        let l = await fetch("/ctrl-cookie/upload", {
            method: "POST",
            body: n
        }),
            a = await l.json();
        a.error ? (console.error(a.error), notify.notifyAction(`Lỗi khi tải lên: ${e.name}`, "danger")) : notify.notifyAction(`Tải lên ${e.name} thành công`, "success")
    },

    async createFileOnServer(e) {
        let t = await fetch("/ctrl-cookie/create/file", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: accountManage.pathBasename(e),
                path: accountManage.pathDirname(e)
            })
        }),
            n = await t.json();
        if (n.error) {
            console.error(`Lỗi khi tạo thư mục: ${e}`, n.error);
        }
    },

    pathJoin(...e) {
        return e.join("/").replace(/\/+/g, "/")
    },

    pathDirname(e) {
        let t = e.split("/").filter(Boolean);
        t.pop();
        return t.join("/")
    },

    pathBasename(e) {
        let t = e.split("/").filter(Boolean);
        return t[t.length - 1] || ""
    },

    async uploadFile(e, t) {
        let n = new FormData;
        n.append("file", e), n.append("relativePath", t);
        let l = await fetch("/ctrl-cookie/upload", {
            method: "POST",
            body: n
        }),
            a = await l.json();
        if (a.error) {
            notify.notifyAction(`Lỗi khi tải lên ${e.name}: ${a.error}`);
        }
    },

    handleDragOverFolder(e) {
        e.preventDefault(), accountManage.classList.add("drag-over-target")
    },

    async handleDropIntoFolder(e) {
        e.preventDefault(), accountManage.classList.remove("drag-over-target");
        if (accountManage.draggedItemPath) {
            let t = `${accountManage.dataset.path}/${accountManage.draggedItemPath.split("/").pop()}`,
                n = await fetch("/ctrl-cookie/move", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        oldPath: accountManage.draggedItemPath,
                        newPath: t
                    })
                }),
                l = await n.json();
            if (l.error) {
                notify.notifyAction(`Lỗi khi di chuyển: ${l.error}`);
            }
            accountManage.loadFiles(accountManage.currentPath);
            accountManage.draggedItemPath = null;
        } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            let a = e.dataTransfer.files,
                i = accountManage.dataset.path;
            console.log("Thả tệp từ máy tính vào thư mục:", i);
            for (let o of a) {
                await accountManage.uploadFile(o, i);
            }
            accountManage.loadFiles(accountManage.currentPath);
        }
    },

    showContextMenu(e, t, n, l, a) {
        let i = window.innerWidth,
            o = window.innerHeight,
            r = accountManage.contextMenu.querySelector(".delete-option"),
            c = accountManage.contextMenu.querySelector(".select-option"),
            d = accountManage.contextMenu.querySelector(".unselect-option"),
            p = accountManage.contextMenu.querySelector(".create-folder-option");
        r.style.display = n ? "block" : "none", c.style.display = n && !accountManage.selectedItems.includes(accountManage.currentContextMenuPath) ? "block" : "none", d.style.display = n && accountManage.selectedItems.includes(accountManage.currentContextMenuPath) ? "block" : "none", p.style.display = n ? "none" : "block", e + 180 > i && (e = i - 180 - 10), t + 240 > o && (t = o - 240 - 10), accountManage.contextMenu.style.left = e + "px", accountManage.contextMenu.style.top = t + "px", accountManage.contextMenu.style.display = "block"
    },

    deleteContextItem() {
        accountManage.contextMenu.style.display = "none";
        accountManage.deleteSelected([accountManage.currentContextMenuPath]);
        accountManage.currentContextMenuPath = null;
    },

    selectContextItem() {
        if (accountManage.currentContextMenuPath && !accountManage.selectedItems.includes(accountManage.currentContextMenuPath)) {
            accountManage.selectedItems.push(accountManage.currentContextMenuPath);
            let e = Array.from(accountManage.fileListElement.children).find(e => e.dataset.path === accountManage.currentContextMenuPath);
            if (e) {
                e.classList.add("selected");
            }
            accountManage.deleteButton.style.display = accountManage.selectedItems.length > 0 ? "block" : "none";
        }
        accountManage.contextMenu.style.display = "none";
        accountManage.currentContextMenuPath = null;
    },

    unselectContextItem() {
        if (accountManage.currentContextMenuPath && accountManage.selectedItems.includes(accountManage.currentContextMenuPath)) {
            accountManage.selectedItems = accountManage.selectedItems.filter(e => e !== accountManage.currentContextMenuPath);
            let e = Array.from(accountManage.fileListElement.children).find(e => e.dataset.path === accountManage.currentContextMenuPath);
            if (e) {
                e.classList.remove("selected");
            }
            accountManage.deleteButton.style.display = accountManage.selectedItems.length > 0 ? "block" : "none";
        }
        accountManage.contextMenu.style.display = "none";
        accountManage.currentContextMenuPath = null;
    },

    searchItems(e) {
        accountManage.renderItemList(accountManage.currentItemList.filter(t => t.name.toLowerCase().includes(e.toLowerCase())));
    },

    init() {
        accountManage.renderAccountManageHTML();
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && "Backspace" === e.key) {
                e.preventDefault();
                accountManage.goBack();
            }
        });
        accountManage.fileListElement.addEventListener("contextmenu", e => {
            e.preventDefault();
            let t = e.target.closest("li[data-path]");
            if (t) {
                accountManage.currentContextMenuPath = t.dataset.path;
                let n = "folder" === t.dataset.type;
                accountManage.showContextMenu(e.clientX, e.clientY, !0, "" !== accountManage.currentPath, n);
            } else {
                accountManage.showContextMenu(e.clientX, e.clientY, !1, "" !== accountManage.currentPath, !1);
            }
        });
        document.addEventListener("click", () => {
            accountManage.contextMenu.style.display = "none";
            accountManage.currentContextMenuPath = null;
        });
        let longPressTimer = null;
        accountManage.fileListElement.addEventListener("touchstart", e => {
            if ("LI" === e.target.tagName || e.target.closest("li")) return;
            longPressTimer = setTimeout(() => {
                accountManage.showContextMenu(e.touches[0].clientX, e.touches[0].clientY, !1, "" !== accountManage.currentPath, !1);
            }, 800);
        });
        accountManage.fileListElement.addEventListener("touchend", () => {
            clearTimeout(longPressTimer);
        });
        accountManage.loadFiles();
    }
};

const imgOverlay = {
    enableImagePreview(rootElement) {
        rootElement.addEventListener('click', e => {
            if (e.target.tagName === 'IMG') {
                imgOverlay.openImageOverlay(e.target.src);
            }
        });
    },

    openImageOverlay(src) {
        let overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        let img = document.createElement('img');
        img.src = src;
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        setTimeout(() => overlay.classList.add('show'), 10);

        let scale = 1;
        let isDragging = false;
        let startX, startY, imgX = 0, imgY = 0;

        overlay.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.ctrlKey) {
                scale += e.deltaY * -0.001;
                scale = Math.min(Math.max(1, scale), 5);
                img.style.transform = `translate(${imgX}px, ${imgY}px) scale(${scale})`;
            }
        });

        overlay.addEventListener('mousedown', e => {
            isDragging = true;
            overlay.style.cursor = 'grabbing';
            startX = e.clientX - imgX;
            startY = e.clientY - imgY;
        });

        overlay.addEventListener('mouseup', () => {
            isDragging = false;
            overlay.style.cursor = 'grab';
        });

        overlay.addEventListener('mousemove', e => {
            if (!isDragging) return;
            imgX = e.clientX - startX;
            imgY = e.clientY - startY;
            img.style.transform = `translate(${imgX}px, ${imgY}px) scale(${scale})`;
        });

        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
        });
    },
}