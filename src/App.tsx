import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { DiagnosticWorkbench } from './components/DiagnosticWorkbench';
import { ClassBalanceLab } from './components/ClassBalanceLab';
import { ArchitectureStudio } from './components/ArchitectureStudio';
import { AblationMatrix } from './components/AblationMatrix';
import { ProfileAuthModal, AuthModalTab } from './components/ProfileAuthModal';
import { AppUser, TabType } from './types';
import { getCurrentSession } from './utils/authStorage';
import { Activity, Sun, Moon, LogIn, UserPlus, Menu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentUser, setCurrentUser] = useState<AppUser>(() => getCurrentSession());
  // Pop up login page upon entering the application
  const [authModalOpen, setAuthModalOpen] = useState(true);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Theme: 'dark' (Drake Mode - All in Black)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('dermafusion_theme');
      if (saved === 'light') return 'light';
      return 'dark'; // Drake Mode default (All in Black)
    } catch {
      return 'dark';
    }
  });

  // Synchronize theme with DOM root and localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dermafusion_theme', theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('theme-light', 'light');
      } else {
        root.classList.remove('dark');
        root.classList.add('theme-light', 'light');
      }
    } catch (err) {
      console.error('Failed to persist theme', err);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenAuthModal = (tab: AuthModalTab) => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleNavigate = (tab: TabType) => {
    setActiveTab(tab);
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'home':
        return 'Home & Overview';
      case 'workbench':
        return 'Diagnostic Workbench';
      case 'architecture':
        return 'Dual-Stream Architecture';
      case 'class_balance':
        return 'Class-Balance Lab';
      case 'ablation':
        return 'Ablation & Benchmarks';
    }
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500 selection:text-black dark:selection:text-white transition-colors duration-200"
    >
      {/* Vertical Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Header Bar with Mobile Menu Toggle, Breadcrumb, Drake/Light Mode Switcher & Login/Sign-Up */}
        <header className="border-b border-neutral-200 dark:border-neutral-850 bg-white/95 dark:bg-black/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-20 transition-colors shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            {/* Mobile Hamburger Menu Toggle Button with white animation in Drake mode */}
            <button
              type="button"
              id="topbar-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-black dark:hover:bg-neutral-900 border border-neutral-200 dark:border-white/40 dark:hover:border-white dark:hover:text-white dark:hover:shadow-[0_0_14px_rgba(255,255,255,0.5)] text-neutral-700 dark:text-neutral-200 cursor-pointer transition-all"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/30 text-neutral-700 dark:text-neutral-300 font-medium">
              <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-white" />
              <span className="text-neutral-900 dark:text-white font-mono text-xs font-semibold">
                {getTabLabel(activeTab)}
              </span>
            </div>
          </div>

          {/* Topbar Right Corner: Drake / Light Mode Toggle, Login & Sign Up - All in One White Color */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Direct Theme Toggle Button (Drake Mode vs Light Mode) with white animation in Drake mode */}
            <button
              type="button"
              id="topbar-theme-toggle-btn"
              onClick={handleToggleTheme}
              className="px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 cursor-pointer shadow-xs text-xs font-mono font-semibold bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-900 dark:bg-black dark:border-white dark:animate-white-glow dark:text-white"
              title={`Currently in ${theme === 'dark' ? 'Drake Mode (All Black)' : 'Light Mode (All White)'}. Click to switch.`}
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-white fill-white/20" />
                  <span className="text-white text-[11px] font-bold">Drake Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span className="text-neutral-900 text-[11px]">Light Mode</span>
                </>
              )}
            </button>

            {/* Direct Login Button in Top Right Corner */}
            <button
              type="button"
              id="topbar-login-btn"
              onClick={() => handleOpenAuthModal('login')}
              className="px-3.5 sm:px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-black dark:hover:bg-neutral-900 border border-neutral-300 dark:border-white/50 dark:hover:border-white dark:hover:shadow-[0_0_14px_rgba(255,255,255,0.5)] text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Open Login Options"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-500 dark:text-white" />
              <span>Login</span>
            </button>

            {/* Direct Sign-Up Button in Top Right Corner */}
            <button
              type="button"
              id="topbar-signup-btn"
              onClick={() => handleOpenAuthModal('signup')}
              className="px-3.5 sm:px-4 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Open Sign-Up Options"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-white" />
              <span>Sign Up</span>
            </button>
          </div>
        </header>

        <main className="flex-1 pb-10">
          <div className={activeTab === 'home' ? 'block' : 'hidden'}>
            <HomeView
              onNavigate={handleNavigate}
            />
          </div>
          <div className={activeTab === 'workbench' ? 'block' : 'hidden'}>
            <DiagnosticWorkbench
              onGoToAblation={() => handleNavigate('ablation')}
            />
          </div>
          <div className={activeTab === 'architecture' ? 'block' : 'hidden'}>
            <ArchitectureStudio />
          </div>
          <div className={activeTab === 'class_balance' ? 'block' : 'hidden'}>
            <ClassBalanceLab />
          </div>
          <div className={activeTab === 'ablation' ? 'block' : 'hidden'}>
            <AblationMatrix />
          </div>
        </main>
      </div>

      {/* Profile, Login, Setup & Sign-Up Modal */}
      <ProfileAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        currentUser={currentUser}
        onUserChange={(updated) => setCurrentUser(updated)}
        theme={theme}
        onThemeToggle={handleToggleTheme}
      />
    </div>
  );
}
