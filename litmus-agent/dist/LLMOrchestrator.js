"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMOrchestrator = void 0;
const openai_1 = require("@langchain/openai");
const schema_1 = require("langchain/schema");
const tools_1 = require("langchain/tools");
const zod_1 = require("zod");
// Define the browser action schema
const BrowserActionSchema = zod_1.z.object({
    action: zod_1.z.enum(["click", "type", "scroll", "hover"]),
    selector: zod_1.z.string(),
    value: zod_1.z.string().optional(),
});
// Create a custom tool for browser actions
class BrowserActionTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "browser_action";
        this.description = "Execute a browser action like click, type, scroll, or hover";
        this.schema = BrowserActionSchema;
    }
    async _call(input) {
        // This is just a placeholder - the actual execution happens in BrowserConnector
        return JSON.stringify(input);
    }
}
class LLMOrchestrator {
    constructor(apiKey) {
        this.llm = new openai_1.ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0,
            openAIApiKey: apiKey,
        });
        this.browserActionTool = new BrowserActionTool();
    }
    async analyzeScreenshotAndGetAction(screenshotBase64, prompt) {
        console.log('Sending screenshot to LLM...');
        console.log(`Screenshot size: ${screenshotBase64.length} characters`);
        console.log(`First 100 characters of base64: ${screenshotBase64.substring(0, 100)}...`);
        const messages = [
            new schema_1.SystemMessage("You are an AI assistant that analyzes screenshots and determines the next browser action to take. " +
                "You must use the browser_action tool to specify your action."),
            new schema_1.HumanMessage({
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${screenshotBase64}`,
                        },
                    },
                ],
            }),
        ];
        console.log('Sending messages to LLM:', JSON.stringify(messages, null, 2));
        const response = await this.llm.invoke(messages, {
            tools: [this.browserActionTool],
            tool_choice: "auto",
        });
        console.log('Received response from LLM:', JSON.stringify(response, null, 2));
        // Parse the tool call response
        const toolCall = response.additional_kwargs.tool_calls?.[0];
        if (!toolCall) {
            throw new Error("No tool call found in LLM response");
        }
        const action = JSON.parse(toolCall.function.arguments);
        console.log('Parsed action:', action);
        return action;
    }
}
exports.LLMOrchestrator = LLMOrchestrator;
