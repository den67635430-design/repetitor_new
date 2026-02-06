import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onBack: () => void;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
      </>
    )}
  </svg>
);

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  autoComplete,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  label: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
};

const AuthPage: React.FC<Props> = ({ onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleResendEmail = async () => {
    if (!email.trim() || !validateEmail(email.trim())) {
      setError('Введите корректный email для повторной отправки');
      return;
    }

    setResending(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setSuccessMsg('Письмо отправлено повторно! Проверьте почту.');
      }
    } catch {
      setError('Ошибка при отправке. Попробуйте позже.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Некорректный email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Этот email уже зарегистрирован. Войдите в аккаунт.');
          } else {
            setError(signUpError.message);
          }
          return;
        }

        setSuccessMsg('Проверьте вашу почту для подтверждения регистрации!');
        setShowResend(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login')) {
            setError('Неверный email или пароль');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Email не подтверждён. Проверьте почту или отправьте письмо повторно.');
            setShowResend(true);
          } else {
            setError(signInError.message);
          }
          return;
        }
      }
    } catch {
      setError('Ошибка подключения. Проверьте интернет.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-slide-in">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h1 className="text-2xl font-extrabold text-blue-900">
              {mode === 'signup' ? 'Регистрация' : 'Вход'}
            </h1>
            <p className="text-slate-500 text-sm">
              {mode === 'signup'
                ? 'Создайте аккаунт для персонального обучения'
                : 'Войдите в свой аккаунт'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); setShowResend(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Регистрация
            </button>
            <button
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); setShowResend(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Вход
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Минимум 6 символов"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              label="Пароль"
            />

            {mode === 'signup' && (
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Ещё раз пароль"
                autoComplete="new-password"
                label="Повторите пароль"
              />
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                {successMsg}
              </div>
            )}

            {showResend && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Отправляем...' : '📩 Отправить письмо повторно'}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                loading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95'
              }`}
            >
              {loading ? 'Подождите...' : mode === 'signup' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>
        </div>

        {/* Legal */}
        <p className="text-center text-[10px] text-slate-400 mt-4">
          Регистрируясь, вы принимаете Политику конфиденциальности и Условия использования
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
