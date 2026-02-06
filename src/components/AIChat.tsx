
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage, LearningMode } from '../types';
import { LEARNING_MODES } from '../constants';
import { sendMessageStream, getSystemInstruction } from '../services/geminiService';

interface Props {
  user: UserProfile;
  subject: string;
  mode: string;
  onBack: () => void;
}

const AIChat: React.FC<Props> = ({ user, subject, mode, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [showModes, setShowModes] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const systemInstruction = getSystemInstruction(user.type, subject, selectedMode, user.classLevel);
    
    // Format history for Gemini API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    let currentAiResponse = "";
    try {
      const stream = sendMessageStream(input, systemInstruction, history);
      
      setMessages(prev => [...prev, { role: 'model', text: '', timestamp: new Date().toISOString() }]);

      for await (const chunk of stream) {
        currentAiResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = currentAiResponse;
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const startWithMode = (mId: string) => {
    setSelectedMode(mId);
    setShowModes(false);
    const initialPrompt = `Привет! Я хочу изучить тему в режиме "${LEARNING_MODES.find(m => m.id === mId)?.name}". С чего начнем?`;
    setInput(initialPrompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h3 className="font-bold text-slate-900 leading-none">{subject}</h3>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              {LEARNING_MODES.find(m => m.id === selectedMode)?.name || 'Выбор режима'}
            </span>
          </div>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">LIVE</div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {showModes && (
          <div className="animate-slide-in space-y-3">
            <h4 className="text-center text-slate-500 font-medium py-2">Какой режим выберем?</h4>
            <div className="grid grid-cols-1 gap-2">
              {LEARNING_MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => startWithMode(m.id)}
                  className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md text-left active:scale-[0.98] transition-all"
                >
                  <p className="font-bold text-blue-900 text-sm">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              <span className="text-[10px] opacity-50 block mt-1 text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {!showModes && (
        <div className="p-4 bg-white border-t space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
              placeholder="Спросите что угодно..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`p-3 rounded-2xl shadow-lg transition-all ${
                !input.trim() || isTyping ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:scale-105 active:scale-95'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
          <p className="text-[9px] text-center text-slate-400 font-medium">
            AI может ошибаться. Используйте только в образовательных целях.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIChat;
