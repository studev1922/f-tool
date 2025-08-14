// npm i mime multer
import crypto from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime';
import multer from 'multer';

export default (app, api = '/api', dataDir) => {
    const upload = multer({ storage: multer.diskStorage({ async destination(a, i, e) { try { await fs.promises.mkdir(dataDir, { recursive: !0 }), e(null, dataDir) } catch (n) { e(n) } }, filename(a, i, e) { e(null, i.originalname) } }) });
    const fullPath = (e = "") => { let l = path.normalize(e).replace(/^(\.\.(\/|\\|$))+/, ""); return path.join(dataDir, l) };

    app.post(`${api}/upload`, upload.single('file'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có tệp nào được tải lên.' });
        }

        const relativePath = req.body.relativePath || '';
        const destDir = fullPath(relativePath);
        const destPath = path.join(destDir, req.file.originalname);

        try {
            await fs.promises.mkdir(destDir, { recursive: true });
            await fs.promises.rename(req.file.path, destPath);
            res.json({ message: `Tệp '${req.file.originalname}' đã được tải lên thành công.` });
        } catch (err) {
            console.error('Lỗi khi xử lý file tải lên:', err);
            res.status(500).json({ error: 'Không thể xử lý file tải lên.' });
        }
    });

    app.get(`${api}/list`, async (req, res) => {
        const relativePath = req.query.path || '';
        const targetPath = fullPath(relativePath);
        
        try {
            await fs.promises.mkdir(targetPath, { recursive: true });
            const items = await fs.promises.readdir(targetPath, { withFileTypes: true });
            const response = items.map(item => ({
                name: item.name,
                type: item.isDirectory() ? 'folder' : 'file',
                path: path.join(relativePath, item.name).replace(/\\/g, '/')
            }));
            res.json(response);
        } catch (error) {
            console.error('Lỗi khi liệt kê thư mục:', error);
            res.status(500).json({ error: 'Không thể truy cập thư mục.' });
        }
    });

    app.get(`${api}/view`, (req, res) => {
        try {
            const filePath = fullPath(decodeURIComponent(req.query.path)); // Tự xử lý full path theo project bạn

            if (!fs.existsSync(filePath)) {
                return res.status(404).send('File not found');
            }

            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            const contentType = mime.getType(filePath) || 'application/octet-stream';

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                if (start >= fileSize || end >= fileSize) {
                    return res.status(416).send('Requested range not satisfiable');
                }

                const chunkSize = (end - start) + 1;
                const fileStream = fs.createReadStream(filePath, { start, end });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': contentType,
                });

                fileStream.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': contentType,
                });

                fs.createReadStream(filePath).pipe(res);
            }
        } catch (err) {
            console.error('Error in /api/view:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    app.post(`${api}/save`, async (req, res) => {
        const { path, content } = req.body;
        try {
            const filePath = fullPath(path);
            await fs.promises.writeFile(filePath, content, 'utf-8');
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Không thể lưu tệp.' });
        }
    });

    app.post(`${api}/create/file`, async (req, res) => {
        let { name, path: relativePath, content = '' } = req.body;
        const dirPath = fullPath(relativePath);

        try {
            // Tạo thư mục cha nếu chưa tồn tại
            await fs.promises.mkdir(dirPath, { recursive: true });

            // Nếu không có name → random tên file không trùng
            if (!name) {
                let randomName;
                let exists = true;

                do {
                    randomName = `file-${crypto.randomBytes(4).toString('hex')}.txt`;
                    const filePath = path.join(dirPath, randomName);
                    exists = await fs.promises
                        .access(filePath)
                        .then(() => true)
                        .catch(() => false);
                } while (exists);

                name = randomName;
            }

            const newFilePath = path.join(dirPath, name);

            // Tạo file (chỉ khi chưa tồn tại)
            await fs.promises.writeFile(newFilePath, content, { flag: 'w' });

            res.json({ message: 'File đã được tạo thành công.', fileName: name });
        } catch (error) {
            console.error('Lỗi khi tạo file:', error);
            if (error.code === 'EEXIST') {
                res.status(400).json({ error: 'File đã tồn tại.' });
            } else {
                res.status(500).json({ error: 'Không thể tạo file.' });
            }
        }
    });

    app.post(`${api}/create/folder`, async (req, res) => {
        const { name, path: relativePath } = req.body;
        const newFolderPath = fullPath(path.join(relativePath, name));

        try {
            await fs.promises.mkdir(newFolderPath, { recursive: true });
            res.json({ message: 'Thư mục đã được tạo thành công.' });
        } catch (error) {
            console.error('Lỗi khi tạo thư mục:', error);
            res.status(500).json({ error: 'Không thể tạo thư mục.' });
        }
    });

    app.delete(`${api}/delete`, async (req, res) => {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Vui lòng chọn các mục để xóa.' });
        }

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
            res.json({ message: 'Các mục đã được xóa thành công.' });
        } catch (error) {
            console.error('Lỗi khi xóa mục:', error);
            res.status(500).json({ error: 'Không thể xóa một hoặc nhiều mục.' });
        }
    });

    app.post(`${api}/rename`, async (req, res) => {
        const { oldPath, newName } = req.body;
        const oldFullPath = fullPath(oldPath);
        const newDir = path.dirname(oldFullPath);
        const newFullPath = path.join(newDir, newName);

        try {
            // Nếu đích tồn tại, xóa trước (ghi đè)
            if (fs.existsSync(newFullPath)) {
                const stats = await fs.promises.stat(newFullPath);
                if (stats.isDirectory()) {
                    await fs.promises.rm(newFullPath, { recursive: true, force: true });
                } else {
                    await fs.promises.unlink(newFullPath);
                }
            }

            // Đổi tên (rename)
            await fs.promises.rename(oldFullPath, newFullPath);

            res.json({ message: 'Đã đổi tên thành công (ghi đè nếu cần).' });
        } catch (error) {
            console.error('Lỗi khi đổi tên:', error);
            res.status(500).json({ error: 'Không thể đổi tên. Có thể tệp đang mở hoặc lỗi hệ thống.' });
        }
    });

    app.post(`${api}/move`, async (req, res) => {
        const { oldPath, newPath } = req.body;
        const oldFullPath = fullPath(oldPath);
        const newFullPath = fullPath(newPath);

        try {
            await fs.promises.rename(oldFullPath, newFullPath);
            res.json({ message: 'Đã di chuyển thành công.' });
        } catch (error) {
            console.error('Lỗi khi di chuyển:', error);
            res.status(500).json({ error: 'Không thể di chuyển.' });
        }
    });
}