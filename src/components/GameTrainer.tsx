
import React, { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

const GAME_TYPES = [
  { id: 'count', name: 'Сосчитай предметы', icon: '🍎' },
  { id: 'letter', name: 'Найди букву', icon: '🅰️' },
  { id: 'color', name: 'Сопоставь цвета', icon: '🎨' },
];

const GameTrainer: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [question, setQuestion] = useState<{ text: string, options: any[], answer: any } | null>(null);

  const generateQuestion = () => {
    const num = Math.floor(Math.random() * 5) + 1;
    const items = Array(num).fill('🍎');
    const options = [num, num + 1, num - 1, num + 2].sort(() => Math.random() - 0.5);
    setQuestion({
      text: "Сколько яблок ты видишь?",
      options: options.filter(n => n > 0),
      answer: num
    });
  };

  const startGame = () => {
    setScore(0);
    setCurrentRound(1);
    setGameState('playing');
    generateQuestion();
  };

  const handleAnswer = (val: number) => {
    if (val === question?.answer) {
      setScore(s => s + 1);
    }
    
    if (currentRound < 5) {
      setCurrentRound(r => r + 1);
      generateQuestion();
    } else {
      setGameState('results');
    }
  };

  return (
    <div className="p-5 h-full bg-sky-50 animate-slide-in flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-extrabold text-sky-900">Игра-тренажёр</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        {gameState === 'selection' && (
          <div className="w-full space-y-4">
            <h3 className="text-center font-bold text-sky-800 text-lg mb-4">Выбери игру:</h3>
            {GAME_TYPES.map(g => (
              <button
                key={g.id}
                onClick={startGame}
                className="w-full bg-white p-6 rounded-3xl shadow-md border-2 border-transparent active:border-sky-400 flex items-center gap-6 group transition-all"
              >
                <span className="text-5xl group-hover:scale-110 transition-transform">{g.icon}</span>
                <span className="text-xl font-bold text-sky-900">{g.name}</span>
              </button>
            ))}
          </div>
        )}

        {gameState === 'playing' && question && (
          <div className="w-full space-y-8 animate-slide-in">
            <div className="flex justify-between items-center w-full bg-white/50 p-4 rounded-2xl">
              <span className="font-bold text-sky-700">Раунд {currentRound}/5</span>
              <span className="font-bold text-sky-700">⭐ {score}</span>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] shadow-xl text-center space-y-6">
              <div className="text-6xl tracking-widest">
                {Array(question.answer).fill('🍎').join(' ')}
              </div>
              <h4 className="text-2xl font-bold text-slate-800">{question.text}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {question.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="bg-white p-8 rounded-[32px] shadow-lg text-4xl font-extrabold text-sky-600 hover:bg-sky-100 active:scale-90 transition-all border-b-8 border-slate-200 active:border-b-0"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center space-y-6 animate-slide-in w-full">
            <div className="text-8xl">🏆</div>
            <h3 className="text-3xl font-extrabold text-sky-900">Молодец!</h3>
            <p className="text-lg text-slate-600 font-medium">Ты заработал {score} звёзд!</p>
            <div className="flex gap-2 justify-center">
              {Array(score).fill(0).map((_, i) => <span key={i} className="text-3xl">⭐</span>)}
            </div>
            <button
              onClick={() => setGameState('selection')}
              className="w-full bg-sky-600 text-white py-5 rounded-3xl font-bold text-xl shadow-lg hover:bg-sky-700 active:scale-95 transition-all"
            >
              Играть еще
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTrainer;
