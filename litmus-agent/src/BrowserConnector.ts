import { Browser, BrowserContext, Page } from 'playwright';

export type BrowserAction = {
  action: 'click' | 'type' | 'scroll' | 'hover';
  selector: string;
  value?: string;
};

export class BrowserConnector {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  async initialize() {
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({ 
      headless: false
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    
    // Enable detailed logging
    this.page.on('console', msg => console.log('Browser Console:', msg.text()));
    this.page.on('pageerror', error => console.error('Browser Error:', error));
  }

  async navigate(url: string) {
    if (!this.page) throw new Error('Browser not initialized');
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

  private async waitForElement(selector: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${this.MAX_RETRIES} to find element: ${selector}`);
        
        // Wait for the page to be ready
        await this.page.waitForLoadState('domcontentloaded');
        

        let elementFound = false;
    // Wait till page loads and selector is visible
          try {
            const exists = await this.page.$(selector);
            if (exists) {
              console.log(`Found element with selector: ${selector}`);     
              elementFound = true;
              break;
            }
          } catch (e) {
            console.log(`Selector ${selector} not found`);
          }
   

        if (!elementFound) {
          throw new Error(`No matching elements found for any selector variation`);
        }

        // Wait for the element to be visible using the found selector
        await this.page.waitForSelector(selector, {
          state: 'visible',
          timeout: this.DEFAULT_TIMEOUT
        });

        console.log(`Element ${selector} found and visible`);
        return;
      } catch (error) {
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

  async executeAction(action: BrowserAction) {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`Executing action: ${action.action} on selector: ${action.selector}`);
    
    try {
      // Wait for the element to be visible before performing any action
      await this.waitForElement(action.selector);

      // Get the actual selector that was found
      

      let selector = action.selector;
      

      switch (action.action) {
        case 'click':
          console.log(`Clicking element: ${selector}`);
          await this.page.click(selector, { 
            timeout: this.DEFAULT_TIMEOUT,
            force: true // Force click even if element is covered
          });
          break;
        case 'type':
          if (!action.value) throw new Error('Value required for type action');
          console.log(`Typing "${action.value}" into element: ${selector}`);
          await this.page.fill(selector, action.value, { 
            timeout: this.DEFAULT_TIMEOUT,
            force: true // Force type even if element is covered
          });
          break;
        case 'scroll':
          console.log(`Scrolling to element: ${selector}`);
          await this.page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, selector);
          break;
        case 'hover':
          console.log(`Hovering over element: ${selector}`);
          await this.page.hover(selector, { 
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
    } catch (error) {
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