"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserConnector = void 0;
class BrowserConnector {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.DEFAULT_TIMEOUT = 60000; // 60 seconds
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 2000; // 2 seconds
    }
    async initialize() {
        const { chromium } = await Promise.resolve().then(() => __importStar(require('playwright')));
        this.browser = await chromium.launch({
            headless: false
        });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
        // Enable detailed logging
        this.page.on('console', msg => console.log('Browser Console:', msg.text()));
        this.page.on('pageerror', error => console.error('Browser Error:', error));
    }
    async navigate(url) {
        if (!this.page)
            throw new Error('Browser not initialized');
        console.log(`Navigating to: ${url}`);
        // Navigate and wait for network to be idle
        await this.page.goto(url, {
            waitUntil: 'networkidle',
            timeout: this.DEFAULT_TIMEOUT
        });
        // Wait for the page to be fully loaded
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        console.log('Navigation complete');
    }
    async waitForElement(selector) {
        if (!this.page)
            throw new Error('Browser not initialized');
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${this.MAX_RETRIES} to find element: ${selector}`);
                // Wait for the page to be ready
                await this.page.waitForLoadState('domcontentloaded');
                // Try multiple selector variations
                const selectors = [
                    selector,
                    'textarea[name="q"]',
                    'input[type="text"]',
                    'input[aria-label="Search"]',
                    'input[title="Search"]'
                ];
                let foundSelector = selector;
                let elementFound = false;
                for (const sel of selectors) {
                    try {
                        const exists = await this.page.$(sel);
                        if (exists) {
                            console.log(`Found element with selector: ${sel}`);
                            foundSelector = sel;
                            elementFound = true;
                            break;
                        }
                    }
                    catch (e) {
                        console.log(`Selector ${sel} not found`);
                    }
                }
                if (!elementFound) {
                    throw new Error(`No matching elements found for any selector variation`);
                }
                // Wait for the element to be visible using the found selector
                await this.page.waitForSelector(foundSelector, {
                    state: 'visible',
                    timeout: this.DEFAULT_TIMEOUT
                });
                console.log(`Element ${foundSelector} found and visible`);
                return;
            }
            catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt === this.MAX_RETRIES) {
                    // On last attempt, take a screenshot for debugging
                    if (this.page) {
                        const screenshot = await this.page.screenshot({ path: 'error-screenshot.png' });
                        console.log('Error screenshot saved as error-screenshot.png');
                    }
                    throw new Error(`Failed to find element ${selector} after ${this.MAX_RETRIES} attempts`);
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
            }
        }
    }
    async executeAction(action) {
        if (!this.page)
            throw new Error('Browser not initialized');
        console.log(`Executing action: ${action.action} on selector: ${action.selector}`);
        try {
            // Wait for the element to be visible before performing any action
            await this.waitForElement(action.selector);
            // Get the actual selector that was found
            let foundSelector = action.selector;
            switch (action.action) {
                case 'click':
                    console.log(`Clicking element: ${foundSelector}`);
                    await this.page.click(foundSelector, {
                        timeout: this.DEFAULT_TIMEOUT,
                        force: true // Force click even if element is covered
                    });
                    break;
                case 'type':
                    if (!action.value)
                        throw new Error('Value required for type action');
                    console.log(`Typing "${action.value}" into element: ${foundSelector}`);
                    await this.page.fill(foundSelector, action.value, {
                        timeout: this.DEFAULT_TIMEOUT,
                        force: true // Force type even if element is covered
                    });
                    break;
                case 'scroll':
                    console.log(`Scrolling to element: ${foundSelector}`);
                    await this.page.evaluate((selector) => {
                        const element = document.querySelector(selector);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, foundSelector);
                    break;
                case 'hover':
                    console.log(`Hovering over element: ${foundSelector}`);
                    await this.page.hover(foundSelector, {
                        timeout: this.DEFAULT_TIMEOUT,
                        force: true // Force hover even if element is covered
                    });
                    break;
                default:
                    throw new Error(`Unknown action: ${action.action}`);
            }
            // Take a screenshot after the action is completed
            if (this.page) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const screenshotPath = `screenshots/action-${action.action}-${timestamp}.png`;
                await this.page.screenshot({
                    path: screenshotPath,
                    fullPage: true // Capture the entire page
                });
                console.log(`Screenshot saved to: ${screenshotPath}`);
            }
            console.log(`Successfully executed action: ${action.action}`);
        }
        catch (error) {
            console.error(`Error executing action ${action.action} on selector ${action.selector}:`, error);
            // Take a screenshot on error
            if (this.page) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const screenshotPath = `screenshots/error-${action.action}-${timestamp}.png`;
                await this.page.screenshot({
                    path: screenshotPath,
                    fullPage: true
                });
                console.log(`Error screenshot saved to: ${screenshotPath}`);
            }
            throw error;
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }
}
exports.BrowserConnector = BrowserConnector;
