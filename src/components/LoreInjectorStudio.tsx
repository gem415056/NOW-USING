import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Sparkles, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { LoreEntry } from '../types';
import { INITIAL_LORE_ENTRIES } from '../data/defaultData';

export const LoreInjectorStudio: React.FC = () => {
  const [entries, setEntries] = useState<LoreEntry[]>(INITIAL_LORE_ENTRIES);
  const [testContext, setTestContext] = useState<string>(
    '에리가 문을 열고 연습실로 들어왔다. "매니저님, 루멘 마도학원 시험 준비는 다 끝났어요?"'
  );
  const [activeTab, setActiveTab] = useState<'tester' | 'entries'>('tester');
  const [newKey, setNewKey] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newPriority, setNewPriority] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);

  // Evaluate matching
  const matchedEntries = entries
    .filter((e) => e.enabled)
    .filter((entry) => {
      const lowerContext = testContext.toLowerCase();
      return entry.keys.some((k) => lowerContext.includes(k.toLowerCase().trim()));
    })
    .sort((a, b) => b.priority - a.priority);

  const assembledPrompt = `[시스템 지침: 기본 규칙 및 캐릭터 서사]
AI는 캐릭터의 고유 말투와 성격을 충실히 반영하여 생동감 넘치게 응답하십시오.

${matchedEntries.length > 0 ? `[활성화된 로어북(Worldbook) 주입 목록: ${matchedEntries.length}건]` : '[주입된 로어북 없음]'}
${matchedEntries.map((e) => `/* 우선순위 ${e.priority} | 키워드: ${e.keys.join(', ')} */\n${e.content}`).join('\n\n')}

[대화 컨텍스트]
${testContext}`;

  const handleAddEntry = () => {
    if (!newKey.trim() || !newContent.trim()) return;
    const newEntry: LoreEntry = {
      id: `lore-${Date.now()}`,
      keys: newKey.split(',').map((k) => k.trim()).filter(Boolean),
      content: newContent.trim(),
      priority: newPriority,
      scope: 'character',
      matchType: 'contains',
      enabled: true,
      notes: '사용자 추가 로어 항목'
    };
    setEntries([newEntry, ...entries]);
    setNewKey('');
    setNewContent('');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleToggleEntry = (id: string) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `crack-lorebook-export-${Date.now()}.json`);
    dlAnchor.click();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white flex items-center">
              <BookOpen className="w-5 h-5 text-cyan-400 mr-2" />
              로어 인젝터(Lore Injector) 시뮬레이터
            </h2>
            <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Universal Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            사용자 입력 및 대화 맥락 속 키워드를 실시간 감지하여 최적의 우선순위로 로어북을 자동 인젝트합니다.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            <span>로어북 내보내기 (JSON)</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Context & Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center">
                <Play className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                테스트 입력 문장 (대화 맥락 / 사용자 메시지)
              </label>
              <span className="text-[11px] text-slate-500">
                {testContext.length}자
              </span>
            </div>
            <textarea
              rows={3}
              value={testContext}
              onChange={(e) => setTestContext(e.target.value)}
              placeholder="테스트할 대화나 문장을 입력하세요. (예: 에리, 루멘 마도학원, 크랙 시스템 등)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />

            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">매칭된 로어:</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300">
                  {matchedEntries.length}건 트리거됨
                </span>
              </div>
              <div className="flex gap-1.5">
                {matchedEntries.map((m) => (
                  <span
                    key={m.id}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-cyan-300 border border-slate-700"
                  >
                    {m.keys[0]} (P:{m.priority})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Assembled Output Prompt */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
                최종 주입 프롬프트 프리뷰 (AI 전달 패킷)
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
                <span>{copied ? '복사됨' : '프롬프트 복사'}</span>
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
              {assembledPrompt}
            </div>
          </div>
        </div>

        {/* Right: Manage Lore Entries (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Add */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <Plus className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
              신규 로어 항목 추가
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  트리거 키워드 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="예: 에리, 소꿉친구, 아이돌"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">우선순위 (0~100)</label>
                  <input
                    type="number"
                    value={newPriority}
                    onChange={(e) => setNewPriority(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">주입할 로어 내용</label>
                <textarea
                  rows={3}
                  placeholder="[설정: ...]"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />
              </div>

              <button
                onClick={handleAddEntry}
                disabled={!newKey.trim() || !newContent.trim()}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>로어북에 등록</span>
              </button>
            </div>
          </div>

          {/* Active Entries List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                등록된 로어 목록 ({entries.length}개)
              </h3>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {entries.map((entry) => {
                const isTriggered = matchedEntries.some((m) => m.id === entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isTriggered
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                        : entry.enabled
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        {entry.keys.map((k, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[10px] border border-cyan-500/20"
                          >
                            #{k}
                          </span>
                        ))}
                        <span className="text-[10px] font-mono text-slate-400">
                          P:{entry.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleEntry(entry.id)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            entry.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {entry.enabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 line-clamp-2 font-mono text-[11px] leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
