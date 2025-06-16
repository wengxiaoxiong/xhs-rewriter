import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { tavilySearchTool } from './lib';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const deepseek = createOpenAI(

    {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL,
    }
  )

  // agent逻辑
  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: '你是一个小红书创作协作者，你可以对你不了解的知识，使用tavilySearchTool工具进行搜索。',
    messages,
    tools:{
      tavilySearchTool:tavilySearchTool
    }
  });

  return result.toDataStreamResponse();
}