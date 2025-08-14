// npm i dotenv
import dotenv from 'dotenv';

const env = dotenv.config().parsed;
const txt = {
    /**
     * @param {String} t : text = "abc"
     * @param  {...String} e : text = 'a','b', => true
     * @returns {Boolean} 'a','b','d' => false
     */
    contains(t, ...e) { if ("string" != typeof t) return !1; for (let r of e) if ("string" != typeof r || !t.includes(r)) return !1; return !0 },
    /**
     * @param {String} t : text = 'chào'
     * @returns : text = 'ch\u00e0o'
     */
    encode(t) { let e = ""; for (let r = 0; r < t.length; r++) { let o = t.charCodeAt(r); o > 127 ? e += "\\u" + o.toString(16).padStart(4, "0") : e += t[r] } return e },
    /**
     * @param {String} t : text = 'ch\u00e0o'
     * @returns {String} : text = 'chào'
     */
    decode: t => t.replace(/\\u([\d\w]{4})/gi, function (_, i) { return String.fromCharCode(parseInt(i, 16)) })
}

const pathValue = {
    /**
     * @param {?object} e - Đối tượng cần tìm.
     * @param {string} t - Tên trường dữ liệu cần tìm
     * @returns {string[]} - Danh sách "đường dẫn" tới trường dữ liệu(fields).
     */
    key_path(o, t) { let n = []; return !function f(l, x) { if ("object" == typeof l && null !== l) { if (Array.isArray(l)) l.forEach((t, n) => { let l = [...x]; l.length > 0 ? l[l.length - 1] += `[${n}]` : l.push(`[${n}]`), f(t, l) }); else for (let i in l) i === t && n.push([...x, i].join(".")), f(l[i], [...x, i]) } }(o, []), n },
    /**
     * @param {?object} e - Đối tượng cần tìm.
     * @param {string} t - Tên trường dữ liệu cần tìm
     * @returns {string[]} - Danh sách "đường dẫn" tới giá trị(values).
     */
    val_path(o, t) { let n = []; return !function f(t, i, x) { if ("string" == typeof i && "string" == typeof t && t.includes(i) || t === i) { n.push(x.join(".")); return } if ("object" == typeof t && null !== t) { if (Array.isArray(t)) t.forEach((t, n) => { let r = [...x]; x.length > 0 ? r[r.length - 1] += `[${n}]` : r.push(`[${n}]`), f(t, i, r) }); else for (let r in t) f(t[r], i, [...x, r]) } }(o, t, []), n.map(o => o.startsWith("]") && 0 === o.indexOf("[") ? "[" + o : o) },
    /**
     * @param {?object} e - Đối tượng cần tìm.
     * @param {string} t - Tên trường dữ liệu cần tìm
     * @returns {*} - "giá trị" từ khóa trong object "e".
     */
    shortcut(e, t) { return function e(i) { if ("object" == typeof i && null !== i) { if (Array.isArray(i)) for (let r of i) { let f = e(r); if (void 0 !== f) return f } else { if (t in i) return i[t]; for (let n in i) { let o = e(i[n]); if (void 0 !== o) return o } } } }(e) },
    /**
     * @param {?object} e - Đối tượng cần tìm.
     * @param {string} t - Tên trường dữ liệu cần tìm
     * @returns {Array<any>} - "danh sách giá trị" từ khóa trong object "e".
     */
    shortcuts(e, t) { let f = []; return !function e(n) { if ("object" == typeof n && null !== n) { if (Array.isArray(n)) for (let i of n) e(i); else for (let l in t in n && f.push(n[t]), n) e(n[l]) } }(e), f }
}

export default { env, txt, path: pathValue }