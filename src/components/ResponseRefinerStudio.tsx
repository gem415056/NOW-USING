import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sliders, 
  RefreshCw,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { RefinerRule } from '../types';
import { INITIAL_REFINER_RULES } from '../data/defaultData';

export const ResponseRefinerStudio: React.FC = () => {
  const [rules, setRules] = useState<RefinerRule[]>(INITIAL_REFINER_RULES);
  const [rawResponse, setRawResponse] = useState<string>(
    `“에리야, 오늘 연습 수고 많았어.”\n\n*에리는 땀을 닦으며 힐끗 쳐다본다*\n\n“별말씀을요... 매니저님이 옆에서 잔소리만 안 했어도 10분은 일찍 끝났을 텐데요?”\n\n\n\n그녀의 볼이 살짝 붉어져 있었다. 앞으로 두 사람의 이야기는 어떻게 전개될까요? 당신의 선택에 달려있습니다.`
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newPattern, setNewPattern] = useState<string>('');
  const [newReplacement, setNewReplacement] = useState<string>('');

  // Apply active rules sequentially
  const refineText = (input: string) => {
    let result = input;
    rules.forEach((rule) => {
      if (!rule.enabled) return;
      try {
        if (rule.isRegex) {
          const re = new RegExp(rule.pattern, 'gm');
          result = result.replace(re, rule.replacement);
        } else {
          result = result.split(rule.pattern).join(rule.replacement);
        }
      } catch (_) {
        // Regex syntax error fallback
      }
    });
    return result.trim();
  };

  const refinedResponse = refineText(rawResponse);

  const handleToggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleAddRule = () => {
    if (!newRuleName.trim() || !newPattern.trim()) return;
    const newRule: RefinerRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      description: '사용자 추가 교정 룰',
      category: 'custom',
      pattern: newPattern,
      replacement: newReplacement,
      enabled: true,
      isRegex: true
    };
    setRules([...rules, newRule]);
    setNewRuleName('');
    setNewPattern('');
    setNewReplacement('');
  };

  const handleCopyRefined = () => {
    navigator.clipboard.writeText(refinedResponse);
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
              <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
              크랙 AI 응답 교정기 (Response Refiner V2.4)
            </h2>
            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Live Filter
            </span>
          </div>
          <p className="text-xs text-slate-400">
            AI 모델이 생성한 원문에서 어색한 따옴표, 상투적 메타 발언, 행동 애스터리스크 지문 등을 실시간 필터링합니다.
          </p>
        </div>

        <button
          onClick={handleCopyRefined}
          className="flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
          <span>{copied ? '교정본 복사 완료' : '교정 완료본 복사'}</span>
        </button>
      </div>

      {/* Side by Side Diff Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Raw Response */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center">
              <span className="w-2 h-2 rounded-full bg-rose-400 mr-2"></span>
              교정 전 원문 (AI 미가공 생성 텍스트)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {rawResponse.length} 글자
            </span>
          </div>
          <textarea
            rows={10}
            value={rawResponse}
            onChange={(e) => setRawResponse(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-mono leading-relaxed"
          />
        </div>

        {/* Right: Refined Response */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
              교정 후 정제본 (Clean Output)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              {refinedResponse.length} 글자 ({refinedResponse.length - rawResponse.length}자 절감)
            </span>
          </div>
          <div className="w-full h-[224px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono leading-relaxed overflow-y-auto whitespace-pre-wrap select-text">
            {refinedResponse}
          </div>
        </div>
      </div>

      {/* Rules Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Sliders className="w-4 h-4 text-purple-400 mr-2" />
            교정 규칙 관리 (정규식 / 치환 규칙)
          </h3>
          <span className="text-xs text-slate-400">
            활성 규칙: {rules.filter((r) => r.enabled).length} / {rules.length}
          </span>
        </div>

        {/* Rule list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3 rounded-lg border text-xs transition flex items-start justify-between gap-3 ${
                rule.enabled
                  ? 'bg-slate-950 border-purple-900/50'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-200">{rule.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                    {rule.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{rule.description}</p>
                <div className="pt-1 font-mono text-[11px] text-slate-500 truncate">
                  <code className="text-rose-400">{rule.pattern}</code> → <code className="text-emerald-400">"{rule.replacement}"</code>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    rule.enabled
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {rule.enabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add custom rule */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="규칙 이름 (예: 특수문자 정리)"
            value={newRuleName}
            onChange={(e) => setNewRuleName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="정규식 패턴 (Pattern)"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
          />
          <input
            type="text"
            placeholder="치환 텍스트 (Replacement)"
            value={newReplacement}
            onChange={(e) => setNewReplacement(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
          />
          <button
            onClick={handleAddRule}
            disabled={!newRuleName.trim() || !newPattern.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>규칙 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
};
