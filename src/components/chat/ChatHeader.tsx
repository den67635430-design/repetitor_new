import React from 'react';
import { LEARNING_MODES } from '../../constants';

interface Props {
  subject: string;
  selectedMode: string;
  onBack: () => void;
}

const ChatHeader: React.FC<Props> = ({ subject, selectedMode, onBack }) => (
  <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-20">
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h3 className="font-bold text-slate-900 leading-none">{subject}</h3>
        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
          {LEARNING_MODES.find(m => m.id === selectedMode)?.name || 'Выбор режима'}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold">AI</div>
      <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">LIVE</div>
    </div>
  </div>
);

export default ChatHeader;
