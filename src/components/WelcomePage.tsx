import React from 'react';
import SupportButton from './SupportButton';
interface Props {
  onStart: () => void;
}

const WelcomePage: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 flex flex-col items-center justify-center p-6 text-center animate-slide-in relative">
      <SupportButton variant="light" />
      {/* Logo */}
      <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/30">
        <span className="text-5xl">📚</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">
        Репетитор<br />под рукой
      </h1>
      <p className="text-blue-200 text-lg font-medium mb-2">
        Персональный AI-наставник
      </p>
      <p className="text-blue-300/80 text-sm max-w-xs mb-10">
        Помощь с учёбой для дошкольников и школьников 1–11 классов. Умный репетитор всегда рядом!
      </p>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-xs">
        <FeatureChip emoji="🧒" label="Дошколята" />
        <FeatureChip emoji="📐" label="1–11 класс" />
        <FeatureChip emoji="🎓" label="ОГЭ / ЕГЭ" />
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full max-w-xs bg-white text-blue-700 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all"
      >
        Начать обучение
      </button>

      {/* Footer */}
      <p className="mt-8 text-[10px] text-blue-300/50 font-bold tracking-[0.2em] uppercase">
        Powered by @kontentcod
      </p>
    </div>
  );
};

const FeatureChip: React.FC<{ emoji: string; label: string }> = ({ emoji, label }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
    <span className="text-2xl block mb-1">{emoji}</span>
    <span className="text-[10px] font-bold text-white/80">{label}</span>
  </div>
);

export default WelcomePage;
