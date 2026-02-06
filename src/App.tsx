
import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserProfile, UserRole, UserType, SubscriptionStatus, 
  SubscriptionInfo, AppState, ChatMessage 
} from './types';
import { ADMIN_TG_ID } from './constants';
import RegistrationForm from './components/RegistrationForm';
import Home from './components/Home';
import SubjectGrid from './components/SubjectGrid';
import AIChat from './components/AIChat';
import GameTrainer from './components/GameTrainer';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import { LegalModals } from './components/LegalModals';

const App: React.FC = () => {
  // Persistence states (Mocked for TMA)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo>({ status: SubscriptionStatus.NONE });
  const [appState, setAppState] = useState<AppState>({ testMode: false });
  const [currentScreen, setCurrentScreen] = useState<'home' | 'subjects' | 'chat' | 'game' | 'admin' | 'profile' | 'exams'>('home');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser && tgUser.id.toString() === ADMIN_TG_ID) {
        // Handle admin detection logic if needed on load
      }
    }
    
    // Check local storage for user profile
    const savedUser = localStorage.getItem('user_profile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleRegister = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setCurrentScreen('home');
    
    // If test mode is on, grant access immediately
    if (appState.testMode) {
      setSub({ status: SubscriptionStatus.TRIAL_ACTIVE });
    }
  };

  const handleToggleTestMode = () => {
    setAppState(prev => ({ 
      ...prev, 
      testMode: !prev.testMode, 
      lastTestBroadcastAt: !prev.testMode ? new Date().toISOString() : prev.lastTestBroadcastAt 
    }));
  };

  if (!user) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-height-screen animate-slide-in">
        <RegistrationForm onRegister={handleRegister} />
        <LegalModals />
      </div>
    );
  }

  const isAdmin = user.id.toString() === ADMIN_TG_ID;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home 
            user={user} 
            sub={sub} 
            appState={appState}
            onNavigate={setCurrentScreen} 
            onSelectSubject={setSelectedSubject}
            isAdmin={isAdmin}
          />
        );
      case 'subjects':
        return (
          <SubjectGrid 
            onBack={() => setCurrentScreen('home')} 
            onSelect={(id) => {
              setSelectedSubject(id);
              setCurrentScreen('chat');
            }}
          />
        );
      case 'exams':
        return (
          <SubjectGrid 
            isExam 
            onBack={() => setCurrentScreen('home')} 
            onSelect={(id) => {
              setSelectedSubject(id);
              setCurrentScreen('chat');
            }}
          />
        );
      case 'chat':
        return (
          <AIChat 
            user={user}
            subject={selectedSubject || 'General'}
            mode={selectedMode || 'explain'}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'game':
        return <GameTrainer onBack={() => setCurrentScreen('home')} />;
      case 'admin':
        return (
          <AdminDashboard 
            appState={appState}
            onToggleTest={handleToggleTestMode}
            onBack={() => setCurrentScreen('home')} 
          />
        );
      case 'profile':
        return (
          <Profile 
            user={user} 
            sub={sub} 
            onBack={() => setCurrentScreen('home')} 
            onLogout={() => {
              localStorage.removeItem('user_profile');
              setUser(null);
            }}
          />
        );
      default:
        return <Home user={user} sub={sub} appState={appState} onNavigate={setCurrentScreen} onSelectSubject={setSelectedSubject} isAdmin={isAdmin} />;
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
          {appState.testMode && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">🧪 Тестирование</span>
          )}
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-500 border border-slate-200 uppercase">
            {sub.status.replace('_', ' ')}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {renderScreen()}
      </main>

      {/* Navigation Footer */}
      <footer className="bg-white border-t px-4 py-2 flex justify-around items-center z-10">
        {/* Главная */}
        <button onClick={() => setCurrentScreen('home')} className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${currentScreen === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="text-[9px] font-bold">Главная</span>
        </button>

        {/* Поддержка */}
        <button onClick={() => { setSelectedSubject('Support'); setCurrentScreen('chat'); }} className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${currentScreen === 'chat' && selectedSubject === 'Support' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          <span className="text-[9px] font-bold">Помощь</span>
        </button>

        {/* Профиль */}
        <button onClick={() => setCurrentScreen('profile')} className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${currentScreen === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[9px] font-bold">Профиль</span>
        </button>

        {/* Тест — только для админа */}
        {isAdmin && (
          <button 
            onClick={handleToggleTestMode} 
            className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${appState.testMode ? 'text-amber-500' : 'text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            <span className="text-[9px] font-bold">{appState.testMode ? 'Тест ✓' : 'Тест'}</span>
          </button>
        )}

        {/* Стат — только для админа */}
        {isAdmin && (
          <button onClick={() => setCurrentScreen('admin')} className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-colors ${currentScreen === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span className="text-[9px] font-bold">Стат</span>
          </button>
        )}
      </footer>
    </div>
  );
};

export default App;
