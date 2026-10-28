import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Bot, Sparkles, CornerDownLeft, Zap, Sliders, Check } from 'lucide-react';
import ElectricBorder from './ElectricBorder';

const THEMES = [
  { id: 'cyan', name: 'Electric Cyan', color: '#7df9ff', glowColor: '#00f0ff' },
  { id: 'gemini', name: 'Gemini Emerald', color: '#10b981', glowColor: '#059669' },
  { id: 'plasma', name: 'Cyber Plasma', color: '#c084fc', glowColor: '#9333ea' },
  { id: 'amber', name: 'Solar Surge', color: '#fbbf24', glowColor: '#d97706' },
  { id: 'ice', name: 'Neon Ice', color: '#38bdf8', glowColor: '#0284c7' }
];

const MODES = [
  { id: 'balanced', label: 'Balanced', speed: 1.0, chaos: 0.5, spread: 0.6, strands: 3, thickness: 1.5, glow: 0.6 },
  { id: 'high-voltage', label: 'High Voltage', speed: 1.5, chaos: 0.85, spread: 0.85, strands: 4, thickness: 1.8, glow: 0.9 },
  { id: 'gentle', label: 'Gentle Aura', speed: 0.65, chaos: 0.3, spread: 0.45, strands: 2, thickness: 1.2, glow: 0.45 }
];

const ChatbotModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Vanakkam! I am your TNSTC AI Assistant 🤖\nPowered by real-time fleet telemetry & Gemini AI.\n\nAsk me about bus timings, ticket concessions, live route tracking, or seat availability!",
      actions: ["🚌 Sathy to Erode Timings", "🎫 Women Free Travel Rules", "💺 Check Seat Availability", "📍 Live GPS Tracking"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Dynamic Electric Border State
  const [electricActive, setElectricActive] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [showFxMenu, setShowFxMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const fxMenuRef = useRef(null);

  // Close FX menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fxMenuRef.current && !fxMenuRef.current.contains(e.target)) {
        setShowFxMenu(false);
      }
    };
    if (showFxMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFxMenu]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let displayLine = line;
      let isBullet = false;
      const trimmed = displayLine.trim();

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        displayLine = '• ' + trimmed.slice(2);
        isBullet = true;
      } else if (displayLine.startsWith('•') || displayLine.startsWith('🚌') || displayLine.startsWith('📍') || displayLine.startsWith('⏱️') || displayLine.startsWith('🎫') || displayLine.startsWith('💺') || displayLine.match(/^\d+\./)) {
        isBullet = true;
      }

      if (trimmed.startsWith('### ')) {
        return (
          <div key={idx} className="font-extrabold text-sm text-white mt-2 mb-1 border-b border-slate-800 pb-0.5">
            {trimmed.slice(4)}
          </div>
        );
      }

      const parts = displayLine.split(/(\**.*?\**)/g);
      const lineContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong 
              key={pIdx} 
              className="font-bold"
              style={{ color: selectedTheme.color }}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <div key={idx} className={isBullet ? 'my-0.5 font-medium pl-1' : (trimmed === '' ? 'h-1.5' : '')}>
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
          className="flex items-center gap-3 px-4 py-3 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white font-bold backdrop-blur-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group relative"
          style={{
            border: `1px solid ${selectedTheme.color}55`,
            boxShadow: `0 10px 25px -5px rgba(0,0,0,0.6), 0 0 20px ${selectedTheme.color}35`
          }}
          aria-label="Toggle TNSTC AI Assistant"
        >
          <div 
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${selectedTheme.color}, #1d4ed8)`
            }}
          >
            <Bot className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span 
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: selectedTheme.color }}
            />
            <span 
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedTheme.color }}
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-wide text-white flex items-center gap-1">
              TNSTC AI Assistant
              <Sparkles className="w-3 h-3 text-amber-400" />
            </span>
            <span 
              className="text-[9.5px] font-bold flex items-center gap-1"
              style={{ color: selectedTheme.color }}
            >
              <Zap className="w-2.5 h-2.5 fill-current animate-pulse" />
              <span>Gemini AI Fleet</span>
            </span>
          </div>
        </button>
      </div>

      {/* Electric Chat window modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] max-w-[420px] h-[520px] max-h-[82vh]">
          <ElectricBorder
            color={selectedTheme.color}
            glowColor={selectedTheme.glowColor}
            speed={selectedMode.speed}
            chaos={selectedMode.chaos}
            spread={selectedMode.spread}
            strands={selectedMode.strands}
            thickness={selectedMode.thickness}
            glow={selectedMode.glow}
            borderRadius={24}
            active={electricActive}
            interactive={true}
            className="w-full h-full shadow-2xl transition-all"
          >
            <div className="w-full h-full bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/20 rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative select-none">
              
              {/* Header */}
              <div className="bg-slate-900/90 p-3.5 border-b border-slate-800 flex items-center justify-between relative z-30">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md relative"
                    style={{
                      background: `linear-gradient(135deg, ${selectedTheme.color}40, #1e3a8a)`
                    }}
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <span>TNSTC AI Assistant</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </h3>
                    <p 
                      className="text-[10px] font-semibold flex items-center gap-1"
                      style={{ color: selectedTheme.color }}
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: selectedTheme.color }}
                      />
                      Gemini AI • Live Fleet RAG
                    </p>
                  </div>
                </div>

                {/* Right Header Actions: Electric FX Controls & Close */}
                <div className="flex items-center gap-1.5 relative">
                  {/* Electric FX Dynamic Preset Toggle Button */}
                  <div className="relative" ref={fxMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowFxMenu(!showFxMenu)}
                      title="Customize Electric Border Effects"
                      className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        electricActive
                          ? 'bg-slate-800/90 text-white shadow-md'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      style={{
                        borderColor: electricActive ? `${selectedTheme.color}70` : undefined,
                        boxShadow: electricActive ? `0 0 12px ${selectedTheme.color}35` : undefined
                      }}
                    >
                      <Zap 
                        className={`w-3.5 h-3.5 ${electricActive ? 'fill-current animate-pulse' : ''}`}
                        style={{ color: electricActive ? selectedTheme.color : '#94a3b8' }}
                      />
                      <span className="hidden sm:inline">Electric FX</span>
                    </button>

                    {/* Dynamic Electric FX Customization Popover */}
                    {showFxMenu && (
                      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                            Electric Border FX
                          </span>
                          <button
                            type="button"
                            onClick={() => setElectricActive(!electricActive)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                              electricActive 
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(125,249,255,0.6)]' 
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {electricActive ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* Theme Colors Picker */}
                        <div className="mb-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Electric Theme Color
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {THEMES.map((theme) => {
                              const isSelected = selectedTheme.id === theme.id;
                              return (
                                <button
                                  key={theme.id}
                                  type="button"
                                  onClick={() => setSelectedTheme(theme)}
                                  title={theme.name}
                                  className={`h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                                    isSelected ? 'scale-105 ring-2 ring-white/80' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                  }`}
                                  style={{
                                    backgroundColor: theme.color,
                                    boxShadow: isSelected ? `0 0 10px ${theme.color}` : 'none'
                                  }}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-slate-950 font-black" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Voltage & Movement Presets */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Voltage Energy
                          </label>
                          <div className="flex gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
                            {MODES.map((mode) => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setSelectedMode(mode)}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                                  selectedMode.id === mode.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Query Chips Header */}
              <div className="bg-slate-900/50 border-b border-slate-800/60 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto relative z-20">
                {[
                  "🚌 Sathy to Erode Timings",
                  "💺 Check Seat Availability",
                  "🎫 Ticket Fare Rates",
                  "📍 Live GPS Tracking"
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-[10px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                    style={{
                      borderColor: `${selectedTheme.color}30`
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/80 relative z-10 select-text">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md font-medium'
                          : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 rounded-bl-none shadow-sm'
                      }`}
                      style={{
                        borderColor: m.sender === 'ai' ? `${selectedTheme.color}25` : undefined
                      }}
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
                            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-blue-300 hover:text-white border border-blue-500/20 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
                            style={{
                              borderColor: `${selectedTheme.color}35`,
                              color: selectedTheme.color
                            }}
                          >
                            <span>{act}</span>
                            <CornerDownLeft className="w-2.5 h-2.5 opacity-80" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div 
                    className="flex items-center gap-2 text-[11px] p-2 bg-slate-900/80 border rounded-xl w-fit"
                    style={{ borderColor: `${selectedTheme.color}40` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: selectedTheme.color }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-100" style={{ backgroundColor: '#38bdf8' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-200" style={{ backgroundColor: '#10b981' }} />
                    <span className="font-medium text-slate-300">Analyzing live fleet &amp; reasoning...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic Electric Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 relative z-20"
              >
                <div 
                  className="flex-1 flex items-center bg-slate-950 border rounded-xl px-3 py-1.5 transition-all duration-200"
                  style={{
                    borderColor: inputFocused ? selectedTheme.color : 'rgba(51, 65, 85, 0.8)',
                    boxShadow: inputFocused ? `0 0 14px ${selectedTheme.color}35` : 'none'
                  }}
                >
                  <input
                    type="text"
                    value={input}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask bus timings, fares, seats..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl text-white transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: input.trim() 
                      ? `linear-gradient(135deg, ${selectedTheme.color}, #1d4ed8)` 
                      : '#2563eb',
                    boxShadow: input.trim() ? `0 0 12px ${selectedTheme.color}50` : 'none',
                    color: input.trim() && (selectedTheme.id === 'cyan' || selectedTheme.id === 'amber') ? '#020617' : '#ffffff'
                  }}
                >
                  <Send className="w-3.5 h-3.5 font-bold" />
                </button>
              </form>

            </div>
          </ElectricBorder>
        </div>
      )}
    </>
  );
};

export default ChatbotModal;
