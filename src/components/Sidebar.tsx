import React from 'react';
import {
  Activity,
  Brain,
  ChevronRight,
  Cpu,
  Home,
  Layers,
  Moon,
  Palette,
  Sun,
  X
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  theme = 'dark',
  onToggleTheme,
}) => {
  const navigationItems = [
    {
      id: 'home' as TabType,
      label: 'Home',
      category: 'Overview',
      icon: Home,
      badge: 'Portal',
      badgeColor: 'text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-white dark:bg-black dark:border-white/50 dark:shadow-[0_0_8px_rgba(255,255,255,0.25)]',
      description: 'System Overview & Diagnostics',
    },
    {
      id: 'workbench' as TabType,
      label: 'Diagnostic Workbench',
      category: 'Inference',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-white dark:bg-black dark:border-white/50 dark:shadow-[0_0_8px_rgba(255,255,255,0.25)]',
      description: 'Vision + Tabular Saliency',
    },
    {
      id: 'architecture' as TabType,
      label: 'Dual-Stream Architecture',
      category: 'Pipeline',
      icon: Cpu,
      badge: 'Cross-Attn',
      badgeColor: 'text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-white dark:bg-black dark:border-white/50 dark:shadow-[0_0_8px_rgba(255,255,255,0.25)]',
      description: 'Swin-T + FT-Transformer',
    },
    {
      id: 'class_balance' as TabType,
      label: 'Class-Balance Lab',
      category: 'Optimization',
      icon: Layers,
      badge: 'Loss Math',
      badgeColor: 'text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-white dark:bg-black dark:border-white/50 dark:shadow-[0_0_8px_rgba(255,255,255,0.25)]',
      description: 'Effective Samples & LDAM',
    },
    {
      id: 'ablation' as TabType,
      label: 'Ablation & Benchmarks',
      category: 'Evaluation',
      icon: Brain,
      badge: 'ISIC-2024',
      badgeColor: 'text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-white dark:bg-black dark:border-white/50 dark:shadow-[0_0_8px_rgba(255,255,255,0.25)]',
      description: '8-Model Test Suite',
    },
  ];

  const handleSelectTab = (id: TabType) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-850">
        <div className="flex items-center justify-between">
          <button
            type="button"
            id="sidebar-home-logo-btn"
            onClick={() => handleSelectTab('home')}
            className="flex items-center text-left group cursor-pointer"
          >
            <div className="min-w-0">
              <h1 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight leading-tight truncate group-hover:text-cyan-600 dark:group-hover:text-white transition-colors">
                DermaScan
              </h1>
              <p className="text-[11px] font-mono text-cyan-600 dark:text-neutral-300 truncate font-medium">
                Clinical Onco-Dermatology
              </p>
            </div>
          </button>
          {mobileOpen && (
            <button
              type="button"
              id="close-sidebar-btn"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Vertical Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold flex items-center justify-between">
          <span>Diagnostic Workspace</span>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-medium">v2.4 Active</span>
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`vertical-menu-tab-${item.id}`}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full group flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                isActive
                  ? 'bg-neutral-100 dark:bg-black border-neutral-300 dark:border-white text-neutral-950 dark:text-white shadow-xs dark:animate-white-glow font-semibold'
                  : 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/90 border-transparent dark:hover:border-white/40 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white dark:hover:shadow-[0_0_14px_rgba(255,255,255,0.35)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-white border-neutral-300 text-neutral-900 dark:bg-white/15 dark:border-white dark:text-white dark:shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-500 group-hover:text-neutral-800 group-hover:bg-neutral-200/60 dark:bg-black dark:border-neutral-800 dark:text-neutral-400 dark:group-hover:text-white dark:group-hover:border-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs leading-tight truncate ${
                        isActive
                          ? 'text-neutral-950 dark:text-white font-bold'
                          : 'text-neutral-700 group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-white font-semibold'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate font-mono">
                    {item.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive
                      ? 'text-neutral-900 dark:text-white dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)] translate-x-0.5'
                      : 'text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-white'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col">
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop Vertical Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 shrink-0 h-screen sticky top-0 z-20 transition-colors">
        {navContent}
      </aside>
    </>
  );
};
