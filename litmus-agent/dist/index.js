"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LitmusAgent_1 = require("./LitmusAgent");
async function main() {
    const agent = new LitmusAgent_1.LitmusAgent();
    try {
        await agent.initialize();
        // Example task: Go to Wikipedia and type something in the search box
        const action = await agent.executeTask('https://www.wikipedia.org', 'Find the search box and type "Roman Empire"');
        console.log('Executed action:', action);
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await agent.close();
    }
}
main();
