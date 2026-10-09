import React, { useState, useRef } from 'react';
import { Sliders, Send, Clock, CheckCircle2, RotateCcw } from 'lucide-react';

export const NineInOneStudio: React.FC = () => {
  const [holdDuration, setHoldDuration] = useState<number>(600); // 600ms default
  const [progress, setProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [sentCount, setSentCount] = useState<number>(0);
  const [testMessage, setTestMessage] = useState<string>('안녕하세요, 방금 설정한 전송 홀드 테스트 메시지입니다.');
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / holdDuration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        setIsHolding(false);
        setProgress(0);
        setSentCount((c) => c + 1);
      }
    }, 16);
  };

  const endHold = () => {
    clearInterval(timerRef.current);
    setIsHolding(false);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Sliders className="w-5 h-5 text-cyan-400 mr-2" />
              크랙 9 in 1 입력 도우미 & 전송 홀드(Send Hold)
            </h2>
            <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              v15.4.0-e
            </span>
          </div>
          <p className="text-xs text-slate-400">
            엔터 오타나 실수로 인한 미완성 전송 방지(Hold to Send), 실시간 텍스트 동기화 및 입력 편의를 제공합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hold to Send Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Clock className="w-4 h-4 text-cyan-400 mr-2" />
            전송 홀드 방지링 시뮬레이터
          </h3>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">
              홀드 요구 시간: <strong className="text-cyan-400">{holdDuration}ms</strong>
            </label>
            <input
              type="range"
              min="200"
              max="1500"
              step="50"
              value={holdDuration}
              onChange={(e) => setHoldDuration(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />
          </div>

          {/* Interactive Send Button */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800 relative select-none">
            <p className="text-xs text-slate-400 mb-4">
              아래 전송 버튼을 <strong>{holdDuration}ms 동안 꾹 누르고</strong> 있으면 전송됩니다.
            </p>

            <button
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              className="relative w-20 h-20 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex flex-col items-center justify-center shadow-lg transition active:scale-95"
            >
              {/* Circular progress ring overlay */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  className="stroke-cyan-300 fill-none transition-all"
                  strokeWidth="4"
                  strokeDasharray="226"
                  strokeDashoffset={226 - (226 * progress) / 100}
                />
              </svg>
              <Send className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">전송</span>
            </button>

            <div className="mt-4 flex items-center space-x-2 text-xs">
              <span className="text-slate-400">성공적으로 전송된 횟수:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                {sentCount}회
              </span>
            </div>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Sliders className="w-4 h-4 text-cyan-400 mr-2" />
            9 in 1 모듈 구성 안내
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-semibold text-cyan-300 block mb-0.5">01. 전송 홀드 (Send Hold)</span>
              <p className="text-slate-400 leading-relaxed">
                짧은 클릭 실수로 채팅이 나가지 않도록 600ms 홀드 후 게이지가 채워졌을 때만 원클릭 전송.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-semibold text-cyan-300 block mb-0.5">02. 네이티브 입력 포커스 동기화</span>
              <p className="text-slate-400 leading-relaxed">
                Tiptap 및 ProseMirror 에디터 간의 양방향 텍스트 동기화 및 입력 커서 유실 차단.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-semibold text-cyan-300 block mb-0.5">03. 공유 코어 라이브러리 연동</span>
              <p className="text-slate-400 leading-relaxed">
                crack-shared-core 및 chasm-shared-core를 통해 다크 모드, CSS 오버라이드 및 상단 고정 UI 제공.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
