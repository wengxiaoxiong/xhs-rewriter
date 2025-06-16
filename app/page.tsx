/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, addToolResult, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5, // 启用多步工具调用
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">AI 聊天助手</h1>
            <p className="text-blue-100 mt-1">支持工具调用的智能对话</p>
          </div>

          {/* Messages Container */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-4xl mb-4">💬</div>
                <p>开始你的对话吧！试试问天气或其他问题</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? '👤 用户' : '🤖 AI'}
                      </span>
                    </div>
                    
                    {/* 根据官方文档处理 message.parts */}
                    {message.parts?.map((part: any, index: number) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <div key={index} className="prose prose-sm max-w-none">
                              <p className="whitespace-pre-wrap">{part.text}</p>
                            </div>
                          );

                        case 'step-start':
                          // 显示步骤分隔线
                          return index > 0 ? (
                            <div key={index} className="text-gray-500 my-2">
                              <hr className="border-gray-300" />
                              <p className="text-xs text-center mt-1">步骤 {index}</p>
                            </div>
                          ) : null;

                        case 'tool-invocation':
                          const toolInvocation = part.toolInvocation;
                          const callId = toolInvocation.toolCallId;

                          // 根据不同工具和状态渲染不同内容
                          switch (toolInvocation.toolName) {
                            case 'askForConfirmation':
                              switch (toolInvocation.state) {
                                case 'call':
                                  return (
                                    <div key={callId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-yellow-600">❓</span>
                                        <span className="font-medium text-yellow-800">需要确认</span>
                                      </div>
                                      <p className="mb-3">{toolInvocation.args.message}</p>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            addToolResult({
                                              toolCallId: callId,
                                              result: 'Yes, confirmed.',
                                            })
                                          }
                                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                          确认
                                        </button>
                                        <button
                                          onClick={() =>
                                            addToolResult({
                                              toolCallId: callId,
                                              result: 'No, denied',
                                            })
                                          }
                                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                          拒绝
                                        </button>
                                      </div>
                                    </div>
                                  );
                                case 'result':
                                  return (
                                    <div key={callId} className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-600">✅</span>
                                        <span className="font-medium text-green-800">
                                          用户选择: {toolInvocation.result}
                                        </span>
                                      </div>
                                    </div>
                                  );
                              }
                              break;

                            case 'getLocation':
                              switch (toolInvocation.state) {
                                case 'call':
                                  return (
                                    <div key={callId} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-600">📍</span>
                                        <span className="font-medium text-blue-800">正在获取位置...</span>
                                      </div>
                                    </div>
                                  );
                                case 'result':
                                  return (
                                    <div key={callId} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-600">📍</span>
                                        <span className="font-medium text-blue-800">
                                          位置: {toolInvocation.result}
                                        </span>
                                      </div>
                                    </div>
                                  );
                              }
                              break;

                            case 'getWeatherInformation':
                              switch (toolInvocation.state) {
                                case 'partial-call':
                                  return (
                                    <div key={callId} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">⏳</span>
                                        <span className="font-medium text-gray-800">正在调用天气工具...</span>
                                      </div>
                                      <pre className="bg-gray-100 rounded p-2 mt-2 text-xs overflow-x-auto">
                                        {JSON.stringify(toolInvocation, null, 2)}
                                      </pre>
                                    </div>
                                  );
                                case 'call':
                                  return (
                                    <div key={callId} className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-amber-600">🌤️</span>
                                        <span className="font-medium text-amber-800">
                                          正在获取 {toolInvocation.args.city} 的天气信息...
                                        </span>
                                      </div>
                                    </div>
                                  );
                                case 'result':
                                  return (
                                    <div key={callId} className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-600">☀️</span>
                                        <span className="font-medium text-green-800">
                                          {toolInvocation.args.city} 的天气: {toolInvocation.result}
                                        </span>
                                      </div>
                                    </div>
                                  );
                              }
                              break;

                            default:
                              // 处理其他工具
                              return (
                                <div key={callId} className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-purple-600">🛠️</span>
                                    <span className="font-medium text-purple-800">
                                      工具: {toolInvocation.toolName}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <p><strong>状态:</strong> {toolInvocation.state}</p>
                                    {toolInvocation.args && (
                                      <p><strong>参数:</strong> {JSON.stringify(toolInvocation.args)}</p>
                                    )}
                                    {toolInvocation.result && (
                                      <p><strong>结果:</strong> {JSON.stringify(toolInvocation.result)}</p>
                                    )}
                                  </div>
                                </div>
                              );
                          }
                          break;

                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-gray-500 text-sm">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="bg-white border-t border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                name="prompt"
                value={input}
                onChange={handleInputChange}
                placeholder="试试问：北京天气怎么样？"
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    发送中...
                  </>
                ) : (
                  <>
                    <span>发送</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}