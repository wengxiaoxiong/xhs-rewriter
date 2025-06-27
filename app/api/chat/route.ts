import { createOpenAI } from '@ai-sdk/openai';
import { hasToolCall, streamText } from 'ai';
import { SearchTool } from './lib';

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
    system: `你是一名小红书内容创作者，请使用轻松诙谐的语气、适当使用网络用语，写出受欢迎的帖子
  `,
    stopWhen: hasToolCall('SearchTool'),
    messages,
    tools:{
      SearchTool:SearchTool,
    }
  });

  return result.toTextStreamResponse();
}