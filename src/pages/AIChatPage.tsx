import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import type { Conversation, Message, KnowledgeChunk } from '@/types/database';
import {
  MessageSquare, Plus, Send, Copy, RotateCcw, Trash2,
  Bot, User, BookOpen, Loader2
} from 'lucide-react';

export function AIChatPage() {
  const { user } = useAuth();
  const { currentBusiness, agent } = useBusiness();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentBusiness) return;
    const fetchConvs = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('updated_at', { ascending: false });
      setConversations((data ?? []) as Conversation[]);
      setLoadingConvs(false);
    };
    fetchConvs();
  }, [currentBusiness]);

  useEffect(() => {
    if (!currentConv) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConv.id)
        .order('created_at', { ascending: true });
      setMessages((data ?? []) as Message[]);
    };
    fetchMessages();
  }, [currentConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    if (!currentBusiness || !user) return;
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        business_id: currentBusiness.id,
        user_id: user.id,
        agent_id: agent?.id || null,
        title: 'New Conversation',
        language: currentBusiness.preferred_language || 'English',
      })
      .select()
      .single();
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    const newConv = data as Conversation;
    setConversations(prev => [newConv, ...prev]);
    setCurrentConv(newConv);
  };

  const handleDeleteConv = async (id: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConv?.id === id) setCurrentConv(null);
    showToast('Conversation deleted', 'success');
  };

  const retrieveKnowledge = async (query: string): Promise<KnowledgeChunk[]> => {
    if (!currentBusiness) return [];
    const { data } = await supabase
      .from('knowledge_chunks')
      .select('content, knowledge_source_id')
      .eq('business_id', currentBusiness.id)
      .textSearch('content', query, { type: 'websearch', config: 'english' })
      .limit(5);
    return (data ?? []) as KnowledgeChunk[];
  };

  const handleSend = async () => {
    if (!input.trim() || !currentBusiness || !currentConv || !user) return;
    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const { data: userMsg } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConv.id,
        business_id: currentBusiness.id,
        role: 'user',
        content: userMessage,
      })
      .select()
      .single();

    if (userMsg) {
      setMessages(prev => [...prev, userMsg as Message]);
    }

    if (currentConv.title === 'New Conversation') {
      const title = userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '');
      await supabase.from('conversations').update({ title }).eq('id', currentConv.id);
      setCurrentConv({ ...currentConv, title });
      setConversations(prev => prev.map(c => c.id === currentConv.id ? { ...c, title } : c));
    }

    try {
      const knowledge = await retrieveKnowledge(userMessage);
      const businessContext = currentBusiness.description || '';
      const productsContext = currentBusiness.products_services || '';
      const knowledgeText = knowledge.map(k => k.content).join('\n\n');

      const systemPrompt = `You are ${agent?.name || currentBusiness.name + ' Assistant'}, the AI business agent for ${currentBusiness.name}.
Industry: ${currentBusiness.industry}
Description: ${businessContext}
Products & Services: ${productsContext}
Target Audience: ${currentBusiness.target_audience || 'General customers'}
Brand Tone: ${agent?.tone || currentBusiness.brand_tone || 'Professional'}

Knowledge from uploaded documents:
${knowledgeText || 'No specific knowledge found for this query.'}

Instructions:
- Answer questions about the business using ONLY the information provided above.
- If the knowledge does not contain the answer, clearly say the information is unavailable.
- Never invent business-specific prices, discounts, product features, contact details, or policies.
- Be helpful, accurate, and maintain the brand tone.
- Keep responses concise and relevant.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt,
          businessId: currentBusiness.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error (${response.status})`);
      }

      const data = await response.json();
      const assistantContent = data.response || data.error || 'I could not process your request at this time.';
      const modelUsed = data.model || 'gemini-2.0-flash';
      const citations = knowledge.length > 0
        ? knowledge.map(k => ({ source: 'Knowledge Base', content: k.content.slice(0, 200) }))
        : null;

      const { data: assistantMsg } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConv.id,
          business_id: currentBusiness.id,
          role: 'assistant',
          content: assistantContent,
          citations,
          model_used: modelUsed,
        })
        .select()
        .single();

      if (assistantMsg) {
        setMessages(prev => [...prev, assistantMsg as Message]);
      }

      await supabase.from('usage_events').insert({
        business_id: currentBusiness.id,
        user_id: user.id,
        type: 'chat',
        model_used: modelUsed,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      const fallbackContent = `I'm sorry, I couldn't connect to the AI service right now. ${errorMsg}\n\nPlease ensure the Gemini API key is configured. You can still browse your knowledge base while the service is unavailable.`;

      const { data: errMsg } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConv.id,
          business_id: currentBusiness.id,
          role: 'assistant',
          content: fallbackContent,
          model_used: 'error',
        })
        .select()
        .single();

      if (errMsg) {
        setMessages(prev => [...prev, errMsg as Message]);
      }
      showToast('AI service unavailable. Please check configuration.', 'error');
    }

    setSending(false);
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || !currentConv || !currentBusiness) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    setMessages(prev => prev.filter(m => m.id !== messages[messages.length - 1].id));
    setInput(lastUserMsg.content);
    setTimeout(() => handleSend(), 100);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard', 'success');
  };

  if (!currentBusiness) {
    return <EmptyState icon={MessageSquare} title="No business" description="Create a business to start chatting." />;
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center">
            <MessageSquare size={20} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">AI Chat</h1>
            <p className="text-sm text-slate-400">{agent?.name || 'Business Assistant'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations sidebar */}
        <div className="w-64 flex-shrink-0 glass-card p-3 hidden md:flex flex-col">
          <button onClick={handleNewChat} className="btn-primary w-full mb-3">
            <Plus size={16} /> New Chat
          </button>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
            {loadingConvs ? (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentConv?.id === conv.id ? 'bg-teal-500/10 text-teal-300' : 'hover:bg-white/[0.05] text-slate-300'}`}
                  onClick={() => setCurrentConv(conv)}
                >
                  <MessageSquare size={14} className="flex-shrink-0 opacity-50" />
                  <span className="text-sm truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConv(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 glass-card flex flex-col min-h-0">
          {!currentConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/5 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <Bot size={32} className="text-teal-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Start a conversation</h3>
                <p className="text-sm text-slate-400 mb-4">Ask anything about your business</p>
                <button onClick={handleNewChat} className="btn-primary">
                  <Plus size={16} /> New Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-500/15 border border-blue-500/20' : 'bg-teal-500/15 border border-teal-500/20'}`}>
                      {msg.role === 'user' ? <User size={16} className="text-blue-400" /> : <Bot size={16} className="text-teal-400" />}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-3 rounded-xl text-left ${msg.role === 'user' ? 'bg-blue-500/10 border border-blue-500/15' : 'bg-white/[0.03] border border-white/[0.08]'}`}>
                        <div className="prose-chat text-slate-200 whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-1.5 ml-1">
                          {msg.model_used && msg.model_used !== 'error' && (
                            <span className="text-xs text-slate-500">{msg.model_used}</span>
                          )}
                          <button onClick={() => handleCopy(msg.content)} className="text-xs text-slate-500 hover:text-teal-400 flex items-center gap-1">
                            <Copy size={12} /> Copy
                          </button>
                          <button onClick={handleRegenerate} className="text-xs text-slate-500 hover:text-teal-400 flex items-center gap-1">
                            <RotateCcw size={12} /> Regenerate
                          </button>
                          {msg.citations && msg.citations.length > 0 && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <BookOpen size={12} /> {msg.citations.length} sources
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-teal-400" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-xl flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-teal-400" />
                      <span className="text-sm text-slate-400">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="input-field flex-1 min-h-[44px] max-h-32 resize-none"
                    placeholder="Ask about your business..."
                    rows={1}
                  />
                  <button onClick={handleSend} disabled={!input.trim() || sending} className="btn-primary h-11 px-4">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
