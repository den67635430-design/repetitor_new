import React from 'react';

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isTyping: boolean;
  isListening: boolean;
  onMicToggle: () => void;
  micSupported: boolean;
  isPreschool: boolean;
}

const ChatInput: React.FC<Props> = ({
  input,
  setInput,
  onSend,
  isTyping,
  isListening,
  onMicToggle,
  micSupported,
  isPreschool,
}) => (
  <div className="p-4 bg-white border-t space-y-2">
    <div className="flex items-end gap-2">
      {/* Mic button */}
      {micSupported && (
        <button
          onClick={onMicToggle}
          className={`p-3 rounded-2xl shadow-lg transition-all flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isListening ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>
      )}

      <textarea
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
        placeholder={isListening ? 'Говорите...' : 'Спросите что угодно...'}
      />

      <button
        onClick={onSend}
        disabled={!input.trim() || isTyping}
        className={`p-3 rounded-2xl shadow-lg transition-all flex-shrink-0 ${
          !input.trim() || isTyping
            ? 'bg-slate-200 text-slate-400'
            : 'bg-blue-600 text-white hover:scale-105 active:scale-95'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>

    {isListening && (
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs text-red-500 font-medium">Запись голоса...</span>
      </div>
    )}

    <p className="text-[9px] text-center text-slate-400 font-medium">
      AI может ошибаться • Данные проверяются через интернет
    </p>
  </div>
);

export default ChatInput;
