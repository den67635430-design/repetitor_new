import React, { useState, useEffect } from 'react';
import { SubscriptionStatus, SubscriptionInfo } from './types';
import { useAuth } from './hooks/useAuth';
import { useDeviceLimit } from './hooks/useDeviceLimit';
import { useAppSettings } from './hooks/useAppSettings';
import WelcomePage from './components/WelcomePage';
import AuthPage from './components/AuthPage';
import SetupProfile from './components/SetupProfile';
import Home from './components/Home';
import SubjectGrid from './components/SubjectGrid';
import AIChat from './components/AIChat';
import GameTrainer from './components/GameTrainer';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import PricingPage from './components/PricingPage';

type Screen = 'welcome' | 'auth' | 'setup' | 'home' | 'subjects' | 'preschool' | 'chat' | 'game' | 'admin' | 'profile' | 'exams' | 'pricing';

const App: React.FC = () => {
  const { user, profile, isAdmin, loading, signOut, hasProfile, refreshProfile } = useAuth();
  const { checkAndRegisterDevice } = useDeviceLimit();
  const { testMode, toggleTestMode } = useAppSettings();
  const [sub, setSub] = useState<SubscriptionInfo>({ status: SubscriptionStatus.NONE });
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [deviceBlocked, setDeviceBlocked] = useState<string | null>(null);

  // Route user based on auth state
  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (currentScreen !== 'auth') setCurrentScreen('welcome');
      return;
    }
    if (!hasProfile) {
      setCurrentScreen('setup');
      return;
    }
    if (['welcome', 'auth', 'setup'].includes(currentScreen)) {
      setCurrentScreen('home');
    }
  }, [user, hasProfile, loading]);

  // Device limit check — skip in test mode
  useEffect(() => {
    if (user && hasProfile) {
      if (testMode) {
        // In test mode, register device but don't block
        checkAndRegisterDevice(user.id);
        setDeviceBlocked(null);
      } else {
        checkAndRegisterDevice(user.id).then(result => {
          if (!result.allowed) {
            setDeviceBlocked(result.message || 'Превышен лимит устройств.');
          } else {
            setDeviceBlocked(null);
          }
        });
      }
    }
  }, [user, hasProfile, testMode]);

  // Telegram WebApp init
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    setCurrentScreen('welcome');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
            <span className="text-3xl">📚</span>
          </div>
          <p className="text-slate-500 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (deviceBlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl">🔒</div>
          <h2 className="text-xl font-bold text-slate-900">Лимит устройств</h2>
          <p className="text-slate-600 text-sm">{deviceBlocked}</p>
          <button onClick={handleLogout} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">
            Выйти
          </button>
        </div>
      </div>
    );
  }

  // Welcome page (no auth)
  if (currentScreen === 'welcome' && !user) {
    return <WelcomePage onStart={() => setCurrentScreen('auth')} />;
  }

  // Auth page
  if (currentScreen === 'auth' && !user) {
    return <AuthPage onBack={() => setCurrentScreen('welcome')} />;
  }

  // Profile setup
  if (currentScreen === 'setup' && user && !hasProfile) {
    return <SetupProfile userId={user.id} onComplete={() => refreshProfile()} />;
  }

  // If user not logged in at this point, go to welcome
  if (!user || !profile) {
    return <WelcomePage onStart={() => setCurrentScreen('auth')} />;
  }

  const userProfile = {
    id: user.id,
    name: profile.name,
    type: profile.user_type as any,
    classLevel: profile.class_level ?? undefined,
    learningGoal: profile.learning_goal,
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home
            user={{ ...userProfile, role: 'USER' as any, registeredAt: '', consents: { privacyPolicy: true, termsOfUse: true, dataProcessing: true } }}
            sub={sub}
            testMode={testMode}
            isAdmin={isAdmin}
            onNavigate={(screen: string) => {
              if (screen === 'logout') {
                handleLogout();
              } else {
                (setCurrentScreen as any)(screen);
              }
            }}
            onSelectSubject={setSelectedSubject}
          />
        );
      case 'subjects':
        return (
          <SubjectGrid
            onBack={() => setCurrentScreen('home')}
            onSelect={(id) => { setSelectedSubject(id); setCurrentScreen('chat'); }}
          />
        );
      case 'exams':
        return (
          <SubjectGrid
            isExam
            onBack={() => setCurrentScreen('home')}
            onSelect={(id) => { setSelectedSubject(id); setCurrentScreen('chat'); }}
          />
        );
      case 'preschool':
        return (
          <SubjectGrid
            isPreschool
            onBack={() => setCurrentScreen('home')}
            onSelect={(id) => { setSelectedSubject(id); setCurrentScreen('chat'); }}
          />
        );
      case 'chat':
        return (
          <AIChat
            user={{ ...userProfile, role: 'USER' as any, registeredAt: '', consents: { privacyPolicy: true, termsOfUse: true, dataProcessing: true } }}
            subject={selectedSubject || 'General'}
            mode={selectedMode || 'explain'}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'pricing':
        return (
          <PricingPage
            onBack={() => setCurrentScreen('home')}
            onSelectPlan={(planId) => {
              console.log('Selected plan:', planId);
              // TODO: integrate with YooKassa payment
            }}
          />
        );
      case 'game':
        return <GameTrainer onBack={() => setCurrentScreen('home')} />;
      case 'admin':
        return (
          <AdminDashboard
            testMode={testMode}
            onToggleTest={toggleTestMode}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'profile':
        return (
          <Profile
            user={{ ...userProfile, role: 'USER' as any, registeredAt: '', consents: { privacyPolicy: true, termsOfUse: true, dataProcessing: true } }}
            sub={sub}
            onBack={() => setCurrentScreen('home')}
            onLogout={handleLogout}
            onUpdateProfile={refreshProfile}
            username={profile.username}
            clientId={profile.client_id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">РпР</div>
          <span className="font-bold text-blue-900 tracking-tight">Репетитор под рукой</span>
        </div>
        <div className="flex items-center gap-3">
          {testMode && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">
              🧪 Тестирование
            </span>
          )}
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-500 border border-slate-200 uppercase">
            {sub.status.replace('_', ' ')}
          </span>
        </div>
      </header>

      {/* Test Mode Banner for all users */}
      {testMode && !isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs text-amber-700 font-semibold">
            🧪 Приложение находится в режиме тестирования. Платные услуги временно недоступны.
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">{renderScreen()}</main>

      {/* Navigation Footer */}
      <footer className="bg-white border-t px-4 py-2 flex justify-around items-center z-10">
        <NavButton
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
          label="Главная"
          active={currentScreen === 'home'}
          onClick={() => setCurrentScreen('home')}
        />
        <NavButton
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />}
          label="Помощь"
          active={currentScreen === 'chat' && selectedSubject === 'Support'}
          onClick={() => { setSelectedSubject('Support'); setCurrentScreen('chat'); }}
        />
        <NavButton
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
          label="Профиль"
          active={currentScreen === 'profile'}
          onClick={() => setCurrentScreen('profile')}
        />
        {isAdmin && (
          <NavButton
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />}
            label={testMode ? 'Тест ✓' : 'Тест'}
            active={testMode}
            activeColor="text-amber-500"
            onClick={toggleTestMode}
          />
        )}
        {isAdmin && (
          <NavButton
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
            label="Стат"
            active={currentScreen === 'admin'}
            onClick={() => setCurrentScreen('admin')}
          />
        )}
      </footer>
    </div>
  );
};

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}> = ({ icon, label, active, activeColor, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${
      active ? (activeColor || 'text-blue-600') : 'text-slate-400'
    }`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icon}
    </svg>
    <span className="text-[9px] font-bold">{label}</span>
  </button>
);

export default App;
