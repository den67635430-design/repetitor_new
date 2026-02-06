import React from 'react';
import { useAdminStats } from '../hooks/useAdminStats';

interface Props {
  testMode: boolean;
  onToggleTest: () => void;
  onBack: () => void;
}

const AdminDashboard: React.FC<Props> = ({ testMode, onToggleTest, onBack }) => {
  const { stats, loading, refresh } = useAdminStats();

  const statCards = [
    { label: 'Всего пользователей', value: stats.totalUsers.toString() },
    { label: 'Регистрации сегодня', value: stats.todayRegistrations.toString() },
    { label: 'Всего чат-сессий', value: stats.totalSessions.toString() },
    { label: 'Всего сообщений', value: stats.totalMessages.toString() },
    { label: 'Активных устройств', value: stats.activeDevices.toString() },
    { label: 'Топ предмет', value: stats.topSubject },
  ];

  return (
    <div className="p-5 space-y-6 animate-slide-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-extrabold text-slate-900">Админ-панель</h2>
        <button
          onClick={refresh}
          className="ml-auto p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"
          title="Обновить"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>

      {/* Test Mode Control */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="font-bold text-slate-800">Управление режимами</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div>
            <p className="font-bold text-slate-900 text-sm">Тестовый режим (Global)</p>
            <p className="text-[10px] text-slate-500">Скрывает цены, открывает доступ всем</p>
          </div>
          <button 
            onClick={onToggleTest}
            className={`w-14 h-8 rounded-full relative transition-colors ${testMode ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${testMode ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
        {testMode && (
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl font-medium">
            ⚠️ Тестовый режим активен. Пользователи не видят платные тарифы. Все видят баннер «Тестирование».
          </p>
        )}
      </section>

      {/* Statistics */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Статистика (live)</h3>
          {loading && (
            <span className="text-xs text-slate-400 animate-pulse">Загрузка...</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{s.label}</p>
              <span className="text-lg font-extrabold text-blue-900">{s.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
