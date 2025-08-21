const htmlScripts = {
    result_scripts(e) { function t(e, t) { let l = 0, n = !1, i = !1; for (let r = t; r < e.length; r++) { let u = e[r]; if (n) { i ? i = !1 : "\\" === u ? i = !0 : '"' === u && (n = !1); continue } if ('"' === u) { n = !0; continue } if ("{" === u) l++; else if ("}" === u && 0 == --l) return e.slice(t, r + 1) } return null } let l = [], n = /<script\b[^>]*>([\s\S]*?)<\/script>/gi, i; for (; null !== (i = n.exec(e));) { let r = i[1]; if (!r) continue; let u = /"result"\s*:\s*\{/g, s; for (; null !== (s = u.exec(r));) { let c = u.lastIndex - 1, f = t(r, c); if (f) try { l.push(JSON.parse(f)) } catch (o) { } } } return l },
    findObjectsByKey(e, t) { let f = []; return !function e(n) { if (n && "object" == typeof n) for (let [o, i] of Object.entries(n)) o === t && f.push(i), e(i) }(e), f },
    handleGroups(html, getKey = 'nonAdminGroups') {
        const results = htmlScripts.result_scripts(html);
        for (let obj of results) {
            const found = htmlScripts.findObjectsByKey(obj, getKey);
            if (found.length) {
                let { edges, page_info } = found[0]?.groups_tab?.tab_groups_list ?? {};
                return { edges, page_info };
            }
        }
        return {};
    }

}

const postManage = {
    selectedGroups: new Set(),
    selectionGroup: (e) => {
        let { selectedGroups } = postManage;
        selectedGroups.has(e.value) ? selectedGroups.delete(e.value) : selectedGroups.add(e.value); console.log(selectedGroups);
        console.log(selectedGroups);
    },
    async init() {
        // ====== CSS ======
        const style = document.createElement('style');
        style.textContent = `
        .photo-app { font-family: sans-serif; padding: 20px; }
        .layout { display: flex; gap: 20px; }
        .left-pane, .right-pane { flex: 1; border: 1px solid #ccc; border-radius: 5px; padding: 10px; }
        .section { margin-bottom: 20px; }
        textarea { width: 100%; height: 120px; }
        .photo-gallery { display: flex; flex-wrap: wrap; gap: 10px; }
        .photo-gallery img { object-fit: contain; max-width: 200px; border: 1px solid #ccc; border-radius: 4px; }
        .image-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; cursor: grab; opacity: 0; transition: opacity 0.3s ease; z-index: 999999;}
        .image-overlay.show { opacity: 1;}
        .image-overlay img { max-width: 90%; max-height: 90%; transform-origin: center center; transition: transform 0.2s ease;}
    `;
        document.head.appendChild(style);

        // ====== Container notify ======
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);

        const notify = {
            notificationIdCounter: 0,
            showNotification(t, i = {}) {
                let e = `notification-${++this.notificationIdCounter}`;
                let n = document.createElement("div");
                n.className = `alert alert-${i.type || "info"} d-flex align-items-center mb-1`;
                n.style.cssText = "min-width:300px;max-width:90vw;padding:10px 20px";
                n.id = e;

                if (i.loading) {
                    let o = document.createElement("div");
                    o.className = "spinner-border spinner-border-sm me-2";
                    o.role = "status";
                    n.appendChild(o);
                }

                let a = document.createElement("span");
                a.textContent = t;
                n.appendChild(a);
                container.appendChild(n);

                if (!i.sticky && !i.loading) {
                    setTimeout(() => this.hideNotification(e), i.duration || 3000);
                }

                return e;
            },
            hideNotification(t) {
                let i = document.getElementById(t);
                if (i) {
                    i.style.transition = "opacity 0.5s ease";
                    i.style.opacity = 0;
                    setTimeout(() => i.remove(), 500);
                }
            }
        };

        // ====== Giao diện ======
        const app = document.createElement('div');
        app.className = 'photo-app';
        app.innerHTML = `
        <div class="layout">
            <div class="left-pane">
            <h2>📂 Dữ liệu upload</h2>
            <div style="display:flex;margin-bottom:10px;flex-direction:column;">
                <div>
                    <select id="accountSelect" class="form-control mt-1">
                        <option value="">-- Chọn tài khoản --</option>
                    </select>
                </div>
                <select id="folderSelect" class="form-control mt-1">
                    <option value="">-- Chọn thư mục --</option>
                </select>
                <button class="btn mt-1 btn-warning" id="loadBtn">Upload</button>
            </div>
                <div class="section">
                    <h4>Bài viết</h4>
                    <textarea id="postMessage" placeholder="Nội dung bài viết..."></textarea>
                </div>
                <div class="section">
                    <h4>Ảnh chưa upload</h4>
                    <div class="photo-gallery" id="leftGallery"></div>
                </div>
            </div>
            <div class="right-pane">
                <h4>Dữ liệu đã upload</h4>
                <p><b>Số ảnh:</b> <span id="count">0</span></p>
                <div class="photo-gallery" id="rightGallery"></div>
            </div>
        </div>
    `;
        root.appendChild(app);

        const accountSelect = app.querySelector('#accountSelect');
        const folderSelect = app.querySelector('#folderSelect');
        const loadBtn = app.querySelector('#loadBtn');
        const postMessageEl = app.querySelector('#postMessage');
        const leftGalleryEl = app.querySelector('#leftGallery');
        const rightGalleryEl = app.querySelector('#rightGallery');
        const countEl = app.querySelector('#count');

        let currentFolder = '', currentUser = {};
        // ====== Load folder list ======
        try {
            const [listRes, userRes] = await Promise.all([
                fetch('http://localhost:1922/fb-mutation/list'),
                fetch('http://localhost:1922/ctrl-cookie/list')
            ]);
            const folderList = await listRes.json();
            const userList = await userRes.json();

            folderList
                .filter(item => item.type === 'folder')
                .forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item.path;
                    opt.textContent = item.name;
                    folderSelect.appendChild(opt);
                });

            userList
                .filter(item => item.type === 'file' && item.name.endsWith('.json'))
                .forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item.path;
                    opt.textContent = item.name;
                    accountSelect.appendChild(opt);
                });
        } catch (err) {
            notify.showNotification("Không thể tải danh sách thư mục hoặc dữ liệu u.", { type: "danger" });
            return;
        }

        // ====== Khi chọn tài khoản ======
        accountSelect.addEventListener('change', async () => {
            const createUl = (nodes = []) => {
                let div = document.createElement('div')
                div.innerHTML = `
                    <div>
                        <button class="form-control dropdown-toggle" type="button" id="groupDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            Chọn nhóm
                        </button>
                        <ul class="dropdown-menu" onclick="event.stopPropagation()" aria-labelledby="groupDropdown" data-bs-auto-close="outside" style="width: auto; max-height: 500px; overflow-y: auto;">
                            ${nodes.map(o => `<li>
                                <div class="dropdown-item d-flex align-items-start" title="${o.id}">
                                    <input type="checkbox" class="form-check-input me-2 group-check m-auto" value="${o.id}" onchange="postManage.selectionGroup(this)">
                                    <a href="${o.url}" target="_blank">
                                        <img src="${o.profile_picture_48?.uri}" alt="${o.url}" class="rounded me-2"
                                            style="width:40px; height:40px; object-fit:cover; cursor:pointer;">
                                    </a>
                                    <div class="flex-grow-1" onclick="this.parentElement.querySelector('input').click()">
                                        <div class="fw-semibold">${o.name}</div>
                                        <div class="small text-muted">Active
                                            <em class="text-secondary">${new Date(1755383759 * 1e3).toLocaleString(o.last_post_time)}</em>
                                        </div>
                                    </div>
                                </div>
                            </li>`).join('')}
                        </ul>
                    </div>
                `
                return div
            }

            async function loadUserData() {
                currentUser = await fetch(`http://localhost:1922/ctrl-cookie/view?path=${encodeURIComponent(accountSelect.value)}`).then(r => r?.json() || ({}));
                if (!currentUser) return;
                let loadingId = notify.showNotification(`Đã chọn tài khoản: ${accountSelect.options[accountSelect.selectedIndex].text}`, { type: "info", loading: true, sticky: true });
                notify.hideNotification(loadingId);
                console.log(currentUser);
                return currentUser;
            }

            async function group_feed() {
                let url = '/fb-mutation/group-feed';
                let loadingId = notify.showNotification(url, { type: "primary", sticky: true });
                let html = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ u: currentUser }) })
                    .then(r => r.text()).finally(() => notify.hideNotification(loadingId));
                let { page_info, edges } = htmlScripts.handleGroups(html);
                if(edges) accountSelect.parentElement.appendChild(createUl(edges.map(e => e.node)));
            }
            
            await loadUserData() && await group_feed();
        })

        // ====== Khi chọn thư mục ======
        folderSelect.addEventListener('change', async () => {
            currentFolder = folderSelect.value;
            if (!currentFolder) return;
            notify.showNotification(`Đã chọn thư mục: ${folderSelect.options[folderSelect.selectedIndex].text}`, { type: "info" });

            // Load post.txt
            try {
                const txtRes = await fetch(`http://localhost:1922/fb-mutation/${encodeURIComponent(currentFolder)}/post.txt`);
                if (!txtRes.ok) {
                    // Nếu 404 hoặc lỗi khác
                    postMessageEl.value = '';
                } else {
                    postMessageEl.value = await txtRes.text();
                }
            } catch (err) {
                console.error(err);
                postMessageEl.value = '';
            }

            // Load ảnh chưa upload
            try {
                const filesRes = await fetch(`http://localhost:1922/fb-mutation/list?path=${encodeURIComponent(currentFolder)}`);
                const files = await filesRes.json();

                leftGalleryEl.innerHTML = '';
                files
                    .filter(file => file.type === 'file' && !file.name.endsWith('.txt'))
                    .forEach(file => {
                        const img = document.createElement('img');
                        img.src = `/fb-mutation/${encodeURIComponent(file.path)}`;
                        leftGalleryEl.appendChild(img);
                    });


            } catch {
                leftGalleryEl.innerHTML = '<p>Lỗi khi tải danh sách ảnh.</p>';
            }
        });

        // ====== Khi bấm tải ảnh ======
        loadBtn.addEventListener('click', async () => {
            if (!currentFolder) {
                notify.showNotification("Vui lòng chọn thư mục!", { type: "warning" });
                return;
            }
            let attachments = []
            let loadingId = notify.showNotification("Đang tải ảnh...", { type: "primary", loading: true, sticky: true });
            try {
                const res = await fetch('http://localhost:1922/fb-mutation/post-photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        f: currentFolder,
                        u: currentUser,
                        message: postMessageEl.value
                    })
                });

                attachments = await res.json();

                if (Array.isArray(attachments) && attachments.length > 0) {
                    const ids = attachments.map(item => item.photo?.id).filter(Boolean);
                    notify.showNotification(`Đã upload ${ids.length} ảnh. IDs: ${ids.join(', ')}`, { type: "success", duration: 5000 });

                    // Hiển thị ảnh bên phải
                    rightGalleryEl.innerHTML = '';
                    countEl.textContent = ids.length;
                    attachments.forEach(item => {
                        if (item.photo?.src) {
                            const img = document.createElement('img');
                            img.src = item.photo.src;
                            rightGalleryEl.appendChild(img);
                        }
                    });

                } else notify.showNotification("Không có ảnh nào được upload.", { type: "warning" });
            } catch (err) {
                console.error(err);
                notify.showNotification("Lỗi khi tải ảnh!", { type: "danger" });
            } finally {
                notify.hideNotification(loadingId);
            }

            loadingId = notify.showNotification("Đang post bài viết", { type: "primary", loading: true, sticky: true });
            try {
                const res = await fetch(`http://localhost:1922/fb-mutation/post-mutation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: postMessageEl.value,
                        attachments,
                        u: currentUser
                    })
                }).then(r => r.json());

                console.log(res);

            } catch (err) {
                console.error(err);
                notify.showNotification("Lỗi khi tải ảnh!", { type: "danger" });
            } finally {
                notify.hideNotification(loadingId);
            }
        });

        imgOverlay.enableImagePreview(leftGalleryEl);
        imgOverlay.enableImagePreview(rightGalleryEl);
    }
}