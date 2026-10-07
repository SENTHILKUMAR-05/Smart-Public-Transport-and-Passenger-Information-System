import React, { useState } from 'react';
import axios from 'axios';
import { X, Send, Bot, Sparkles, CornerDownLeft } from 'lucide-react';

const ChatbotModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi! I am your TNSTC AI Assistant 🤖\nAsk me about bus timings, fares, seats, or live tracking for any route!",
      actions: ["🚌 Sathy to Erode Timings", "💺 Check Seat Availability", "🎫 Ticket Fare Rates"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText) => {
    const textToSend = typeof queryText === 'string' ? queryText : input;
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chatbot', { 
        message: textToSend,
        history: messages 
      });
      const aiResponse = res.data;

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponse.response || "I am processing your TNSTC route inquiry.",
        actions: aiResponse.suggested_actions || []
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "The Sathyamangalam to Erode bus service runs every 20 mins with ordinary & express buses available throughout the day!",
        actions: ["Book Sathy to Erode", "Check Seat Availability"]
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const lineContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-emerald-300">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div key={idx} className={line.startsWith('•') || line.startsWith('🚌') || line.startsWith('📍') || line.startsWith('⏱️') || line.startsWith('🎫') || line.startsWith('💺') ? 'my-0.5 font-medium' : ''}>
          {lineContent}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Chatbot Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white font-bold shadow-2xl shadow-blue-600/30 border border-blue-500/40 backdrop-blur-xl transform hover:scale-105 transition-all cursor-pointer group"
        >
          <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center text-white shadow-md">
            <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wide text-white">TNSTC AI Assistant</span>
        </button>
      </div>

      {/* Chat window modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] sm:w-[400px] bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[490px] animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="bg-slate-900/90 p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <span>TNSTC AI Assistant</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </h3>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real-Time Fleet RAG
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Query Chips Header */}
          <div className="bg-slate-900/50 border-b border-slate-800/60 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto">
            {[
              "🚌 Sathy to Erode Timings",
              "💺 Check Seat Availability",
              "🎫 Ticket Fare Rates",
              "📍 Live GPS Tracking"
            ].map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700/80 text-[10px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/80">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md font-medium'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                >
                  {renderFormattedText(m.text)}
                </div>

                {/* Clickable suggested actions */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(act)}
                        className="px-2.5 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/20 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{act}</span>
                        <CornerDownLeft className="w-2.5 h-2.5 text-blue-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-blue-400 p-2 bg-slate-900/60 border border-slate-800 rounded-xl w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
                <span className="font-medium text-slate-400">Fetching live TNSTC schedule...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask bus timings, fares, seats..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotModal;

