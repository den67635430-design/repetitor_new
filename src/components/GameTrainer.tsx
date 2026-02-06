import React, { useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface Props {
  onBack: () => void;
}

const GAME_TYPES = [
  { id: 'count', name: 'Сосчитай предметы', icon: '🍎' },
  { id: 'letter', name: 'Найди букву', icon: '🅰️' },
  { id: 'color', name: 'Сопоставь цвета', icon: '🎨' },
];

interface AnswerFeedback {
  selected: number;
  correct: boolean;
}

const GameTrainer: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [question, setQuestion] = useState<{ text: string; options: number[]; answer: number } | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const { speak } = useSpeechSynthesis();

  const generateQuestion = () => {
    const num = Math.floor(Math.random() * 5) + 1;
    const optionsSet = new Set<number>([num]);
    while (optionsSet.size < 4) {
      const opt = Math.floor(Math.random() * 7) + 1;
      if (opt > 0) optionsSet.add(opt);
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    setQuestion({ text: 'Сколько яблок ты видишь?', options, answer: num });
    setFeedback(null);
    speak(`Сколько яблок ты видишь?`);
  };

  const startGame = () => {
    setScore(0);
    setCurrentRound(1);
    setGameState('playing');
    setTimeout(() => generateQuestion(), 100);
  };

  const handleAnswer = (val: number) => {
    if (feedback) return; // prevent double-tap

    const correct = val === question?.answer;
    setFeedback({ selected: val, correct });

    if (correct) {
      setScore(s => s + 1);
      speak('Правильно! Молодец!');
    } else {
      speak(`Неправильно. Правильный ответ: ${question?.answer}`);
    }

    // Move to next round after delay
    setTimeout(() => {
      if (currentRound < 5) {
        setCurrentRound(r => r + 1);
        generateQuestion();
      } else {
        setGameState('results');
        const finalScore = correct ? score + 1 : score;
        speak(`Молодец! Ты заработал ${finalScore} из пяти звёзд!`);
      }
    }, 1500);
  };

  const getOptionStyle = (opt: number) => {
    if (!feedback) {
      return 'bg-white text-sky-600 border-b-8 border-slate-200 hover:bg-sky-100 active:scale-90 active:border-b-0';
    }

    if (opt === question?.answer) {
      return 'bg-emerald-100 text-emerald-700 border-b-8 border-emerald-300 scale-105';
    }

    if (opt === feedback.selected && !feedback.correct) {
      return 'bg-red-100 text-red-600 border-b-8 border-red-300 scale-95 opacity-70';
    }

    return 'bg-white text-slate-300 border-b-8 border-slate-100 opacity-50';
  };

  return (
    <div className="p-5 h-full bg-sky-50 animate-slide-in flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
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

            {/* Feedback banner */}
            {feedback && (
              <div className={`text-center py-3 rounded-2xl font-bold text-lg animate-slide-in ${
                feedback.correct
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {feedback.correct ? '✅ Правильно! Молодец!' : `❌ Неправильно. Ответ: ${question.answer}`}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {question.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`p-8 rounded-[32px] shadow-lg text-4xl font-extrabold transition-all ${getOptionStyle(opt)}`}
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
              Играть ещё
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTrainer;
