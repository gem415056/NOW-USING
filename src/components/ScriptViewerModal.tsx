import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, ExternalLink, Search, FileCode, ArrowDown } from 'lucide-react';
import { ScriptItem } from '../types';

interface ScriptViewerModalProps {
  script: ScriptItem | null;
  onClose: () => void;
}

export const ScriptViewerModal: React.FC<ScriptViewerModalProps> = ({ script, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!script) return;
    setLoading(true);
    fetch(`/api/scripts/content?id=${encodeURIComponent(script.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent(`// [알림] 스크립트 프리뷰를 불러올 수 없습니다.\n// 원본 파일: ${script.id}\n// 상단 '원클릭 복사' 또는 '설치' 링크를 사용하세요.`);
        setLoading(false);
      });
  }, [script]);

  if (!script) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.fileName.endsWith('.user.js') ? script.fileName : `${script.fileName}.user.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rawInstallUrl = `/raw/${encodeURIComponent(script.id)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white truncate">{script.metaName}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  v{script.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">{script.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="클립보드에 코드 전체 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              <span>{copied ? '복사 완료!' : '전체 복사'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title=".user.js 파일로 다운로드"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              <span>다운로드</span>
            </button>

            <a
              href={rawInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition"
              title="Tampermonkey/Violentmonkey 직접 설치"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              <span>탬퍼몽키 직접 설치</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2 w-72">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="코드 내 검색 (함수명, 변수, 문구)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs"
            />
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>총 {script.lineCount.toLocaleString()} 줄</span>
            <span>•</span>
            <span>{(script.fileSize / 1024).toFixed(1)} KB</span>
            <span>•</span>
            <span className="text-cyan-400">{script.author}</span>
          </div>
        </div>

        {/* Code Content View */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300 select-text">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mr-3"></div>
              <span>대용량 스크립트 소스를 불러오는 중...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all">
              {content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>UTF-8 Javascript Userscript</span>
          </div>
          <div>
            URL: <code className="text-cyan-400">{rawInstallUrl}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
