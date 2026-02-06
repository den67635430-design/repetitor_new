
import React from 'react';
import { UserProfile, SubscriptionInfo, SubscriptionStatus } from '../types';

interface Props {
  user: UserProfile;
  sub: SubscriptionInfo;
  onBack: () => void;
  onLogout: () => void;
}

const Profile: React.FC<Props> = ({ user, sub, onBack, onLogout }) => {
  return (
    <div className="p-5 space-y-6 animate-slide-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-extrabold text-slate-900">Профиль</h2>
      </div>

      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center space-y-4">
        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-4xl">
          {user.type === 'PRESCHOOLER' ? '👶' : '👨‍🎓'}
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">{user.name}</h3>
          <p className="text-slate-500 text-sm font-medium">
            {user.type === 'PRESCHOOLER' ? 'Дошкольник' : `${user.classLevel} класс`}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="font-bold text-slate-800 ml-1">Личный кабинет ученика</h4>
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          <ProfileItem icon="📈" label="Ваш прогресс" value="75%" />
          <ProfileItem icon="🕒" label="История сессий" value="12 занятий" />
          <ProfileItem icon="🎯" label="Цель" value={user.learningGoal} />
          <div className="p-4 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <span className="font-bold text-blue-900 text-sm">Ваша подписка</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${sub.status.includes('active') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
              {sub.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-3 pt-4">
        <button 
          onClick={() => {}} 
          className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
        >
          Настройки уведомлений
        </button>
        <button 
          onClick={onLogout} 
          className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>

      <div className="text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {user.id}</p>
      </div>
    </div>
  );
};

const ProfileItem: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <span className="text-sm font-bold text-slate-900">{value}</span>
  </div>
);

export default Profile;
