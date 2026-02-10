// Fruit items with Russian names in different grammatical cases
export const FRUIT_ITEMS = [
  { emoji: '🍎', name: 'яблоко', plural: 'яблок', few: 'яблока', one: 'яблоко' },
  { emoji: '🍊', name: 'апельсин', plural: 'апельсинов', few: 'апельсина', one: 'апельсин' },
  { emoji: '🍋', name: 'лимон', plural: 'лимонов', few: 'лимона', one: 'лимон' },
  { emoji: '🍇', name: 'виноград', plural: 'гроздей винограда', few: 'грозди винограда', one: 'гроздь винограда' },
  { emoji: '🍓', name: 'клубника', plural: 'клубничек', few: 'клубнички', one: 'клубничка' },
  { emoji: '🍒', name: 'вишня', plural: 'вишен', few: 'вишни', one: 'вишня' },
  { emoji: '🍑', name: 'персик', plural: 'персиков', few: 'персика', one: 'персик' },
  { emoji: '🥝', name: 'киви', plural: 'киви', few: 'киви', one: 'киви' },
  { emoji: '🍌', name: 'банан', plural: 'бананов', few: 'банана', one: 'банан' },
  { emoji: '🍐', name: 'груша', plural: 'груш', few: 'груши', one: 'груша' },
];

export const RUSSIAN_LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ'.split('');

export const COLORS = [
  { name: 'красный', emoji: '🔴', color: 'bg-red-500' },
  { name: 'синий', emoji: '🔵', color: 'bg-blue-500' },
  { name: 'зелёный', emoji: '🟢', color: 'bg-green-500' },
  { name: 'жёлтый', emoji: '🟡', color: 'bg-yellow-400' },
  { name: 'оранжевый', emoji: '🟠', color: 'bg-orange-500' },
  { name: 'фиолетовый', emoji: '🟣', color: 'bg-purple-500' },
];

export const COLOR_MIXES = [
  { color1: 'красный', color2: 'жёлтый', result: 'оранжевый', bg1: 'bg-red-500', bg2: 'bg-yellow-400', bgResult: 'bg-orange-500' },
  { color1: 'красный', color2: 'синий', result: 'фиолетовый', bg1: 'bg-red-500', bg2: 'bg-blue-500', bgResult: 'bg-purple-500' },
  { color1: 'синий', color2: 'жёлтый', result: 'зелёный', bg1: 'bg-blue-500', bg2: 'bg-yellow-400', bgResult: 'bg-green-500' },
  { color1: 'красный', color2: 'белый', result: 'розовый', bg1: 'bg-red-500', bg2: 'bg-white border border-gray-300', bgResult: 'bg-pink-400' },
];

export const SHAPES = [
  { name: 'круг', emoji: '⬤', svg: 'circle' },
  { name: 'квадрат', emoji: '⬛', svg: 'square' },
  { name: 'треугольник', emoji: '▲', svg: 'triangle' },
  { name: 'звезда', emoji: '⭐', svg: 'star' },
  { name: 'сердце', emoji: '❤️', svg: 'heart' },
  { name: 'ромб', emoji: '🔷', svg: 'diamond' },
];

export const GAME_TYPES = [
  { id: 'count', name: 'Сосчитай предметы', icon: '🍎', description: 'Считаем фрукты и ягоды' },
  { id: 'letter', name: 'Найди букву', icon: '🅰️', description: 'Учим русские буквы' },
  { id: 'color', name: 'Угадай цвет', icon: '🎨', description: 'Узнаём цвета' },
  { id: 'colormix', name: 'Смешай цвета', icon: '🌈', description: 'Какой цвет получится?' },
  { id: 'math', name: 'Реши пример', icon: '➕', description: 'Простые примеры' },
  { id: 'shape', name: 'Угадай фигуру', icon: '🔷', description: 'Учим фигуры' },
];

// Helper to pick correct Russian plural form
export function russianPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
}

// Varied question prompts for counting
export const COUNT_PROMPTS = [
  (item: string, emoji: string) => `Давай посчитаем! Сколько ${item} ты видишь на картинке?`,
  (item: string, emoji: string) => `Посмотри внимательно! Сколько здесь ${item}?`,
  (item: string, emoji: string) => `А ну-ка, сосчитай! Сколько ${item} нарисовано?`,
  (item: string, emoji: string) => `Интересно, сколько же тут ${item}? Давай считать!`,
];

export const LETTER_PROMPTS = [
  (letter: string) => `Посмотри на букву ${letter}. Найди такую же среди ответов!`,
  (letter: string) => `Это буква ${letter}. Покажи, где она спряталась!`,
  (letter: string) => `Какая это буква? Правильно, ${letter}! А теперь найди её!`,
  (letter: string) => `Давай найдём букву ${letter}! Нажми на правильный ответ!`,
];

export const COLOR_PROMPTS = [
  (color: string) => `Посмотри на этот кружок. Какого он цвета?`,
  (color: string) => `А ты знаешь, какой это цвет? Выбери правильный ответ!`,
  (color: string) => `Угадай, какого цвета этот кружок!`,
];

export const CORRECT_RESPONSES = [
  'Молодец! Правильно!',
  'Отлично! Так держать!',
  'Умница! Верный ответ!',
  'Правильно! Ты молодец!',
  'Верно! Здорово!',
];

export const WRONG_RESPONSES = [
  (answer: string | number) => `Ой, не совсем. Правильный ответ: ${answer}. Ничего, попробуем ещё!`,
  (answer: string | number) => `Почти! Правильно было: ${answer}. В следующий раз получится!`,
  (answer: string | number) => `Не угадал. Ответ: ${answer}. Давай дальше!`,
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
