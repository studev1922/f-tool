import path from 'node:path';
import { fileURLToPath } from 'url'
import server from './src/server/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
console.log("TEST..."); await (async _ => {
    await server(__dirname)
})();