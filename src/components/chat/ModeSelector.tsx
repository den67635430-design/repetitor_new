import React from 'react';
import { LEARNING_MODES } from '../../constants';

interface Props {
  onSelect: (modeId: string) => void;
}

const ModeSelector: React.FC<Props> = ({ onSelect }) => (
  <div className="animate-slide-in space-y-3">
    <h4 className="text-center text-slate-500 font-medium py-2">Какой режим выберем?</h4>
    <div className="grid grid-cols-1 gap-2">
      {LEARNING_MODES.map(m => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md text-left active:scale-[0.98] transition-all"
        >
          <p className="font-bold text-blue-900 text-sm">{m.name}</p>
          <p className="text-xs text-slate-500">{m.desc}</p>
        </button>
      ))}
    </div>
  </div>
);

export default ModeSelector;
