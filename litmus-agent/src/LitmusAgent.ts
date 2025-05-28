import { LLMOrchestrator } from './LLMOrchestrator';
import { BrowserConnector, BrowserAction } from './BrowserConnector';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export class LitmusAgent {
  private llmOrchestrator: LLMOrchestrator;
  private browserConnector: BrowserConnector;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.llmOrchestrator = new LLMOrchestrator(apiKey);
    this.browserConnector = new BrowserConnector();
  }

  async initialize() {
    await this.browserConnector.initialize();
  }

  async executeTask(url: string, prompt: string) {
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
      const action = await this.llmOrchestrator.analyzeScreenshotAndGetAction(
        screenshotBase64,
        prompt
      );

      // Execute the action
      await this.browserConnector.executeAction(action);

      return action;
    } catch (error) {
      console.error('Error executing task:', error);
      throw error;
    }
  }

  async close() {
    await this.browserConnector.close();
  }
} 