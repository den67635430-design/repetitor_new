import React from 'react';
import { ChatMessage } from '../../types';
import WritingAnimation from './WritingAnimation';
import MathVisualization from './MathVisualization';

function cleanDisplayText(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$]+?)\$/g, '$1')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\(?:text|mathrm|mathbf|mathit|textbf)\{([^}]*)\}/g, '$1')
    .replace(/\\pm/g, '±')
    .replace(/\\geq/g, '≥')
    .replace(/\\leq/g, '≤')
    .replace(/\\neq/g, '≠')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\$/g, '')
    .replace(/  +/g, ' ')
    .trim();
}

type Segment = 
  | { type: 'text'; content: string }
  | { type: 'write'; character: string; cursive?: boolean }
  | { type: 'math'; expression: string };

function parseVisualContent(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\[WRITE_CURSIVE:(.+?)\]|\[WRITE:(.+?)\]|\[MATH:(.+?)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    if (match[1]) {
      segments.push({ type: 'write', character: match[1], cursive: true });
    } else if (match[2]) {
      segments.push({ type: 'write', character: match[2] });
    } else if (match[3]) {
      segments.push({ type: 'math', expression: match[3] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
      segments.push({ type: 'text', content: remaining });
    }
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

function RichContent({ text }: { text: string }) {
  const segments = parseVisualContent(text);

  return (
    <>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'write':
            return <WritingAnimation key={i} character={seg.character} cursive={seg.cursive} />;
          case 'math':
            return <MathVisualization key={i} expression={seg.expression} />;
          case 'text':
            return (
              <p key={i} className="text-sm whitespace-pre-wrap leading-relaxed">
                {cleanDisplayText(seg.content)}
              </p>
            );
        }
      })}
    </>
  );
}

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  isPreschool: boolean;
  onSpeakMessage: (text: string) => void;
  isSpeaking?: boolean;
}

const ChatMessages: React.FC<Props> = ({ messages, isTyping, error, isPreschool, onSpeakMessage, isSpeaking }) => (
  <>
    {messages.map((m, i) => (
      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
        <div className={`max-w-[85%] px-4 py-3 ${
          m.role === 'user'
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
            : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'
        }`}>
          {/* Image if attached */}
          {m.imageUrl && (
            <img src={m.imageUrl} alt="Прикреплено" className="max-w-full rounded-xl mb-2" />
          )}

          {/* Rich content for AI messages, plain text for user */}
          {m.role === 'model' ? (
            <RichContent text={m.text} />
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
          )}

          <div className="flex items-center justify-between mt-1 gap-2">
            <span className="text-[10px] opacity-50">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {m.role === 'model' && m.text && (
              <button
                onClick={() => onSpeakMessage(m.text)}
                className={`p-2 rounded-full transition-colors ${
                  isSpeaking ? 'text-white bg-blue-600 animate-pulse shadow-md' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 shadow-sm'
                }`}
                title={isSpeaking ? 'Остановить' : 'Озвучить'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isSpeaking ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M10 9v6 M14 9v6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l4.964-3.212a.5.5 0 000-.858L7.257 8.36a.5.5 0 00-.757.429z" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    ))}

    {isTyping && messages[messages.length - 1]?.text === '' && (
      <div className="flex justify-start animate-pulse">
        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>
        </div>
      </div>
    )}

    {error && (
      <div className="flex justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
          {error}
        </div>
      </div>
    )}
  </>
);

export default ChatMessages;
