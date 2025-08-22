// npm i puppeteer
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import file_manager from './file_api.js';
import { code, file, menu } from '../modules/index.js'

const delay = ms => new Promise(res => setTimeout(res, ms));
const defaultRelayData = await (async _ => {
    try {
        return await file.readAsJson('.accounts-relay_data/default.json')
    } catch (e) {
        return null
    }
})()
menu.std.alert(defaultRelayData ? 'relay-data(Default)' : 'relay-data(Account)');


export default async (app, __dirname) => {
    const api = '/ctrl-cookie';
    const fullPath = (e = "") => { let l = path.normalize(e).replace(/^(\.\.(\/|\\|$))+/, ""); return path.join(path.join(__dirname, '.accounts-relay_data'), l) };

    await app.route(`${api}/create/file`).post(async (req, res, next) => {
        const browser = await puppeteer.launch(); // headless browser
        const page = await browser.newPage();
        let cookies = code.cookieDecode(req.body.content);

        for (let name of Object.keys(cookies)) {
            await browser.setCookie({
                name, domain: '.facebook.com',
                value: encodeURIComponent(cookies[name]),
                path: '/',
                secure: true,
                httpOnly: !('c_user,presence,wd'.includes(name))
            })
        }
        await page.goto('https://www.facebook.com/me'); // redirect to personal's page
        try {
            const { nes, username } = await page.evaluate(async _ => {
                let __eqmc = () => { try { let t = JSON.parse(document.querySelector('#__eqmc').innerText); if (!t?.u) return { fb_dtsg: t.f }; let e = t.u.substring(10).split("&").map(t => t.split("=")); e.push(["fb_dtsg", t.f]); let r = Object.fromEntries(e); return delete r.jazoest, r } catch { return {} } };
                return {
                    nes: __eqmc(), username: (_ => {
                        const match = document.body.innerHTML.match(/"userVanity":"(.*?)"/);
                        return (match && match[1]) ? match[1] : null
                    })(),
                }
            });
            const relayData = defaultRelayData || await page.evaluate(async _ => {
                let m = {
                    dataScript() { return Array.from(document.body.querySelectorAll("script")).map(r => { try { return JSON.parse(r.innerText) } catch (t) { return null } }).filter(Boolean) },
                    shortcuts(e, t) { let f = []; return !function e(n) { if ("object" == typeof n && null !== n) { if (Array.isArray(n)) for (let i of n) e(i); else for (let l in t in n && f.push(n[t]), n) e(n[l]) } }(e), f },
                    allSrc: (t = [".js"], r = !1) => { let e = [...m.shortcuts(m.dataScript(), "src"), ...m.shortcuts(m.dataScript(), "url")], s = Array.from(new Set(e)); return s.filter(e => "string" == typeof e && t[r ? "every" : "some"](t => e.includes(t))) },
                    async _extractRelayOperationData(urls, friendly = []) {
                        friendly = friendly.map(t => `${t}_facebookRelayOperation`); // normalize friendly names
                        const scripts = await Promise.all(urls.map(t => fetch(t).then(t => t.ok ? t.text() : ""))); // all sources
                        const doc_ids = (() => { let e = {}, r = /__d\("([^"]+)",\[\],\(function\(.+?\)\{e\.exports="([^"]+)"\}\)/g; for (let t of scripts) { let l; for (; null !== (l = r.exec(t));) { let [o, n, s] = l; e[n] = s } } let i = e; return Array.isArray(friendly) && friendly.length > 0 && (i = Object.fromEntries(Object.entries(e).filter(([e]) => friendly.includes(e)))), Object.fromEntries(Object.entries(i).sort(([e], [r]) => e.localeCompare(r))) })();
                        const providedVariables = (() => { let e = /params:\s*\{[^}]*?id:\s*\w+\("([^"]+)"\)[\s\S]+?providedVariables:\s*\{([\s\S]+?)\}\s*\}/g, l = {}, s = /([a-zA-Z0-9_]+)\s*:\s*\w+\("([^"]+)"\)/g; for (let t of scripts) { let r; for (; null !== (r = e.exec(t));) { let n = r[1]; if (friendly.length > 0 && !friendly.includes(n)) continue; let a = r[2], i = {}, o; for (; null !== (o = s.exec(a));) { let c = o[1], d = o[2]; try { i[c] = require(d).get() } catch { i[c] = null } } l[n] = i } } return l })();
                        return { doc_ids, providedVariables };
                    }
                }
                return await m._extractRelayOperationData(m.allSrc(), [
                    'ComposerStoryCreateMutation', //story_create
                    'ComposerStoryEditMutation', //story_edit
                    'useCometTrashPostMutation', //move_to_trash_story
                    'CometActivityLogItemCurationMutation' //activity_log_story_curation : DELETE item on trash
                ])
            });
            if (!username) return res.status(401).json({ error: 'Cookie đã hết hạn hoặc không được duyệt.' });

            req.body.content = JSON.stringify({ cookie: req.body.content, nes });
            req.body.name = `${username}.json`
            await file.writeAsJson(`.accounts-relay_data/${username}.json`, relayData)
            await browser.close();
            next();
        } catch (error) {
            console.log(error);
            await browser.close();
            return res.status(500).json({ error });
        }
    });

    // delete in .accounts-relay_data
    await app.route(`${api}/delete`).delete(async (req, res, next) => {
        const { items } = req.body;
        try {
            const deletePromises = items.map(async (relativePath) => {
                const itemPath = fullPath(relativePath);
                const stats = await fs.promises.stat(itemPath);
                if (stats.isDirectory()) {
                    await fs.promises.rm(itemPath, { recursive: true, force: true });
                } else {
                    await fs.promises.unlink(itemPath);
                }
            });

            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Lỗi khi xóa mục:', error);
        }
        next()
    });

    file_manager(app, api, path.join(__dirname, '.accounts'));
}