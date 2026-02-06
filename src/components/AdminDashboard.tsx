
import React from 'react';
import { AppState } from '../types';

interface Props {
  appState: AppState;
  onToggleTest: () => void;
  onBack: () => void;
}

const AdminDashboard: React.FC<Props> = ({ appState, onToggleTest, onBack }) => {
  const stats = [
    { label: 'Всего пользователей', value: '1,245', trend: '+12%' },
    { label: 'Открытия Mini App', value: '45,890', trend: '+5%' },
    { label: 'Регистрации сегодня', value: '89', trend: '+22%' },
    { label: 'Активации триала', value: '640', trend: '+18%' },
    { label: 'Retention (D7)', value: '42%', trend: '-2%' },
    { label: 'Топ предмет', value: 'Математика', trend: '' },
  ];

  return (
    <div className="p-5 space-y-6 animate-slide-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-extrabold text-slate-900">Админ-панель</h2>
      </div>

      {/* Control Panel */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="font-bold text-slate-800">Управление режимами</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div>
            <p className="font-bold text-slate-900 text-sm">Тестовый режим (Global)</p>
            <p className="text-[10px] text-slate-500">Скрывает цены, открывает доступ всем</p>
          </div>
          <button 
            onClick={onToggleTest}
            className={`w-14 h-8 rounded-full relative transition-colors ${appState.testMode ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${appState.testMode ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Статистика</h3>
          <button className="text-blue-600 text-xs font-bold px-3 py-1 bg-blue-50 rounded-full">Экспорт CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{s.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-lg font-extrabold text-blue-900">{s.value}</span>
                <span className={`text-[10px] font-bold ${s.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {s.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Events */}
      <section className="space-y-3">
        <h3 className="font-bold text-slate-800">Последние действия</h3>
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                <div>
                  <p className="text-xs font-bold">User_{Math.floor(Math.random()*1000)}</p>
                  <p className="text-[10px] text-slate-500">Зарегистрировался в системе</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">2 мин назад</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
