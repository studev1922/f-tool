import os from 'node:os'
import path from 'node:path';
import { exec } from 'child_process';
import { fileURLToPath } from 'node:url'
import { drive, code, file, menu, util } from './src/modules/index.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import server from './src/server/server.js';

console.log("STATING..."); (async _ => {
    //TODO
    const mnu = {
        server: async _ => {
            async function openURL(url) {
                exec(`start "" "${url}"`, (error) => {
                    if (error) {
                        console.error('Lỗi khi mở URL:', error);
                    } else {
                        console.log(`Đã mở URL: ${url}`);
                    }
                });
            }

            const port = 1922
            await server(__dirname, port);
            let ipAddress = null, networkInterfaces = os.networkInterfaces();
            // Lấy địa chỉ IPv4 của máy chủ
            for (const ifName in networkInterfaces) {
                const interfaces = networkInterfaces[ifName];
                for (const interfaceInfo of interfaces) {
                    if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
                        ipAddress = interfaceInfo.address;
                        break;
                    }
                }
                if (ipAddress) break;
            }

            if (ipAddress) await openURL(`http://${ipAddress}:${port}`);
        }
    }


    menu.internalization([
        ['exit', null],
        ['Start server', mnu.server],
    ], false)
})()
