import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";

// Define the browser action schema
const BrowserActionSchema = z.object({
  action: z.enum(["click", "type", "scroll", "hover"]),
  selector: z.string(),
  value: z.string().optional(),
});

type BrowserAction = z.infer<typeof BrowserActionSchema>;

// Create a custom tool for browser actions
class BrowserActionTool extends StructuredTool {
  name = "browser_action";
  description = "Execute a browser action like click, type, scroll, or hover";
  schema = BrowserActionSchema;

  async _call(input: BrowserAction): Promise<string> {
    // This is just a placeholder - the actual execution happens in BrowserConnector
    return JSON.stringify(input);
  }
}

export class LLMOrchestrator {
  private llm: ChatOpenAI;
  private browserActionTool: BrowserActionTool;

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
      openAIApiKey: apiKey,
    });

    this.browserActionTool = new BrowserActionTool();
  }

  async analyzeScreenshotAndGetAction(
    screenshotBase64: string,
    prompt: string
  ): Promise<BrowserAction> {
    console.log('Sending screenshot to LLM...');
    console.log(`Screenshot size: ${screenshotBase64.length} characters`);
    console.log(`First 100 characters of base64: ${screenshotBase64.substring(0, 100)}...`);

    const messages = [
      new SystemMessage(
        "You are an AI assistant that analyzes screenshots and determines the next browser action to take. " +
        "You must use the browser_action tool to specify your action."
      ),
      new HumanMessage({
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

    const action = JSON.parse(toolCall.function.arguments) as BrowserAction;
    console.log('Parsed action:', action);
    return action;
  }
} 