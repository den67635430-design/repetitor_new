import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onSelectPlan: (planId: string) => void;
}

const PLANS = [
  {
    id: 'preschool',
    name: 'Дошкольники',
    subtitle: 'Для малышей 5-7 лет',
    monthlyPrice: 1490,
    quarterlyPrice: 990,
    features: [
      'Игровое обучение',
      'Буквы, цифры, цвета',
      'Голосовой режим',
      'Родительский контроль',
    ],
    popular: false,
    cta: 'Выбрать',
  },
  {
    id: 'basic',
    name: 'Базовый',
    subtitle: '1-11 класс · 1 предмет',
    monthlyPrice: 1490,
    quarterlyPrice: 990,
    features: [
      '1 предмет на выбор',
      'Безлимитное время',
      'Голос + текст',
      'Родительский контроль',
    ],
    popular: false,
    cta: 'Выбрать',
  },
  {
    id: 'standard',
    name: 'Стандарт',
    subtitle: '1-11 класс',
    monthlyPrice: 1990,
    quarterlyPrice: 1330,
    features: [
      '3 предмета на выбор',
      'Безлимитное время',
      'Голос + текст',
      'Родительский контроль',
      'Проверка домашки',
    ],
    popular: true,
    cta: 'Начать бесплатно',
  },
  {
    id: 'premium',
    name: 'Премиум',
    subtitle: 'Всё включено',
    monthlyPrice: 2990,
    quarterlyPrice: 1990,
    features: [
      'ВСЕ предметы',
      'Безлимит',
      'Все функции',
      'Приоритетная поддержка',
      'Подготовка к ЕГЭ/ОГЭ',
    ],
    popular: false,
    cta: 'Выбрать',
  },
];

const PricingPage: React.FC<Props> = ({ onBack, onSelectPlan }) => {
  const [isQuarterly, setIsQuarterly] = useState(false);

  return (
    <div className="min-h-full bg-slate-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-900">Тарифы</h1>
      </div>

      {/* Subtitle */}
      <div className="text-center pt-6 pb-4 px-4">
        <p className="text-slate-500 text-sm">
          Сэкономьте до 60% при оплате за 3 месяца
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white border border-slate-200 rounded-full p-1 flex gap-1 shadow-sm">
          <button
            onClick={() => setIsQuarterly(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              !isQuarterly
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Помесячно
          </button>
          <button
            onClick={() => setIsQuarterly(true)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              isQuarterly
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            От 3 месяцев
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              -33%
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="px-4 space-y-4">
        {PLANS.map((plan) => {
          const price = isQuarterly ? plan.quarterlyPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-6 shadow-sm border-2 transition-all ${
                plan.popular
                  ? 'border-blue-500 shadow-lg shadow-blue-100'
                  : 'border-slate-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                    ⭐ Популярный
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-sm">{plan.subtitle}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-black text-slate-900">{price}₽</span>
                <span className="text-slate-400 text-sm font-medium">/месяц</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 ${
                        plan.popular ? 'text-blue-500' : 'text-slate-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer guarantees */}
      <div className="px-4 mt-8 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-lg">✅</span>
          <span className="text-xs text-slate-500">Первый месяц бесплатно в тестовом режиме</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-lg">✅</span>
          <span className="text-xs text-slate-500">Отмена в любой момент</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-lg">✅</span>
          <span className="text-xs text-slate-500">Возврат денег в течение 14 дней</span>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
