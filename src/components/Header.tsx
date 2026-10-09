import React from 'react';
import { 
  Puzzle, 
  BookOpen, 
  Sparkles, 
  Bookmark, 
  Sliders, 
  Download, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'catalog' | 'lore' | 'refiner' | '3in1' | '9in1';
  setActiveTab: (tab: 'catalog' | 'lore' | 'refiner' | '3in1' | '9in1') => void;
  scriptCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, scriptCount }) => {
  const tabs = [
    { id: 'catalog' as const, label: '스크립트 카탈로그 & 설치', icon: Puzzle, badge: `${scriptCount}개` },
    { id: 'lore' as const, label: '로어 인젝터 스튜디오', icon: BookOpen, badge: 'Universal' },
    { id: 'refiner' as const, label: '응답 교정기 스튜디오', icon: Sparkles, badge: 'V2.4' },
    { id: '3in1' as const, label: '3-in-1 북마크 & 요약', icon: Bookmark, badge: 'v4.7' },
    { id: '9in1' as const, label: '9-in-1 입력 도우미', icon: Sliders, badge: 'v15.4' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
              🧩
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Crack & PASTELchat <span className="text-cyan-400 font-medium">Script Suite</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                크랙(WRTN) & 파스텔챗 유저스크립트 관리, 원클릭 설치 및 시뮬레이션 워크벤치
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <a
              href="https://tampermonkey.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700"
            >
              <span>Tampermonkey 가이드</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </a>
            <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-2"></span>
              <span>Local Bridge :3000</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-1 pt-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-slate-800/60 shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
