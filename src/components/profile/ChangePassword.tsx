import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ChangePassword: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async () => {
    setMsg(null);
    if (newPw.length < 6) {
      setMsg({ type: 'err', text: 'Минимум 6 символов' });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: 'err', text: 'Пароли не совпадают' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      setMsg({ type: 'err', text: error.message });
    } else {
      setMsg({ type: 'ok', text: 'Пароль успешно изменён!' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    }
    setLoading(false);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔑</span>
          <span className="text-sm font-bold text-slate-800">Сменить пароль</span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="p-4 pt-0 space-y-3 animate-slide-in">
          <p className="text-xs text-slate-500">
            🔒 Текущий пароль невозможно просмотреть — он хранится в зашифрованном виде для вашей безопасности.
          </p>
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <input
            type="password"
            placeholder="Подтвердите новый пароль"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          {msg && (
            <p className={`text-xs font-medium ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
              {msg.text}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Сохраняю...' : 'Сменить пароль'}
          </button>
        </div>
      )}
    </section>
  );
};

export default ChangePassword;
