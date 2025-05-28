# Litmus Agent

An AI-powered browser automation agent that uses LLM (Language Learning Model) to analyze web pages and perform actions using Playwright.

## Features

- Executes browser actions based on LLM analysis
- Supports actions like clicking, typing, scrolling, and hovering
- Built with TypeScript and Playwright

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd litmus-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your-api-key-here
```

## Usage

1. Build the project:
```bash
npm run build
```

2. Run the example:
```bash
npm start
```

## Example Code

```typescript
import { LitmusAgent } from './LitmusAgent';

async function main() {
  const agent = new LitmusAgent();
  
  try {
    await agent.initialize();
    
    // Execute a task
    const action = await agent.executeTask(
      'https://www.google.com',
      'Find the search box and type "Hello World"'
    );
    
    console.log('Executed action:', action);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await agent.close();
  }
}

main();
```

## Project Structure

- `src/LitmusAgent.ts` - Main agent class that orchestrates LLM and browser interactions
- `src/LLMOrchestrator.ts` - Handles LLM interactions and action generation
- `src/BrowserConnector.ts` - Manages browser automation using Playwright
- `src/index.ts` - Example usage

## License

MIT 