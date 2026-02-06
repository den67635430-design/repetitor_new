
import React from 'react';
import { SUBJECTS, EXAMS } from '../constants';

interface Props {
  isExam?: boolean;
  onBack: () => void;
  onSelect: (id: string) => void;
}

const SubjectGrid: React.FC<Props> = ({ isExam, onBack, onSelect }) => {
  const items = isExam ? EXAMS : SUBJECTS;

  return (
    <div className="p-5 animate-slide-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-extrabold text-slate-900">
          {isExam ? 'Подготовка к экзаменам' : 'Выберите предмет'}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.name)}
            className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center gap-3 group"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform">{item.emoji}</span>
            <span className="font-bold text-slate-800 text-sm text-center">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectGrid;
