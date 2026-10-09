import React, { useState } from 'react';
import { 
  Bookmark, 
  Highlighter, 
  FileText, 
  Plus, 
  Trash2, 
  Tag, 
  Clock, 
  Sparkles,
  Share2
} from 'lucide-react';
import { BookmarkItem, KeywordNoteItem } from '../types';
import { INITIAL_BOOKMARKS, INITIAL_KEYWORD_NOTES } from '../data/defaultData';

export const ThreeInOneStudio: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(INITIAL_BOOKMARKS);
  const [keywordNotes, setKeywordNotes] = useState<KeywordNoteItem[]>(INITIAL_KEYWORD_NOTES);
  const [selectedColor, setSelectedColor] = useState<string>('#F6E19A'); // signature yellow
  const [newText, setNewText] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [newKwSummary, setNewKwSummary] = useState<string>('');

  const colors = [
    { hex: '#F6E19A', label: '연노랑 (북마크 대표)' },
    { hex: '#F2C0C3', label: '연분홍 (요약/감정)' },
    { hex: '#BCD0D8', label: '파스텔 블루 (배경/설정)' },
    { hex: '#D5C2DE', label: '연보라 (반전/복선)' },
  ];

  const handleAddBookmark = () => {
    if (!newText.trim()) return;
    const item: BookmarkItem = {
      id: `bm-${Date.now()}`,
      text: newText.trim(),
      color: selectedColor,
      note: newNote.trim(),
      createdAt: '지금',
      tags: ['수동 저장']
    };
    setBookmarks([item, ...bookmarks]);
    setNewText('');
    setNewNote('');
  };

  const handleAddKeywordNote = () => {
    if (!newKeyword.trim() || !newKwSummary.trim()) return;
    const item: KeywordNoteItem = {
      id: `kn-${Date.now()}`,
      keyword: newKeyword.trim(),
      summary: newKwSummary.trim(),
      frequency: 1,
      updatedAt: '지금'
    };
    setKeywordNotes([item, ...keywordNotes]);
    setNewKeyword('');
    setNewKwSummary('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Bookmark className="w-5 h-5 text-amber-400 mr-2" />
              크랙 3-in-1 북마크 & 키워드노트 스위트
            </h2>
            <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
              v4.7.3-i.5
            </span>
          </div>
          <p className="text-xs text-slate-400">
            대화 속 명장면 형광펜 하이라이트 및 실시간 키워드 기억 노트를 관리합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Bookmarks & Highlights */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Highlighter className="w-4 h-4 text-amber-400 mr-2" />
              드래그 북마크 & 형광펜 ({bookmarks.length}건)
            </h3>
          </div>

          {/* Add Bookmark Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2.5">
            <textarea
              rows={2}
              placeholder="북마크할 대사나 구절을 입력하세요..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none font-mono"
            />
            <div className="flex items-center justify-between pt-2 border-t border-slate-900">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400">색상:</span>
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-5 h-5 rounded-full border-2 transition ${
                      selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
              <button
                onClick={handleAddBookmark}
                disabled={!newText.trim()}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded transition flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>저장</span>
              </button>
            </div>
          </div>

          {/* Bookmarks List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2"
              >
                <div
                  className="p-2.5 rounded font-mono text-slate-900 font-medium leading-relaxed"
                  style={{ backgroundColor: bm.color }}
                >
                  {bm.text}
                </div>
                {bm.note && (
                  <p className="text-slate-400 text-[11px] pl-1">
                    메모: {bm.note}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{bm.createdAt}</span>
                  <button
                    onClick={() => setBookmarks(bookmarks.filter((b) => b.id !== bm.id))}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Keyword Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center">
              <FileText className="w-4 h-4 text-cyan-400 mr-2" />
              실시간 키워드노트 ({keywordNotes.length}개)
            </h3>
          </div>

          {/* Add Keyword Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
            <input
              type="text"
              placeholder="키워드 단어 (예: 은빛 펜던트, 북탑 지하)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <textarea
              rows={2}
              placeholder="키워드 관련 메모 및 요약..."
              value={newKwSummary}
              onChange={(e) => setNewKwSummary(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />
            <button
              onClick={handleAddKeywordNote}
              disabled={!newKeyword.trim() || !newKwSummary.trim()}
              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>키워드 노트 등록</span>
            </button>
          </div>

          {/* Keyword Notes List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {keywordNotes.map((kn) => (
              <div
                key={kn.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">#{kn.keyword}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono">언급 {kn.frequency}회</span>
                    <button
                      onClick={() => setKeywordNotes(keywordNotes.filter((k) => k.id !== kn.id))}
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                  {kn.summary}
                </p>
                <p className="text-[10px] text-slate-500">최근 업데이트: {kn.updatedAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
