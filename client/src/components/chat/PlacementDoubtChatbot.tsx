import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ChatMessage,
  getStudentChatHistory,
  saveStudentChatHistory,
  clearStudentChatHistory,
  sendPlacementDoubtMessage,
} from '@/services/geminiChatService';
import {
  Sparkles,
  RotateCcw,
  Bot,
  User,
  Minimize2,
  AlertCircle,
  Send,
  LogIn,
} from 'lucide-react';

export const PlacementDoubtChatbot: React.FC = () => {
  const { user, profileData } = useAuth();
  const displayName = profileData?.profile?.full_name || user?.fullName || 'Student';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      setShowLoginPrompt(false);
    }
  }, [user?.id]);

  // Load isolated chat history for the logged-in student
  useEffect(() => {
    if (user?.id) {
      const history = getStudentChatHistory(user.id);
      if (history.length > 0) {
        setMessages(history);
      } else {
        const studentFirstName = displayName.split(' ')[0] || 'there';
        setMessages([
          {
            id: 'init-msg',
            role: 'assistant',
            content: `Hello ${studentFirstName}! I am your **PathSync AI Placement & CS Mentor** powered by Google Gemini.\n\nAsk me any doubts about **Programming, Data Structures, Algorithms, Core CS (OS, DBMS, Networks)**, or **Aptitude & Technical Interview Questions**!`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } else {
      setMessages([
        {
          id: 'init-guest',
          role: 'assistant',
          content: 'Hello! I am the **PathSync AI Placement Mentor**. Please sign in to save your conversation history across sessions.',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [user?.id, displayName]);

  // Save history on changes
  useEffect(() => {
    if (user?.id && messages.length > 1) {
      saveStudentChatHistory(user.id, messages);
    }
  }, [messages, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleAttemptChat = () => {
    if (!user) {
      setShowLoginPrompt(true);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const { reply } = await sendPlacementDoubtMessage(
        trimmed,
        newHistory,
        user?.id || 'guest',
        {
          name: displayName,
          branch: profileData?.education?.branch,
          skills: [
            ...(profileData?.skills?.programming || []),
            ...(profileData?.skills?.frameworks || []),
            ...(profileData?.skills?.tools || []),
            ...(profileData?.skills?.technical || []),
          ],
        }
      );
      const assistantMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to AI assistant. Please check server settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (user?.id) {
      clearStudentChatHistory(user.id);
    }
    setMessages([
      {
        id: `init-reset-${Date.now()}`,
        role: 'assistant',
        content: 'Conversation cleared. How can I help you with your placement preparations today?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button adhering to PathSync Design System */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg hover:shadow-brand transition-all duration-200 flex items-center gap-2 cursor-pointer group"
          title="Ask PathSync AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-mint" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-primary" />
          </div>
          <span className="text-xs font-bold pr-1 hidden sm:inline">Ask AI Mentor</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-surface rounded-2xl border border-border-default shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#06392F] via-[#085444] to-[#0A6C58] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-mint" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  PathSync AI Mentor
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                    Gemini 3.8 Flash
                  </span>
                </h4>
                <p className="text-[10px] text-slate-200">CS, Aptitude & Placement Doubt Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                      isUser ? 'bg-primary text-white' : 'bg-surface text-primary border border-border-default'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                  </span>

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-primary text-white rounded-tr-none shadow-xs'
                        : 'bg-surface text-charcoal border border-border-default rounded-tl-none shadow-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface text-primary border border-border-default flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </span>
                <div className="p-3 bg-surface border border-border-default rounded-2xl rounded-tl-none text-xs text-slate-muted flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span>Consulting Gemini Mentor...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {!user && showLoginPrompt && (
              <div className="p-4 bg-primary-subtle/50 border border-primary-border/60 rounded-2xl flex flex-col items-center text-center gap-2.5 animate-in fade-in-0 duration-200">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-charcoal">Sign in to Chat with AI Mentor</h5>
                  <p className="text-[11px] text-slate-muted mt-0.5">
                    Please log in with your student account to ask doubts and get placement guidance.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In to Continue</span>
                </Link>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form / Login Prompt */}
          {!user && showLoginPrompt ? (
            <div className="p-3 bg-surface border-t border-border-subtle flex items-center justify-between gap-3">
              <span className="text-xs text-slate-muted pl-1">
                Please log in to chat with AI Mentor
              </span>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="p-3 bg-surface border-t border-border-subtle flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  if (!user) {
                    setShowLoginPrompt(true);
                  } else {
                    setInputValue(e.target.value);
                  }
                }}
                onFocus={handleAttemptChat}
                onClick={handleAttemptChat}
                placeholder={user ? "Ask about DSA, Java, DBMS, Aptitude, or Interviews..." : "Sign in to chat with AI Mentor..."}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border-default text-xs bg-alternate text-charcoal placeholder:text-slate-muted focus:border-primary focus:bg-surface outline-hidden cursor-text"
              />
              <button
                type="submit"
                disabled={isLoading || (!user ? false : !inputValue.trim())}
                className="p-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                title={user ? "Send question" : "Log in to chat"}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      )}
    </>
  );
};
