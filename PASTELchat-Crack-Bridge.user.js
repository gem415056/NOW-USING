// ==UserScript==
// @name         PASTELchat × CRACK (Module 1: Pinpoint Shell)
// @namespace    https://github.com/PASTELchat/crack
// @version      1.3.0
// @description  Module 1 Pinpoint: Guaranteed Mount on crack.wrtn.ai
// @match        https://crack.wrtn.ai/*
// @match        http://crack.wrtn.ai/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 1. 동작 여부 확인용 시각 배지 (2초 후 자동 소멸)
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:10px;left:10px;z-index:999999;background:#FF4432;color:#fff;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:bold;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
    toast.textContent = 'PASTELchat 로드 완료';
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    // 2. 파스텔챗 CSS 주입
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        #ep-pastel-injected-container {
            display: flex !important; flex-direction: column !important; width: 100% !important; height: 100% !important;
            position: absolute !important; inset: 0 !important; z-index: 50 !important;
            background: #ffffff !important; color: #222222 !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        body[data-theme="dark"] #ep-pastel-injected-container, html.dark #ep-pastel-injected-container {
            background: #141413 !important; color: #F0EFEB !important;
        }
        .chat-info-header { height: 42px; border-bottom: 1px solid #E6E6E6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 12px; }
        .chat-content-box { flex: 1; overflow-y: auto; padding: 20px; }
        .chat-footer-control { padding: 16px 20px; background: inherit; }
        .input-area { height: 150px; border: 1px solid #E6E6E6; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; background: #fafafa; }
        body[data-theme="dark"] .input-area, html.dark .input-area { background: #1a1918; border-color: #333; }
        .chat-textarea { width: 100%; height: 100%; border: none; background: transparent; color: inherit; resize: none; outline: none; font-size: 15px; }
        .input-toolbar { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .tool-btn { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #B0B0B0; background: #fff; color: inherit; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
        .right-drawer-container { position: absolute; top: 0; right: 0; width: 250px; height: 100%; background: inherit; border-left: 1px solid #E6E6E6; z-index: 60; display: none; flex-direction: column; padding: 16px; box-shadow: -4px 0 16px rgba(0,0,0,0.1); }
        .ep-chat-drawer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); z-index: 55; display: none; }
    `;
    document.head.appendChild(styleEl);

    // 3. 파스텔챗 UI HTML
    const pastelHTML = `
        <div id="ep-pastel-injected-container">
            <div class="chat-info-header">
                <div style="display:flex; gap:10px;">
                    <span>로어 비용: <b id="ep-lore-cost-val">0</b>원</span>
                    <span>잔여 크래커: <b id="ep-crack-total-cash">0</b>개</span>
                </div>
            </div>
            <div class="ep-chat-drawer-overlay" id="ep-chat-drawer-overlay"></div>
            <div class="chat-content-box" id="ep-chat-content-box">
                <div style="text-align:center; padding:40px; color:#888;">✨ <b>PASTELchat 모듈 1</b> 정상 마운트 성공!</div>
            </div>
            <div class="chat-footer-control">
                <div class="input-area">
                    <textarea class="chat-textarea" id="ep-chat-input-textarea" placeholder="메시지를 입력하세요..."></textarea>
                    <div class="input-toolbar">
                        <button class="tool-btn ep-symbol-btn" data-open="*">*</button>
                        <button class="tool-btn ep-symbol-btn" data-open='"' data-close='"' >"</button>
                        <button class="tool-btn ep-symbol-btn" data-open="'" data-close="'" >'</button>
                        <button class="tool-btn ep-symbol-btn" data-open="(" data-close=")" >()</button>
                        <button class="tool-btn ep-symbol-btn" data-open="[" data-close="]" >[]</button>
                        <button class="tool-btn" id="ep-chat-send-btn" style="margin-left:auto; width:30px; height:30px; border-radius:50%; background:#F5E19A; border:none; cursor:pointer;">▶</button>
                    </div>
                </div>
            </div>
            <div class="right-drawer-container" id="ep-chat-right-drawer">
                <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:16px;">
                    <span>설정 및 메뉴</span>
                    <button id="ep-drawer-close" style="background:none; border:none; cursor:pointer;">✕</button>
                </div>
                <div style="color:#888; font-size:13px;">PASTELchat 서랍 메뉴</div>
            </div>
        </div>
    `;

    // 4. 화면 직결 마운트 루프
    function mount() {
        const nativeInput = document.querySelector('.ProseMirror');
        const mainView = document.querySelector('main') || document.querySelector('div[class*="flex-1"][class*="flex-col"]');

        if ((nativeInput || mainView) && !document.getElementById('ep-pastel-injected-container')) {
            const mountTarget = mainView || document.body;
            mountTarget.style.position = 'relative';
            
            const wrapper = document.createElement('div');
            wrapper.innerHTML = pastelHTML;
            mountTarget.appendChild(wrapper.firstElementChild);

            // 이벤트 연결
            const drawer = document.getElementById('ep-chat-right-drawer');
            const overlay = document.getElementById('ep-chat-drawer-overlay');
            document.getElementById('ep-drawer-close').onclick = () => { drawer.style.display = 'none'; overlay.style.display = 'none'; };
            overlay.onclick = () => { drawer.style.display = 'none'; overlay.style.display = 'none'; };

            // 구슬 버튼 기호 입력
            const ta = document.getElementById('ep-chat-input-textarea');
            document.querySelectorAll('.ep-symbol-btn').forEach(btn => {
                btn.onclick = () => {
                    const op = btn.dataset.open || '', cl = btn.dataset.close || '';
                    const s = ta.selectionStart, e = ta.selectionEnd;
                    ta.value = ta.value.slice(0, s) + op + cl + ta.value.slice(e);
                    ta.focus();
                    ta.setSelectionRange(s + op.length, s + op.length);
                };
            });
        }

        // 상단 헤더 점3개 메뉴 버튼 삽입
        const topHeader = document.querySelector('button[role="combobox"]')?.parentElement || document.querySelector('header') || document.querySelector('div[class*="items-center"][class*="justify-between"]');
        if (topHeader && !document.getElementById('ep-chat-drawer-trigger')) {
            const btn = document.createElement('button');
            btn.id = 'ep-chat-drawer-trigger';
            btn.style.cssText = 'cursor:pointer; background:none; border:none; font-size:18px; padding:4px 8px; margin-left:6px; color:inherit;';
            btn.textContent = '⋮';
            btn.title = 'PASTELchat 메뉴';
            btn.onclick = () => {
                const drawer = document.getElementById('ep-chat-right-drawer');
                const overlay = document.getElementById('ep-chat-drawer-overlay');
                if (drawer && overlay) {
                    drawer.style.display = 'flex';
                    overlay.style.display = 'block';
                }
            };
            topHeader.appendChild(btn);

            // 추천답변 버튼(SVG) 상단으로 이동
            const recBtn = document.querySelector('path[d*="m13.8 2.58"]')?.closest('button');
            if (recBtn && !topHeader.contains(recBtn)) {
                topHeader.insertBefore(recBtn, btn);
            }
        }
    }

    setInterval(mount, 300);
})();
