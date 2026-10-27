import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Globe,
  Trash2,
  Shield,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { querySecurityAssistant } from '../services/assistantService';
import { DEMO_ASSISTANT_KNOWLEDGE } from '../services/mockData';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import DemoBadge from '../components/common/DemoBadge';

export default function SecurityAssistantPage() {
  const { lang, toggleLanguage } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 'msg-0',
      sender: 'bot',
      text: DEMO_ASSISTANT_KNOWLEDGE[lang]?.welcome || DEMO_ASSISTANT_KNOWLEDGE.en.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions =
    DEMO_ASSISTANT_KNOWLEDGE[lang]?.suggestions || DEMO_ASSISTANT_KNOWLEDGE.en.suggestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await querySecurityAssistant(textToSend, lang);
      const botMsg = {
        id: `msg-${Date.now()}-b`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDemo: response.isDemo,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'bot',
          text: 'Security assistant service is currently unavailable. Please verify backend connection or toggle Demo Mode.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: DEMO_ASSISTANT_KNOWLEDGE[lang]?.welcome || DEMO_ASSISTANT_KNOWLEDGE.en.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-cyber-card border border-cyber-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-slate-100">
                PhishGuard AI Security Assistant
              </h1>
              <Badge variant="cyan" size="xs">
                {lang === 'ta' ? 'தமிழ் AI' : 'English NLP'}
              </Badge>
              <DemoBadge />
            </div>
            <p className="text-xs text-cyber-muted">
              {lang === 'ta'
                ? 'இணைய பாதுகாப்பு மற்றும் ஃபிஷிங் தடுப்பு வழிகாட்டி'
                : 'Bilingual conversational advisor for phishing incident triage and threat education'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            onClick={() => toggleLanguage()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-darkest border border-cyber-border text-xs text-cyan-400 hover:border-cyan-400 transition-all font-semibold"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      {/* Chat Messages Display Box */}
      <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-cyber-darkest/90 border border-cyber-border space-y-4 shadow-inner">
        {messages.map((m) => {
          const isBot = m.sender === 'bot';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isBot
                    ? 'bg-cyber-card border border-cyber-border text-slate-200'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-glow'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                <div
                  className={`mt-2 flex items-center justify-between text-[10px] font-mono ${
                    isBot ? 'text-slate-500' : 'text-cyan-200'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.isDemo && <span className="text-yellow-400/80">[DEMO RESPONSE]</span>}
                </div>
              </div>
              {!isBot && (
                <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-cyan-300 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs text-cyber-muted font-mono">
                {lang === 'ta' ? 'பாதுகாப்பு AI பதிலளிக்கிறது...' : 'PhishGuard AI formulating guidance...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-[11px] text-cyber-muted flex items-center gap-1 font-mono flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Prompts:
        </span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(s)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-cyber-card border border-cyber-border hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap flex-shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 flex-shrink-0"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              lang === 'ta'
                ? 'ஃபிஷிங் அல்லது பாதுகாப்பு குறித்து கேளுங்கள்...'
                : 'Ask security question or incident guidance in English or தமிழ்...'
            }
            className="w-full px-4 py-3 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:shadow-cyan-glow text-slate-100 text-xs sm:text-sm focus:outline-none placeholder-slate-500 font-sans"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          icon={Send}
          disabled={!input.trim()}
        >
          Send
        </Button>
      </form>
    </div>
  );
}

