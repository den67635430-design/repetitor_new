import React, { useEffect, useState } from 'react';

interface Props {
  character: string;
}

const WritingAnimation: React.FC<Props> = ({ character }) => {
  const [phase, setPhase] = useState<'tracing' | 'filled'>('tracing');

  useEffect(() => {
    setPhase('tracing');
    const timer = setTimeout(() => setPhase('filled'), 2500);
    return () => clearTimeout(timer);
  }, [character]);

  return (
    <div className="my-3 flex flex-col items-center">
      <div className="relative bg-amber-50 border-2 border-amber-200 rounded-xl p-4 w-48 h-48 flex items-center justify-center overflow-hidden">
        {/* Notebook lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 right-0 bottom-[30%] border-b-2 border-red-300/40" />
          <div className="absolute left-0 right-0 bottom-[50%] border-b border-blue-300/20" />
          <div className="absolute left-0 right-0 bottom-[70%] border-b border-blue-300/20" />
        </div>

        {/* Character outline (always visible) */}
        <svg
          viewBox="0 0 120 120"
          className="absolute w-32 h-32"
          style={{ overflow: 'visible' }}
        >
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="90"
            fontFamily="'Times New Roman', serif"
            fontWeight="bold"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1"
            strokeDasharray="3 3"
          >
            {character}
          </text>
        </svg>

        {/* Animated stroke tracing */}
        <svg
          viewBox="0 0 120 120"
          className="absolute w-32 h-32"
          style={{ overflow: 'visible' }}
        >
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="90"
            fontFamily="'Times New Roman', serif"
            fontWeight="bold"
            fill={phase === 'filled' ? '#1e40af' : 'none'}
            stroke="#2563eb"
            strokeWidth="2"
            strokeDasharray="600"
            strokeDashoffset={phase === 'tracing' ? undefined : '0'}
            className={phase === 'tracing' ? 'animate-draw-stroke' : ''}
            style={{
              transition: phase === 'filled' ? 'fill 0.5s ease-in' : undefined,
            }}
          >
            {character}
          </text>
        </svg>

        {/* Pen cursor */}
        <div
          className={`absolute transition-all ${
            phase === 'tracing' ? 'animate-pen-move opacity-100' : 'opacity-0'
          }`}
          style={{ bottom: '25%' }}
        >
          <svg className="w-8 h-8 text-amber-700 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </div>
      </div>

      <span className="mt-2 text-xs text-slate-500 font-medium">
        ✏️ Пишем: «{character}»
      </span>
    </div>
  );
};

export default WritingAnimation;
