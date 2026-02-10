import React, { useState, useEffect } from 'react';
import { UserProfile, SubscriptionInfo, SubscriptionStatus, UserType } from '../types';
import { supabase } from '@/integrations/supabase/client';
import ChangePassword from './profile/ChangePassword';

interface Props {
  user: UserProfile;
  sub: SubscriptionInfo;
  onBack: () => void;
  onLogout: () => void;
  onUpdateProfile: () => void;
  username?: string | null;
  clientId?: number | null;
}

const Profile: React.FC<Props> = ({ user, sub, onBack, onLogout, onUpdateProfile, username, clientId }) => {
  const [editingType, setEditingType] = useState(false);
  const [selectedType, setSelectedType] = useState(user.type);
  const [classLevel, setClassLevel] = useState(user.classLevel ?? 1);
  const [saving, setSaving] = useState(false);
  const [voicePreference, setVoicePreference] = useState<string>('female');
  const [voiceSaving, setVoiceSaving] = useState(false);

  useEffect(() => {
    const fetchVoice = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('voice_preference')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { voice_preference: string } | null };
      if (data?.voice_preference) {
        setVoicePreference(data.voice_preference);
      }
    };
    fetchVoice();
  }, [user.id]);

  const handleSaveVoice = async (voice: string) => {
    setVoicePreference(voice);
    setVoiceSaving(true);
    await supabase
      .from('profiles')
      .update({ voice_preference: voice } as any)
      .eq('user_id', user.id);
    setVoiceSaving(false);
    // Play voice preview
    playVoicePreview(voice);
  };

  const playVoicePreview = async (voice: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: 'Привет! Чем могу помочь?',
            voiceId: voice,
          }),
        }
      );
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    } catch (e) {
      console.error('Voice preview failed:', e);
    }
  };

  const handleSaveType = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        user_type: selectedType,
        class_level: selectedType === UserType.SCHOOLER ? classLevel : null,
      })
      .eq('user_id', user.id);

    if (!error) {
      onUpdateProfile();
      setEditingType(false);
    }
    setSaving(false);
  };

  return (
    <div className="p-5 space-y-6 animate-slide-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-extrabold text-slate-900">Профиль</h2>
      </div>

      {/* Avatar & Name */}
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
        <div className="flex flex-col items-center gap-1 pt-2 border-t border-slate-100">
          {username && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Username:</span> {username}
            </p>
          )}
          {clientId && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">ID клиента:</span> #{clientId}
            </p>
          )}
        </div>
      </section>

      {/* Change Password */}
      <ChangePassword />

      {/* Change Type */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setEditingType(!editingType)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔄</span>
            <span className="text-sm font-bold text-slate-800">Сменить тип обучения</span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${editingType ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {editingType && (
          <div className="p-4 pt-0 space-y-3 animate-slide-in">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedType(UserType.PRESCHOOLER)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  selectedType === UserType.PRESCHOOLER
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                👶 Дошкольник
              </button>
              <button
                onClick={() => setSelectedType(UserType.SCHOOLER)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  selectedType === UserType.SCHOOLER
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                📚 1–11 класс
              </button>
            </div>

            {selectedType === UserType.SCHOOLER && (
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} класс</option>
                ))}
              </select>
            )}

            <button
              onClick={handleSaveType}
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
          </div>
        )}
      </section>

      {/* Voice Selection */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">🔊</span>
            <span className="text-sm font-bold text-slate-800">Голос озвучки</span>
            {voiceSaving && <span className="text-[10px] text-blue-500 animate-pulse">Сохраняю...</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSaveVoice('female')}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                voicePreference === 'female'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              👩 Женский
            </button>
            <button
              onClick={() => handleSaveVoice('male')}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                voicePreference === 'male'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              👨 Мужской
            </button>
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="space-y-3">
        <h4 className="font-bold text-slate-800 ml-1">Личный кабинет ученика</h4>
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          <ProfileItem icon="🎯" label="Цель" value={user.learningGoal ?? 'Не указана'} />
          <div className="p-4 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <span className="font-bold text-blue-900 text-sm">Ваша подписка</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                sub.status.includes('active') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {sub.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <button
          onClick={onLogout}
          className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-colors"
        >
          Выйти из аккаунта
        </button>
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
