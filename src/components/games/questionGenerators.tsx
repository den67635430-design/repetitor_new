import React from 'react';
import {
  FRUIT_ITEMS, RUSSIAN_LETTERS, COLORS, COLOR_MIXES, SHAPES,
  COUNT_PROMPTS, LETTER_PROMPTS, COLOR_PROMPTS,
  russianPlural, pickRandom,
} from './gameData';

export type GameQuestion = {
  text: string;
  visual: React.ReactNode;
  options: (number | string)[];
  answer: number | string;
};

export function generateCountQuestion(): GameQuestion {
  const num = Math.floor(Math.random() * 7) + 1;
  const item = pickRandom(FRUIT_ITEMS);
  const itemName = russianPlural(num, item.one, item.few, item.plural);
  
  const optionsSet = new Set<number>([num]);
  while (optionsSet.size < 4) {
    const opt = Math.floor(Math.random() * 9) + 1;
    if (opt > 0) optionsSet.add(opt);
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  const prompt = pickRandom(COUNT_PROMPTS);

  return {
    text: prompt(item.plural, item.emoji),
    visual: (
      <div className="flex flex-wrap justify-center gap-3">
        {Array(num).fill(null).map((_, i) => (
          <span key={i} className="text-5xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
            {item.emoji}
          </span>
        ))}
      </div>
    ),
    options,
    answer: num,
  };
}

export function generateLetterQuestion(): GameQuestion {
  const targetIdx = Math.floor(Math.random() * RUSSIAN_LETTERS.length);
  const targetLetter = RUSSIAN_LETTERS[targetIdx];
  const optionsSet = new Set<string>([targetLetter]);
  while (optionsSet.size < 4) {
    optionsSet.add(pickRandom(RUSSIAN_LETTERS));
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  const prompt = pickRandom(LETTER_PROMPTS);

  return {
    text: prompt(targetLetter),
    visual: (
      <div className="text-8xl font-extrabold text-sky-600 animate-pulse">
        {targetLetter}
      </div>
    ),
    options,
    answer: targetLetter,
  };
}

export function generateColorQuestion(): GameQuestion {
  const target = pickRandom(COLORS);
  const optionsSet = new Set<string>([target.name]);
  while (optionsSet.size < 4) {
    optionsSet.add(pickRandom(COLORS).name);
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  const prompt = pickRandom(COLOR_PROMPTS);

  return {
    text: prompt(target.name),
    visual: (
      <div className={`w-28 h-28 rounded-full mx-auto ${target.color} shadow-xl ring-4 ring-white`} />
    ),
    options,
    answer: target.name,
  };
}

export function generateColorMixQuestion(): GameQuestion {
  const mix = pickRandom(COLOR_MIXES);
  
  const allResults = [mix.result, ...COLOR_MIXES.filter(m => m.result !== mix.result).map(m => m.result)];
  const uniqueResults = [...new Set(allResults)];
  // Add extra colors if needed
  const extraColors = ['красный', 'синий', 'жёлтый', 'белый'].filter(c => !uniqueResults.includes(c));
  while (uniqueResults.length < 4) {
    uniqueResults.push(extraColors.pop()!);
  }
  const options = uniqueResults.slice(0, 4).sort(() => Math.random() - 0.5);

  return {
    text: `Если смешать ${mix.color1} и ${mix.color2}, какой цвет получится?`,
    visual: (
      <div className="flex items-center justify-center gap-4">
        <div className={`w-20 h-20 rounded-full ${mix.bg1} shadow-lg`} />
        <span className="text-4xl font-bold text-sky-700">+</span>
        <div className={`w-20 h-20 rounded-full ${mix.bg2} shadow-lg`} />
        <span className="text-4xl font-bold text-sky-700">=</span>
        <span className="text-5xl">❓</span>
      </div>
    ),
    options,
    answer: mix.result,
  };
}

export function generateMathQuestion(): GameQuestion {
  const isAddition = Math.random() > 0.3;
  let a: number, b: number, answer: number, text: string;

  if (isAddition) {
    a = Math.floor(Math.random() * 8) + 1;
    b = Math.floor(Math.random() * (10 - a)) + 1;
    answer = a + b;
    text = `Сколько будет ${a} плюс ${b}?`;
  } else {
    answer = Math.floor(Math.random() * 5) + 1;
    b = Math.floor(Math.random() * 5) + 1;
    a = answer + b;
    text = `Сколько будет ${a} минус ${b}?`;
  }

  const optionsSet = new Set<number>([answer]);
  while (optionsSet.size < 4) {
    const opt = answer + Math.floor(Math.random() * 7) - 3;
    if (opt > 0 && opt <= 20) optionsSet.add(opt);
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  const op = isAddition ? '+' : '−';
  return {
    text,
    visual: (
      <div className="text-6xl font-extrabold text-sky-800 tracking-wider">
        {a} {op} {b} = ?
      </div>
    ),
    options,
    answer,
  };
}

export function generateShapeQuestion(): GameQuestion {
  const target = pickRandom(SHAPES);
  const optionsSet = new Set<string>([target.name]);
  while (optionsSet.size < 4) {
    optionsSet.add(pickRandom(SHAPES).name);
  }
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  const shapeColors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500'];
  const color = pickRandom(shapeColors);

  return {
    text: `Как называется эта фигура? Посмотри внимательно!`,
    visual: (
      <div className={`text-8xl ${color}`}>
        {target.emoji}
      </div>
    ),
    options,
    answer: target.name,
  };
}

export function generateQuestion(gameType: string): GameQuestion {
  switch (gameType) {
    case 'letter': return generateLetterQuestion();
    case 'color': return generateColorQuestion();
    case 'colormix': return generateColorMixQuestion();
    case 'math': return generateMathQuestion();
    case 'shape': return generateShapeQuestion();
    default: return generateCountQuestion();
  }
}
