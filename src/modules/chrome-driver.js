
import { Builder, Browser, until, By, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const driver = {
    /**
     * @param {boolean} isHeadLess 
     * @returns {WebDriver}
     */
    async getDriver(user_data_dir, isHeadLess) {
        const options = new chrome.Options();
        if (isHeadLess) options.addArguments("--headless=new");
        if (user_data_dir) options.addArguments(`user-data-dir=${user_data_dir}`);
        options.excludeSwitches(['enable-logging']);
        return await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build();
    },
    async untilNot(parent, selector, timeout = 10) {
        try {
            await parent.wait(until.stalenessOf(parent.findElement(By.css(selector))), timeout * 1000);
            console.log(`${selector} element closed.`);
            return true;
        } catch (e) {
            console.log(`${selector} not found within ${timeout} seconds. Error: ${e}`);
            return false;
        }
    },
    async until(parent, selector, timeout = 10) {
        try {
            const element = await parent.wait(until.elementLocated(By.css(selector)), timeout * 1000);
            console.log(`${selector} element loaded.`);
            return element;
        } catch (e) {
            console.log(`${selector} not found within ${timeout} seconds. Error: ${e}`);
            return false;
        }
    },
    async untils(parent, selector, timeout = 10) {
        try {
            const elements = await parent.wait(until.elementsLocated(By.css(selector)), timeout * 1000);
            console.log(`${selector} elements loaded.`);
            return elements;
        } catch (e) {
            console.log(`${selector} not found within ${timeout} seconds. Error: ${e}`);
            return false;
        }
    }
}


export default driver;