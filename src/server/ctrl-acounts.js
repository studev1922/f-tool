import axios from 'axios'
import path from 'node:path';
import file_manager from './file_api.js';

export default async (app, __dirname) => {
    const api = '/ctrl-cookie';
    await app.route(`${api}/create/file`).post(async (req, res, next) => {
        let match = await axios.get('https://www.facebook.com/me/', {
            headers: { accept: '*/*', 'cookie': req.body.content },
        }).then(async result => {
            let html = result.data;
            
            // nes data
            const __eqmc = html.match(/<script id="__eqmc"[^>]*>([\s\S]*?)<\/script>/)[1].trim()
            const nes = (() => { try { let t = JSON.parse(__eqmc); if (!t?.u) return { fb_dtsg: t.f }; let e = t.u.substring(10).split("&").map(t => t.split("=")); e.push(["fb_dtsg", t.f]); let r = Object.fromEntries(e); return delete r.jazoest, r } catch { return {} } })();
            req.body.content = JSON.stringify({cookie:req.body.content,nes});
            
            // filename
            const username = html.match(/"userVanity":"(.*?)"/)[1].trim()
            req.body.name = `${username}.json`
            return username
        }).catch(console.error);
        if (!match) return res.status(401).json({ error: 'Cookie đã hết hạn hoặc không được duyệt.' });
        next();
    });


    file_manager(app, api, path.join(__dirname, '.accounts'));
}