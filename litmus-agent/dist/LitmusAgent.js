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
exports.LitmusAgent = void 0;
const LLMOrchestrator_1 = require("./LLMOrchestrator");
const BrowserConnector_1 = require("./BrowserConnector");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv.config();
class LitmusAgent {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.llmOrchestrator = new LLMOrchestrator_1.LLMOrchestrator(apiKey);
        this.browserConnector = new BrowserConnector_1.BrowserConnector();
    }
    async initialize() {
        await this.browserConnector.initialize();
    }
    async executeTask(url, prompt) {
        try {
            // Navigate to the URL
            await this.browserConnector.navigate(url);
            // Read the static screenshot
            const screenshotPath = path.join(__dirname, 'screenshots', 'example.png');
            console.log('Reading screenshot from:', screenshotPath);
            if (!fs.existsSync(screenshotPath)) {
                throw new Error(`Screenshot file not found at ${screenshotPath}`);
            }
            const screenshotBuffer = fs.readFileSync(screenshotPath);
            console.log('Screenshot file size:', screenshotBuffer.length, 'bytes');
            const screenshotBase64 = screenshotBuffer.toString('base64');
            console.log('Screenshot base64 length:', screenshotBase64.length, 'characters');
            // Get action from LLM
            const action = await this.llmOrchestrator.analyzeScreenshotAndGetAction(screenshotBase64, prompt);
            // Execute the action
            await this.browserConnector.executeAction(action);
            return action;
        }
        catch (error) {
            console.error('Error executing task:', error);
            throw error;
        }
    }
    async close() {
        await this.browserConnector.close();
    }
}
exports.LitmusAgent = LitmusAgent;
