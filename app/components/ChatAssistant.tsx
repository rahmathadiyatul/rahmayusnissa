'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        onFinish: (message) => {
            // When the AI replies after finishing a tool call (like add/edit/delete), refresh the page data
            if (message.toolInvocations?.length || message.content.length > 0) {
                router.refresh();
            }
        },
    });

    useEffect(() => {
        // Auto-scroll to bottom of chat
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-[var(--accent-gold-dark)] text-white p-4 rounded-full shadow-2xl hover:bg-[var(--accent-gold)] transition-transform hover:scale-105 z-50 flex items-center justify-center border-4 border-white"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.2)] flex items-center justify-center text-[var(--accent-gold-dark)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">AI Assistant</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span> Online
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-700 bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                >
                    &times;
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafafa]">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-8 px-4">
                        <p className="mb-2 text-xl">✨</p>
                        <p>Hi! I can help you manage your invitees. Try asking:</p>
                        <p className="mt-4 italic text-xs">"Add Akbar with phone 08111111111"</p>
                        <p className="mt-2 italic text-xs">"Search for Budi"</p>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Text Content */}
                        {m.content && (
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user'
                                ? 'bg-gray-900 text-white rounded-br-none'
                                : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none'
                                }`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 empty:hidden" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2 empty:hidden" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
                                        h1: ({ node, ...props }) => <h1 className="font-bold text-lg mb-2" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="font-bold text-base mb-2" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="font-semibold text-base mb-1" {...props} />,
                                        table: ({ node, ...props }) => <div className="w-full overflow-x-auto mb-2 rounded border border-gray-200"><table className="w-full text-left text-xs border-collapse" {...props} /></div>,
                                        thead: ({ node, ...props }) => <thead className="bg-gray-100/80 text-gray-700" {...props} />,
                                        th: ({ node, ...props }) => <th className="border-b border-gray-200 px-3 py-2 font-semibold" {...props} />,
                                        td: ({ node, ...props }) => <td className="border-b border-gray-200 px-3 py-2 last:border-b-0" {...props} />,
                                        tr: ({ node, ...props }) => <tr className="last:border-b-0" {...props} />,
                                    }}
                                >
                                    {m.content}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Tool Invocations Badge */}
                        {m.toolInvocations?.map(toolInvocation => {
                            const hasResult = 'result' in toolInvocation;
                            const result = hasResult ? (toolInvocation.result as any) : null;
                            const isFailed = Boolean(
                                hasResult &&
                                result &&
                                typeof result === 'object' &&
                                (
                                    result.success === false ||
                                    typeof result.error === 'string' ||
                                    typeof result.reason === 'string'
                                )
                            );

                            const badgeClass = !hasResult
                                ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.3)] text-[var(--accent-gold-dark)]'
                                : isFailed
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-green-50 border-green-200 text-green-700';

                            return (
                                <div key={toolInvocation.toolCallId} className={`border text-xs px-3 py-1.5 rounded mt-2 flex items-center gap-2 max-w-[90%] ${badgeClass}`}>
                                    {hasResult ? (
                                        isFailed ? (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                <span>Failed: <b>{toolInvocation.toolName}</b></span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                <span>Success: <b>{toolInvocation.toolName}</b></span>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                            <span>Running: <b>{toolInvocation.toolName}</b>...</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-start">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="bg-white border-t border-gray-100 p-3">
                <form onSubmit={handleSubmit} className="flex relative">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ketik permintaanmu..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-12 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1 top-1 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center disabled:opacity-50 transition-opacity hover:bg-black"
                    >
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
