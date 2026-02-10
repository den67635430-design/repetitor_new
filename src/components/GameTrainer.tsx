import React, { useState, useCallback } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { GAME_TYPES, CORRECT_RESPONSES, WRONG_RESPONSES, pickRandom } from './games/gameData';
import { generateQuestion, GameQuestion } from './games/questionGenerators';

interface Props {
  onBack: () => void;
}

interface AnswerFeedback {
  selected: number | string;
  correct: boolean;
}

const TOTAL_ROUNDS = 5;

const GameTrainer: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
  const [selectedGame, setSelectedGame] = useState<string>('count');
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const { speak } = useSpeechSynthesis();

  const nextQuestion = useCallback((gameId: string) => {
    const q = generateQuestion(gameId);
    setQuestion(q);
    setFeedback(null);
    speak(q.text);
  }, [speak]);

  const startGame = useCallback((gameId: string) => {
    setSelectedGame(gameId);
    setScore(0);
    setCurrentRound(1);
    setGameState('playing');
    setTimeout(() => nextQuestion(gameId), 100);
  }, [nextQuestion]);

  const handleAnswer = useCallback(async (val: number | string) => {
    if (feedback || !question) return;

    const correct = val === question.answer;
    setFeedback({ selected: val, correct });

    if (correct) {
      setScore(s => s + 1);
      await speak(pickRandom(CORRECT_RESPONSES));
    } else {
      const resp = pickRandom(WRONG_RESPONSES);
      await speak(resp(question.answer));
    }

    // Speech finished — now advance
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound(r => r + 1);
      nextQuestion(selectedGame);
    } else {
      setGameState('results');
      const finalScore = correct ? score + 1 : score;
      if (finalScore >= 4) {
        speak(`Ура! Ты настоящий молодец! ${finalScore} из пяти правильных ответов! Так держать!`);
      } else if (finalScore >= 2) {
        speak(`Хорошо! ${finalScore} из пяти. Давай попробуем ещё раз и будет ещё лучше!`);
      } else {
        speak(`Ничего страшного! ${finalScore} из пяти. Давай потренируемся ещё!`);
      }
    }
  }, [feedback, question, currentRound, score, selectedGame, nextQuestion, speak]);

  const getOptionStyle = (opt: number | string) => {
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

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
        {gameState === 'selection' && (
          <div className="w-full space-y-3">
            <h3 className="text-center font-bold text-sky-800 text-lg mb-4">Выбери игру:</h3>
            {GAME_TYPES.map(g => (
              <button
                key={g.id}
                onClick={() => startGame(g.id)}
                className="w-full bg-white p-5 rounded-3xl shadow-md border-2 border-transparent active:border-sky-400 flex items-center gap-5 group transition-all"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{g.icon}</span>
                <div className="text-left">
                  <span className="text-lg font-bold text-sky-900 block">{g.name}</span>
                  <span className="text-sm text-slate-500">{g.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {gameState === 'playing' && question && (
          <div className="w-full space-y-6 animate-slide-in">
            <div className="flex justify-between items-center w-full bg-white/50 p-4 rounded-2xl">
              <span className="font-bold text-sky-700">Раунд {currentRound}/{TOTAL_ROUNDS}</span>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                  <span key={i} className={`text-xl ${i < score ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[36px] shadow-xl text-center space-y-5">
              {question.visual}
              <h4 className="text-xl font-bold text-slate-800 leading-relaxed">{question.text}</h4>
            </div>

            {feedback && (
              <div className={`text-center py-3 rounded-2xl font-bold text-lg animate-slide-in ${
                feedback.correct
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {feedback.correct ? '✅ Правильно!' : `❌ Ответ: ${question.answer}`}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {question.options.map((opt, idx) => (
                <button
                  key={`${opt}-${idx}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`p-6 rounded-[28px] shadow-lg text-2xl font-extrabold transition-all ${getOptionStyle(opt)}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center space-y-6 animate-slide-in w-full">
            <div className="text-8xl">{score >= 4 ? '🏆' : score >= 2 ? '👍' : '💪'}</div>
            <h3 className="text-3xl font-extrabold text-sky-900">
              {score >= 4 ? 'Отлично!' : score >= 2 ? 'Хорошо!' : 'Попробуй ещё!'}
            </h3>
            <p className="text-lg text-slate-600 font-medium">Ты заработал {score} из {TOTAL_ROUNDS} звёзд!</p>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <span key={i} className={`text-3xl ${i < score ? '' : 'opacity-20'}`}>⭐</span>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => startGame(selectedGame)}
                className="flex-1 bg-sky-600 text-white py-4 rounded-3xl font-bold text-lg shadow-lg hover:bg-sky-700 active:scale-95 transition-all"
              >
                Ещё раз
              </button>
              <button
                onClick={() => setGameState('selection')}
                className="flex-1 bg-white text-sky-600 py-4 rounded-3xl font-bold text-lg shadow-lg border-2 border-sky-200 hover:bg-sky-50 active:scale-95 transition-all"
              >
                Другая игра
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTrainer;
