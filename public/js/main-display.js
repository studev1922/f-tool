const mainDisplay = {
    _createLinkElement(e, t) {
        const n = document.createElement("a");
        n.className = t, n.textContent = e[0];
        if (typeof e[1] === "string") {
            n.href = e[1];
            if (e[1].startsWith("http") || e[1].startsWith("//")) {
                n.target = "_blank"
            }
        } else if (typeof e[1] === "function") {
            n.href = "#", n.onclick = t => {
                while (root.firstChild) root.firstChild.remove();
                t.preventDefault(), e[1]()
            }
        } else {
            n.href = "#", n.textContent = `${e[0]} (Invalid)`, n.style.color = "red"
        }
        return n
    },
    createNavItem(e) {
        const t = document.createElement("li");
        t.className = "nav-item";
        if (Array.isArray(e[1])) {
            t.className += " dropdown";
            const n = `navbarDropdown_${e[0].replace(/\s+/g, "_").replace(/[^\w-]/g, "")}`;
            t.innerHTML = `${this._createLinkElement([e[0], "#"], "nav-link dropdown-toggle").outerHTML}<ul class="dropdown-menu" aria-labelledby="${n}"></ul>`;
            const l = t.querySelector(".dropdown-toggle");
            l.id = n, l.setAttribute("role", "button"), l.setAttribute("data-bs-toggle", "dropdown"), l.setAttribute("aria-expanded", "false");
            const a = t.querySelector(".dropdown-menu");
            e[1].forEach(e => {
                const n = this.createDropdownItem(e);
                a.appendChild(n)
            })
        } else {
            const n = this._createLinkElement(e, "nav-link");
            t.appendChild(n)
        }
        return t
    },
    createDropdownItem(e) {
        const t = document.createElement("li");
        const n = this._createLinkElement(e, "dropdown-item");
        t.appendChild(n);
        return t
    },
    createNavbarElement(e) {
        const t = document.createElement("nav");
        t.className = "navbar navbar-expand-lg sticky-navbar", t.innerHTML = `<div class="container-fluid"><a class="navbar-brand" href="https://github.com/studev1922/f-tool" target=_blank><img src="/asset/favicon.ico" style="width:2em">studev1922</a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="navbarNav"><ul class="navbar-nav me-auto mb-2 mb-lg-0"></ul></div></div>`;
        const n = t.querySelector(".navbar-nav");
        e.forEach(e => {
            const t = this.createNavItem(e);
            n.appendChild(t)
        });
        return t
    },
    navDisplays(...e) {
        const t = document.querySelector(".sticky-navbar");
        if (t) t.remove()
        document.body.appendChild(this.createNavbarElement(e))
    }
};

;(async _ => {
    mainDisplay.navDisplays(...data.navDisplay)
    notify.notifyAction('Project: https://github.com/studev1922/f-tool', null, 1e4)
    notify.notifyAction('Phone: (+84) 941 536 489', null, 8e3)
    notify.notifyAction('Email: sdhoa1922@gmail.com', null, 9e3)
})()
