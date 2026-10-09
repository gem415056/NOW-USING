import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  FileCode, 
  Search, 
  Sparkles, 
  Layers, 
  Check, 
  ShieldCheck, 
  History, 
  ArrowRight,
  Info
} from 'lucide-react';
import { ScriptItem } from '../types';

interface ScriptCatalogProps {
  scripts: ScriptItem[];
  onSelectScript: (script: ScriptItem) => void;
  onNavigateToTab: (tab: 'lore' | 'refiner' | '3in1' | '9in1') => void;
}

export const ScriptCatalog: React.FC<ScriptCatalogProps> = ({ 
  scripts, 
  onSelectScript,
  onNavigateToTab 
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: '전체 스크립트' },
    { id: 'core', label: '핵심 추천 스위트 (최신)' },
    { id: 'lore', label: '로어 인젝터 (Lore)' },
    { id: 'refiner', label: '응답 교정기 (Refiner)' },
    { id: 'utility', label: '3-in-1 & 9-in-1 도구' },
    { id: 'archive', label: '이전 버전/테스트 아카이브' },
  ];

  const filteredScripts = scripts.filter((item) => {
    // category filter
    if (filter === 'core') {
      if (!['PASTELchat-Crack-Bridge.user.js', 'lore injector TEST8', 'Response Refiner TEST8', '3in1 TEST1', '9in1 TEST1'].includes(item.id)) {
        return false;
      }
    } else if (filter === 'lore') {
      if (!item.id.toLowerCase().includes('lore') && !item.id.includes('로어')) return false;
    } else if (filter === 'refiner') {
      if (!item.id.toLowerCase().includes('refiner') && !item.id.includes('교정')) return false;
    } else if (filter === 'utility') {
      if (!item.id.includes('3in1') && !item.id.includes('9in1') && !item.id.includes('8in1')) return false;
    } else if (filter === 'archive') {
      if (!item.id.includes('/') && !item.id.includes('TEST')) return false;
    }

    // search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.metaName.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyScript = (script: ScriptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    fetch(`/api/scripts/content?id=${encodeURIComponent(script.id)}`)
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopiedId(script.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
  };

  const handleDirectInstall = (script: ScriptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/raw/${encodeURIComponent(script.id)}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Setup Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WRTN Crack & PASTELchat UserScript Hub</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              크랙 × 파스텔챗 유저스크립트 워크벤치
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Tampermonkey 또는 Violentmonkey 브라우저 확장 프로그램에 원클릭으로 설치하거나, 아래 시뮬레이터 탭에서 로어북 주입(Lore Injection) 및 AI 응답 교정(Response Refinement)을 사전 테스트하세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateToTab('lore')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center shadow"
            >
              <span>로어 인젝터 테스트</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </button>
            <button
              onClick={() => onNavigateToTab('refiner')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center shadow"
            >
              <span>응답 교정기 테스트</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Highlighted Core Bundle */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-800/60 transition">
            <span className="text-[11px] font-semibold text-cyan-400">01. 파스텔챗 브릿지</span>
            <p className="text-slate-300 mt-1 font-medium truncate">PASTELchat-Crack-Bridge.user.js</p>
            <p className="text-slate-400 text-[11px] mt-0.5">토큰 및 ChatId 자동 인터셉트</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-800/60 transition">
            <span className="text-[11px] font-semibold text-emerald-400">02. 로어 인젝터 TEST8</span>
            <p className="text-slate-300 mt-1 font-medium truncate">에리의 크랙 로어 인젝터</p>
            <p className="text-slate-400 text-[11px] mt-0.5">단일 번들 17,000줄 범용 인젝터</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-800/60 transition">
            <span className="text-[11px] font-semibold text-purple-400">03. 응답 교정기 TEST8</span>
            <p className="text-slate-300 mt-1 font-medium truncate">Response Refiner V2.4.0</p>
            <p className="text-slate-400 text-[11px] mt-0.5">추가 요청 탭 & 대화 서식 교정</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-800/60 transition">
            <span className="text-[11px] font-semibold text-amber-400">04. 3-in-1 & 9-in-1 도구</span>
            <p className="text-slate-300 mt-1 font-medium truncate">북마크, 키워드, 전송 홀드</p>
            <p className="text-slate-400 text-[11px] mt-0.5">하이라이터 & 원활한 입력 보조</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="스크립트 검색 (이름, 버전, 기능)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Script Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScripts.map((script) => {
          const isLatest = script.id.includes('TEST8') || script.id.includes('Bridge');
          return (
            <div
              key={script.id}
              onClick={() => onSelectScript(script)}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-700/60 rounded-xl p-5 shadow-lg transition-all flex flex-col justify-between group cursor-pointer hover:shadow-cyan-950/20"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 group-hover:bg-cyan-950 group-hover:border-cyan-700 transition">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-medium text-cyan-400">
                        v{script.version}
                      </span>
                      {isLatest && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {(script.fileSize / 1024).toFixed(0)} KB
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition line-clamp-1">
                  {script.metaName}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {script.description || '유저스크립트 소스 파일'}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                    {script.lineCount.toLocaleString()} lines
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                    {script.author}
                  </span>
                  {script.matches.slice(0, 1).map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono truncate max-w-[150px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleCopyScript(script, e)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center justify-center"
                  title="코드 복사"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>복사</span>
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleDirectInstall(script, e)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm transition flex items-center justify-center"
                  title="Tampermonkey 설치"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  <span>설치</span>
                </button>

                <button
                  onClick={() => onSelectScript(script)}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                  title="코드 보기"
                >
                  코드
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredScripts.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          <Info className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <p className="text-sm">검색 조건에 맞는 스크립트가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
