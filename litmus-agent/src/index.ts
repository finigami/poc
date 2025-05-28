import { LitmusAgent } from './LitmusAgent';

async function main() {
  const agent = new LitmusAgent();
  
  try {
    await agent.initialize();
    
    // Example task: Go to Google and type something in the search box
    const action = await agent.executeTask(
      'https://www.wikipedia.org',
      'Find the search box and type "Roman Empire"'
    );
    
    console.log('Executed action:', action);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await agent.close();
  }
}

main(); 