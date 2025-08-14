import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
const rl = createInterface({ input, output });

const menu = {
    std: {
        _close: () => rl.close(),
        COLORS: {
            // Text colors
            reset: "\x1b[0m",
            bold: "\x1b[1m",
            dim: "\x1b[2m",
            italic: "\x1b[3m",
            underline: "\x1b[4m",
            inverse: "\x1b[7m",
            hidden: "\x1b[8m",
            strikethrough: "\x1b[9m",

            black: "\x1b[30m",
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            magenta: "\x1b[35m",
            cyan: "\x1b[36m",
            white: "\x1b[37m",
            gray: "\x1b[90m",

            // Background colors
            bgBlack: "\x1b[40m",
            bgRed: "\x1b[41m",
            bgGreen: "\x1b[42m",
            bgYellow: "\x1b[43m",
            bgBlue: "\x1b[44m",
            bgMagenta: "\x1b[45m",
            bgCyan: "\x1b[46m",
            bgWhite: "\x1b[47m",
            bgGray: "\x1b[100m",
        },
        text: (txt, ...styles) => `${styles.join('')}${txt}${menu.std.COLORS.reset}\r`,
        input(e = ">> ") { return new Promise(t => { rl.question(menu.std.text(e, menu.std.COLORS.bgBlue), e => { t(e) }) }) },
        confirm(e) { return new Promise(t => { process.stdin.setRawMode(!0), process.stdin.resume(), process.stdout.write(menu.std.text(`[?]: ${e} (y/n)`, menu.std.COLORS.green)); let r = e => { let r = e.toString(); "y" === r || "\r" === r ? (s(), t(!0)) : ("n" === r || "\x1b" === r) && (s(), t(!1)) }, s = () => { process.stdin.setRawMode(!1), process.stdin.pause(), process.stdin.removeListener("data", r), process.stdout.write("\n") }; process.stdin.on("data", r) }) },
        info(e) { console.log(menu.std.text(`\r[?]: ${e}`, menu.std.COLORS.cyan)) },
        alert(e) { console.log(menu.std.text(`\r[o]: ${e}`, menu.std.COLORS.yellow)) },
        error(e) { console.error(menu.std.text(`\r[!]: ${e}`, menu.std.COLORS.red)) },
    },
    async text_cdown(t, e = 15e3, $ = 1e3) { $ <= 0 && (console.warn("Interval must be a positive number. Setting to default 1000ms."), $ = 1e3); let o = Math.floor(e / $); if (0 === o) { process.stdout.write(menu.std.text(`\r${t} (0)`, menu.std.COLORS.yellow, menu.std.COLORS.bold)), process.stdout.write("\r"); return } let d = Date.now(); for (let l = o; l >= 0 && (process.stdout.write(menu.std.text(`\r${t} (${l})`, menu.std.COLORS.yellow, menu.std.COLORS.bold)), 0 !== l); l--) { let n = d + (o - l + 1) * $, r = Date.now(), s = Math.max(0, n - r); await new Promise(t => setTimeout(t, s)) } process.stdout.clearLine("\n") },
    /**
     * Displays a menu and handles user input.
     * @param {Array<[string, Function | null]>} menuItems - An array of menu items,
     * where each item is a tuple/array containing the item text and its corresponding
     * function (or null for exit).
     * @returns {[string, Function | null] | null} - The selected menu item (text and function),
     * or null if the user chooses to exit.
     */
    _createMenu(menuItems) {
        const maxLength = Math.max(...menuItems.map(item => item[0].length));
        const width = maxLength + 6;

        console.log(`+${'-'.repeat(width)}+`);
        menuItems.forEach((item, i) => {
            console.log(`| ${i + 1}: ${item[0].padEnd(maxLength)} |`);
        });
        console.log(`+${'-'.repeat(width)}+`);

        return new Promise((resolve) => {
            const getChoice = () => { // Declare a recursive function.
                rl.question('Chọn chức năng (nhập số): ', (choice) => {
                    const numChoice = Number(choice); // Convert input to a Number.
                    if (Number.isNaN(numChoice)) {
                        console.log(`Không có ${choice}, thử lại.`);
                        getChoice(); // Use recursion to repeat the question.
                    } else if (numChoice >= 1 && numChoice <= menuItems.length) {
                        resolve(menuItems[numChoice - 1]);
                        // rl.close(); // Resolve instead of close, caller handles closing.
                    } else {
                        console.log(`Không có ${choice}, thử lại.`);
                        getChoice(); // Use recursion to repeat the question.
                    }
                });
            };
            getChoice(); // Start the recursive function.
        });
    },

    /**
     * Displays a menu, executes the selected function, and handles program flow.
     * @param {Array<[string, Function | null]>} menuItems - An array of menu items.
     * @param {boolean} isClear - Whether to clear the console before displaying the menu.
     * (default: true).
     */
    async internalization(menuItems, isClear = true) {
        while (true) {
            const select = await menu._createMenu(menuItems);
            if (select === null || select[1] === null) {
                return;
            } else if (typeof select[1] === 'function') {
                console.log(menu.std.text(select[0], menu.std.COLORS.bold, menu.std.COLORS.cyan));
                await select[1]();
            }
            if (isClear) console.clear();
        }
    },
};


export default menu;