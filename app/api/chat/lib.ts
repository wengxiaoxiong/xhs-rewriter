// const apiKey = process.env.TIKHUB_API_KEY

import { tool } from "ai";
import { z } from "zod";

export const tavilySearchTool = tool({
    description: "使用Tavily搜索工具，搜索互联网上的信息。返回包含标题、URL、内容摘要和相关性评分的搜索结果。",
    parameters: z.object({
        query: z.string().describe("需要搜索的查询内容"),
        max_results: z.number().optional().default(20).describe("最大搜索结果数量，默认为20"),
        include_domains: z.array(z.string()).optional().describe("指定包含的域名列表"),
        time_range: z.enum(['day', 'week', 'month', 'year']).optional().describe("搜索时间范围，可选值：day, week, month, year").default('year'),
    }),
    execute: async (params) => {
        const { query, max_results, include_domains, time_range } = params;

        try {
            // 检查 API Key
            if (!process.env.TAVILY_API_KEY) {
                throw new Error('TAVILY_API_KEY 环境变量未设置');
            }

            const requestBody = {
                query,
                max_results,
                include_domains,
                time_range,

            };


            // 定义搜索结果的类型
            interface TavilySearchResult {
                title: string;
                url: string;
                content: string;
                score: number;
            }

            // 获取代理 fetch

            // 添加超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => '无法读取错误响应');
                throw new Error(`Tavily API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as { query: string; results?: TavilySearchResult[]; response_time?: number;[key: string]: unknown };


            // 返回格式化的搜索结果
            return {
                query: data.query,
                results: data.results?.map((result: TavilySearchResult) => ({
                    title: result.title,
                    url: result.url,
                    content: result.content,
                    score: result.score,
                })) || [],
                response_time: data.response_time,
                total_results: data.results?.length || 0,
            };
        } catch (error) {
            // 更详细的错误日志
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('搜索超时，请稍后重试');
            }



            throw new Error(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    },
});