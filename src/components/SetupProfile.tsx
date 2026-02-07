import React, { useState } from 'react';
import { UserType } from '../types';
import { GOALS } from '../constants';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  userId: string;
  onComplete: () => void;
}

const SetupProfile: React.FC<Props> = ({ userId, onComplete }) => {
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<UserType>(UserType.SCHOOLER);
  const [classLevel, setClassLevel] = useState<number>(1);
  const [goal, setGoal] = useState(GOALS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const generatedUsername = name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 4);
      
      const { error: insertError } = await supabase.from('profiles').insert({
        user_id: userId,
        name: name.trim(),
        user_type: userType,
        class_level: userType === UserType.SCHOOLER ? classLevel : null,
        learning_goal: goal,
        username: generatedUsername,
      });

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          // Profile already exists, update it
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: name.trim(),
              user_type: userType,
              class_level: userType === UserType.SCHOOLER ? classLevel : null,
              learning_goal: goal,
            })
            .eq('user_id', userId);

          if (updateError) {
            setError('Не удалось сохранить профиль. Попробуйте снова.');
            return;
          }
        } else {
          setError('Не удалось сохранить профиль. Попробуйте снова.');
          return;
        }
      }

      onComplete();
    } catch {
      setError('Ошибка подключения. Проверьте интернет.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-slide-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-blue-900">Настройка профиля</h1>
          <p className="text-slate-500 text-sm">Расскажите о себе, чтобы AI подстроился под вас</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Как вас зовут?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ваше имя"
              maxLength={50}
            />
          </div>

          {/* User type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Кто будет учиться?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType(UserType.PRESCHOOLER)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  userType === UserType.PRESCHOOLER
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                👶 Дошкольник
              </button>
              <button
                type="button"
                onClick={() => setUserType(UserType.SCHOOLER)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  userType === UserType.SCHOOLER
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                📚 1–11 класс
              </button>
            </div>
          </div>

          {/* Class level (always visible, but only for schooler type) */}
          {userType === UserType.SCHOOLER && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ваш класс</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} класс
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Цель обучения</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              isValid && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Сохраняю...' : 'Начать обучение'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupProfile;
