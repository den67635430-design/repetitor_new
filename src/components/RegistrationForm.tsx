
import React, { useState } from 'react';
import { UserProfile, UserRole, UserType } from '../types';
import { GOALS } from '../constants';

interface Props {
  onRegister: (user: UserProfile) => void;
}

const RegistrationForm: React.FC<Props> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<UserType>(UserType.SCHOOLER);
  const [classLevel, setClassLevel] = useState<number>(1);
  const [goal, setGoal] = useState(GOALS[0]);
  const [consents, setConsents] = useState({
    privacyPolicy: false,
    termsOfUse: false,
    dataProcessing: false
  });

  const isFormValid = name.length > 1 && consents.privacyPolicy && consents.termsOfUse && consents.dataProcessing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const profile: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role: UserRole.USER,
      type,
      classLevel: type === UserType.SCHOOLER ? classLevel : undefined,
      learningGoal: goal,
      registeredAt: new Date().toISOString(),
      consents
    };
    onRegister(profile);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-blue-900">Регистрация</h1>
        <p className="text-slate-500">Начните обучение с персональным AI-наставником</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Как вас зовут?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Ваше имя"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Кто будет учиться?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType(UserType.PRESCHOOLER)}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${type === UserType.PRESCHOOLER ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            >
              Дошкольник
            </button>
            <button
              type="button"
              onClick={() => setType(UserType.SCHOOLER)}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${type === UserType.SCHOOLER ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            >
              1-11 класс
            </button>
          </div>
        </div>

        {type === UserType.SCHOOLER && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ваш класс</label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Array.from({ length: 11 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} класс</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Цель обучения</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consents.privacyPolicy}
              onChange={(e) => setConsents({ ...consents, privacyPolicy: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 group-hover:text-slate-900">Я принимаю Политику конфиденциальности</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consents.termsOfUse}
              onChange={(e) => setConsents({ ...consents, termsOfUse: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 group-hover:text-slate-900">Я принимаю Условия использования</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consents.dataProcessing}
              onChange={(e) => setConsents({ ...consents, dataProcessing: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 group-hover:text-slate-900">Согласие на обработку данных</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${isFormValid ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
