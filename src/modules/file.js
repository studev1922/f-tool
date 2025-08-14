import fs from 'node:fs';
import path from 'node:path';

const file = {
    /**
     * Reads the content of a file.
     * @param {...string} filePath - The path to the file.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @returns {Promise<string | null>} - The file content, or null on error.
     */
    async readFile(filePaths, encoding = 'utf-8') {
        const pathsToTry = Array.isArray(filePaths) ? filePaths : [filePaths];
        for (const filePath of pathsToTry) {
            try {
                const content = await fs.promises.readFile(filePath, { encoding });
                return content;
            } catch (error) {
                console.warn(`Cannot read file '${filePath}': ${error.message}`);
            }
        }
        // Nếu vòng lặp hoàn thành mà không trả về nội dung, nghĩa là không đọc được tệp nào
        const errorMessage = pathsToTry.length > 1
            ? `Cannot read any file from: ${pathsToTry.join(', ')}`
            : `Files doesn't exist: ${pathsToTry[0]}`;
        throw new Error(errorMessage);
    },
    /**
     * Writes data to a file.
     * @param {string} filePath - The path to the file.
     * @param {string} data - The data to write.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @returns {Promise<boolean>} - True on success, false on error.
     */
    async writeFile(filePath, data, encoding = 'utf-8') {
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, data, { encoding });
            return true;
        } catch (error) {
            throw new Error(`Error writing to file '${filePath}': ${error.message}`);
        }
    },

    /**
     * Reads and parses JSON data from a file.
     * @param {string} filePath - The path to the file.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @returns {Promise<any | null>} - The parsed JSON data, or null on error.
     */
    async readAsJson(filePath, encoding = 'utf-8') {
        try {
            const data = await fs.promises.readFile(filePath, { encoding });
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Error reading or parsing JSON from '${filePath}': ${error.message}`);
        }
    },
    async readJsonOr(filePath, Or) {
        try {
            return await file.readAsJson(filePath)
        } catch (error) {
            // console.log(error);
            return Or || {}
        }
    },

    /**
     * Writes JSON data to a file.
     * @param {string} filePath - The path to the file.
     * @param {any} data - The JSON data to write.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @param {number} indent - The indentation level (default: 4).
     * @param {boolean} ensureAscii - Whether to ensure ASCII characters (default: false).
     * @returns {Promise<boolean>} - True on success, false on error.
     */
    async writeAsJson(filePath, data, encoding = 'utf-8', indent = 4, ensureAscii = false) {
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            const jsonData = JSON.stringify(data, null, indent);
            await fs.promises.writeFile(filePath, jsonData, { encoding });
            return true;
        } catch (error) {
            throw new Error(`Error writing JSON to '${filePath}': ${error.message}`);
        }
    },

    /**
     * Reads image file paths from a directory.
     * @param {string} dirPath - The path to the directory.
     * @returns {string[]} - An array of image file paths.
     */
    readImages(dirPath) {
        const images = [];
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
        try {
            const filenames = fs.readdirSync(dirPath);
            for (const filename of filenames) {
                if (extensions.some(ext => filename.toLowerCase().endsWith(ext))) {
                    images.push(path.join(dirPath, filename));
                }
            }
        } catch (error) {
            console.error(`Error reading images from directory '${dirPath}': ${error.message}`);
            return [];
        }
        return images;
    },
}
export default file;