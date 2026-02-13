import React from 'react';
import { UserProfile, SubscriptionInfo, SubscriptionStatus } from '../types';
import { useTrial } from '@/hooks/useTrial';

interface Props {
  user: UserProfile;
  sub: SubscriptionInfo;
  testMode: boolean;
  isAdmin: boolean;
  onNavigate: (screen: any) => void;
  onSelectSubject: (id: string) => void;
}

const Home: React.FC<Props> = ({ user, sub, testMode, isAdmin, onNavigate, onSelectSubject }) => {
  const { trial, startTrial } = useTrial(user.id);

  return (
    <div className="p-5 space-y-6 animate-slide-in">
      {/* Welcome Section */}
      <section className="flex items-center gap-4">
        <button onClick={() => onNavigate('logout')} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Привет, {user.name}! 👋</h2>
          <p className="text-slate-500">Готовы к новым знаниям сегодня?</p>
        </div>
      </section>

      {/* Subscription / Trial Status Card */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Ваш статус</p>
            <h3 className="text-lg font-bold">
              {testMode ? 'Тестовый доступ активен' : 
               sub.status === SubscriptionStatus.SUBSCRIBED_ACTIVE ? 'Подписка активна' :
               trial.isTrialActive ? `Пробный период — ${trial.trialDaysLeft} дн.` :
               trial.hasTrialStarted ? 'Пробный период завершён' :
               'Попробуйте бесплатно!'}
            </h3>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        </div>
        
        {!testMode && (
          !trial.hasTrialStarted && sub.status !== SubscriptionStatus.SUBSCRIBED_ACTIVE ? (
            <button 
              onClick={startTrial}
              className="w-full bg-white text-blue-700 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              🎁 Начать бесплатно — 10 дней
            </button>
          ) : (
            <button 
              onClick={() => onNavigate('pricing')}
              className="w-full bg-white text-blue-700 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              {sub.status === SubscriptionStatus.SUBSCRIBED_ACTIVE ? 'Управление подпиской' : 'Активировать полный доступ'}
            </button>
          )
        )}
      </section>
      {/* Main Grid */}
      <section className="grid grid-cols-2 gap-4">
        <MenuButton 
          title="Выбрать предмет" 
          emoji="📚" 
          onClick={() => onNavigate('subjects')} 
          color="bg-emerald-50 text-emerald-700 border-emerald-100"
        />
        <MenuButton 
          title="Подготовка к ОГЭ" 
          emoji="📝" 
          onClick={() => onNavigate('oge')} 
          color="bg-amber-50 text-amber-700 border-amber-100"
        />
        <MenuButton 
          title="Подготовка к ЕГЭ" 
          emoji="🎓" 
          onClick={() => onNavigate('ege')} 
          color="bg-rose-50 text-rose-700 border-rose-100"
        />
        <MenuButton 
          title="Подготовка к ВПР" 
          emoji="📋" 
          onClick={() => onNavigate('vpr')} 
          color="bg-teal-50 text-teal-700 border-teal-100"
        />
        <MenuButton 
          title="Дошкольники" 
          emoji="👶" 
          onClick={() => onNavigate('preschool')} 
          color="bg-sky-50 text-sky-700 border-sky-100"
        />
        <MenuButton 
          title="Игра-тренажёр" 
          emoji="🎮" 
          onClick={() => onNavigate('game')} 
          color="bg-violet-50 text-violet-700 border-violet-100"
        />
        <MenuButton 
          title="Поддержка (AI)" 
          emoji="💬" 
          onClick={() => {
            onSelectSubject('Support');
            onNavigate('chat');
          }} 
          color="bg-slate-50 text-slate-700 border-slate-100"
        />
      </section>

      {/* Footer Banner */}
      <div className="flex flex-col items-center justify-center pt-10 pb-4 opacity-30">
        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Powered by @kontentcod</p>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ title: string; emoji: string; onClick: () => void; color: string }> = ({ title, emoji, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`${color} border flex flex-col items-center justify-center gap-3 p-6 rounded-3xl shadow-sm hover:shadow-md active:scale-95 transition-all`}
  >
    <span className="text-4xl">{emoji}</span>
    <span className="font-bold text-center text-sm leading-tight">{title}</span>
  </button>
);

export default Home;
