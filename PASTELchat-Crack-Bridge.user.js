// ==UserScript==
// @name         PASTELchat × CRACK Native Bridge Engine
// @namespace    https://pastelchat.com/
// @version      1.9.4
// @description  PASTELchat Native UI Engine & Data Bridge for crack.wrtn.ai
// @author       PASTELchat
// @match        https://crack.wrtn.ai/*
// @match        https://pastel-chat-coral.vercel.app/*
// @match        *://*/*index.html*
// @match        file:///*index.html*
// @match        file:///*
// @include      *index.html*
// @include      file://*index.html*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js
// @require      https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check-compat.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // [크랙 네트워크 실시간 인터셉터]: 브라우저가 통신할 때 사용하는 진짜 토큰과 ChatId 자동 낚아채기
    let capturedCrackToken = '';
    let capturedCrackChatId = '';

    const origFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            const opts = args[1] || {};
            const headers = opts.headers || (typeof args[0] === 'object' ? args[0].headers : null);

            // 1. Authorization 토큰 자동 캡처
            if (headers) {
                let auth = '';
                if (typeof headers.get === 'function') auth = headers.get('Authorization') || headers.get('authorization');
                else if (typeof headers === 'object') auth = headers['Authorization'] || headers['authorization'];
                if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
                    capturedCrackToken = auth.replace('Bearer ', '').trim();
                    localStorage.setItem('pastel_captured_crack_token', capturedCrackToken);
                }
            }

            // 2. ChatId 자동 캡처
            const chatMatch = url.match(/chats?\/([a-f0-9]{24}|[a-zA-Z0-9_-]{8,})/i);
            if (chatMatch && chatMatch[1] && chatMatch[1] !== 'messages' && chatMatch[1] !== 'cash') {
                capturedCrackChatId = chatMatch[1];
                localStorage.setItem('pastel_captured_crack_chat_id', capturedCrackChatId);
            }
        } catch (_) {}
        return origFetch.apply(this, args);
    };

    // [index.html 동기화 브릿지]: 데이터가 실제로 변경되었을 때만 안전하게 동기화 (과부하 방지)
    if (!location.hostname.includes('wrtn.ai')) {
        let lastShStr = '', lastTplStr = '', lastFldStr = '';
        const syncPastelchatDataToGM = () => {
            try {
                const shortcuts = localStorage.getItem('pastel_mockShortcuts') || '';
                if (shortcuts && shortcuts !== lastShStr) {
                    lastShStr = shortcuts;
                    GM_setValue('pastel_mockShortcuts', JSON.parse(shortcuts));
                }

                const templates = localStorage.getItem('pastel_mockTemplates') || '';
                if (templates && templates !== lastTplStr) {
                    lastTplStr = templates;
                    GM_setValue('pastel_mockTemplates', JSON.parse(templates));
                }

                const folders = localStorage.getItem('pastel_mockTemplateFolders') || '';
                if (folders && folders !== lastFldStr) {
                    lastFldStr = folders;
                    GM_setValue('pastel_mockTemplateFolders', JSON.parse(folders));
                }
            } catch (_) {}
        };
        syncPastelchatDataToGM();
        setInterval(syncPastelchatDataToGM, 3000);
        return;
    }

    /* ==========================================================================
     * 1. crack.html 순정 CSS 스타일시트 (100% 원본 완전 일치)
     * ========================================================================== */
    const PASTEL_CSS = `
        :root {
            --bg_primary: #ffffff;
            --text_primary: #222222;
            --icon_primary: #222222;
            --pastel_gradient: linear-gradient(135deg, #FFB5E8, #FF9CEE, #B28DFF, #85E3FF, #BFFCC6);
        }

        body[data-theme="dark"] {
            --bg_primary: #141413;
            --text_primary: #F0EFEB;
            --icon_primary: #F0EFEB;
        }

        /* reCAPTCHA v3 우하단 뱃지 완전 은닉 (클릭 방해 차단 & App Check 정상 작동) */
        .grecaptcha-badge {
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -99999 !important;
        }

        /* 1. 대화방 상단 헤더 화면 상단 영구 고정 (스크롤 시 사라짐 원천 방지) */
        .absolute.z-docked.left-0.w-full.h-12,
        .h-12.px-5.flex.justify-between.items-center {
            position: fixed !important;
            top: 56px !important;
            left: 0 !important;
            right: 0 !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            z-index: 100060 !important;
            background-color: var(--bg_screen, #ffffff) !important;
        }
        body[data-theme="dark"] .absolute.z-docked.left-0.w-full.h-12 {
            background-color: #141413 !important;
        }

        /* 2. 크랙 순정 가변 패딩 및 대화 스크롤 유령 공백 완전 초기화 */
        .flex.flex-col.w-full.px-5,
        .flex.flex-col.w-full.max-w-\[768px\],
        .flex.flex-col-reverse.w-full,
        .flex.flex-col-reverse.w-full.gap-10 {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
            min-height: 0 !important;
        }
        /* 메시지 목록 최하단(역방향 기준 첫 번째) 요소의 유령 마진/패딩 강제 차단 */
        .flex.flex-col-reverse.w-full > div:first-child {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
        }

        /* 3. 크랙 순정 스크롤 버튼 절대 불변 고정 (입력창 위로 또렷하게 상시 노출) */
        button[class*="size-[34px]"],
        button:has(svg path[d^="m12 6.87"]),
        button:has(svg path[d^="M20.09 8.3"]) {
            position: fixed !important;
            bottom: 200px !important;
            right: calc(50% - 380px + 16px) !important;
            transform: none !important;
            z-index: 10005 !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
        }
        @media (max-width: 768px) {
            button[class*="size-[34px]"],
            button:has(svg path[d^="m12 6.87"]),
            button:has(svg path[d^="M20.09 8.3"]) {
                right: 16px !important;
            }
        }

        /* 크랙 순정 메뉴 버튼과 완벽히 동일한 인라인 버튼 스타일 */
        #ep-native-menu-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            overflow: hidden;
            white-space: nowrap;
            padding: 8px;
            background: transparent;
            border: none;
            border-radius: 6px;
            width: 32px;
            height: 32px;
            cursor: pointer;
            color: var(--icon_secondary, #737373);
            transition: background-color 0.2s;
            outline: none;
            box-sizing: border-box;
            flex-shrink: 0;
        }
        #ep-native-menu-btn:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        body[data-theme="dark"] #ep-native-menu-btn:hover {
            background-color: rgba(255, 255, 255, 0.08);
        }

        /* 우측 서랍 컨테이너 (크랙 순정과 100% 동일한 300ms 슬라이딩 애니메이션) */
        .right-drawer-container {
            position: fixed !important;
            top: 104px;
            bottom: 0 !important;
            right: 0 !important;
            width: 255px !important;
            height: auto !important;
            max-height: none !important;
            background-color: var(--bg_primary);
            border-left: 1px solid #E6E6E6;
            box-sizing: border-box;
            z-index: 100000 !important;
            display: flex !important;
            flex-direction: column;
            user-select: none;
            box-shadow: -4px 4px 24px rgba(0, 0, 0, 0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
            transform: translateX(100%) !important;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s !important;
            pointer-events: none !important;
            visibility: hidden;
        }
        .right-drawer-container.open {
            transform: translateX(0) !important;
            pointer-events: auto !important;
            visibility: visible;
        }
        body[data-theme="dark"] .right-drawer-container {
            background-color: #141413 !important;
            border-color: #42413D;
        }

        .right-drawer-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
        }

        .drawer-section-title {
            font-size: 13px;
            color: #888888;
            font-weight: bold;
            text-transform: uppercase;
            margin: 16px 0 8px 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }
        .accordion-arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }
        .accordion-arrow.open {
            transform: rotate(180deg);
        }

        .api-boxed-card {
            background-color: #F9F9F9;
            border: 1px solid #E6E6E6;
            border-radius: 8px;
            padding: 9px;
            display: none;
            flex-direction: column;
            box-sizing: border-box;
        }
        .api-tabs-row {
            display: flex;
            gap: 4px;
            margin-bottom: 6px;
        }
        .api-tab-btn {
            border: 1px solid #E6E6E6;
            border-radius: 4px;
            font-size: 12px;
            background-color: transparent;
            color: var(--text_primary);
            padding: 4px 8px;
            cursor: pointer;
            font-weight: bold;
        }
        .api-tab-btn.active {
            border-color: #E6E6E6;
            background-color: #F5E19A;
            color: #333333;
        }
        .api-input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: left;
        }
        .api-input-group label {
            font-size: 11px;
            font-weight: bold;
            color: #888888;
        }
        .api-textbox {
            border: 1px solid #E6E6E6;
            border-radius: 8px;
            background: var(--bg_primary);
            color: var(--text_primary);
            font-size: 13px;
            padding: 7px;
            box-sizing: border-box;
            outline: none;
            width: 100%;
            font-family: inherit;
        }

        .model-boxed-card {
            background-color: #F9F9F9;
            border: 1px solid #E6E6E6;
            border-radius: 8px;
            padding: 9px;
            display: none;
            flex-direction: column;
            box-sizing: border-box;
        }
        .model-tabs-row {
            display: flex;
            gap: 4px;
            margin-bottom: 6px;
        }
        .model-tab-btn {
            border: 1px solid #E6E6E6;
            border-radius: 4px;
            font-size: 12px;
            background-color: transparent;
            color: var(--text_primary);
            padding: 4px 8px;
            cursor: pointer;
            font-weight: bold;
        }
        .model-tab-btn.active {
            border-color: #E6E6E6;
            background-color: #F5E19A;
            color: #333333;
        }
        .model-input-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: left;
        }
        .model-input-group label {
            font-size: 11px;
            font-weight: bold;
            color: #888888;
            margin-top: 6px;
            user-select: none;
        }
        .model-input-group label:first-child {
            margin-top: 0;
        }
        .model-select-dropdown {
            border: 1px solid #E6E6E6;
            border-radius: 8px;
            background: var(--bg_primary);
            color: var(--text_primary);
            font-size: 13px;
            padding: 7px;
            height: 38px;
            cursor: pointer;
            width: 100%;
            box-sizing: border-box;
            outline: none;
        }
        .ep-model-custom-input {
            margin-top: 4px !important;
            height: 38px !important;
            font-size: 13px !important;
            padding: 10px 12px !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
        }

        .menu-item {
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            color: var(--text_primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            transition: background-color 0.15s;
        }
        .menu-item:hover {
            background-color: #F9F9F9;
        }
        body[data-theme="dark"] .menu-item:hover {
            background-color: #1f1e1d;
        }

        /* 상단 헤더 아래 영역만 어둡게 만드는 서랍 전용 오버레이 (300ms 페이드 애니메이션) */
        .ep-chat-drawer-overlay {
            position: fixed !important;
            top: 104px;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: auto !important;
            background: rgba(0, 0, 0, 0.35);
            z-index: 99998 !important;
            display: block !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease-in-out !important;
        }
        .ep-chat-drawer-overlay.open {
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        /* 에피소드 노트 및 공용 팝업 모달 */
        .ep-prompt-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 100050;
            display: none;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
        }
        .ep-prompt-overlay.visible {
            display: flex;
        }
        .ep-prompt-modal {
            background: #fff !important;
            border-radius: 12px;
            padding: 24px;
            width: 480px;
            max-width: 90vw;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
        }
        .ep-epnote-modal {
            width: 600px !important;
            height: 690px !important;
            max-height: 690px !important;
        }
        .ep-profile-textarea {
            width: 100%;
            flex: 1;
            padding: 10px 12px;
            font-size: 14px;
            background-color: #fafafa;
            border: 1px solid #E6E6E6;
            border-radius: 8px;
            color: #222;
            box-sizing: border-box;
            resize: none;
            outline: none;
            margin: 0;
            font-family: inherit;
            line-height: 1.6;
        }
        body[data-theme="dark"] .ep-prompt-modal {
            background: #242321 !important;
            color: #F0EFEB !important;
        }
        body[data-theme="dark"] .ep-profile-textarea {
            background-color: #141413 !important;
            border-color: #42413D !important;
            color: #F0EFEB !important;
        }

        .ep-header2 {
            margin: 0 0 8px 0;
            font-size: 19px;
            font-weight: 700;
            color: #222 !important;
        }
        body[data-theme="dark"] .ep-header2 {
            color: #F0EFEB !important;
        }

        .ep-menu-toggle {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--icon_primary);
        }

        /* 토스트 알림창 */
        #pastel-toast-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        }
        .ep-toast-item {
            opacity: 0;
            transform: scale(0.9);
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.15s ease;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .ep-toast-item.visible {
            opacity: 1;
            transform: scale(1);
        }
        .ep-toast-container {
            background-color: #23343A !important;
            border: 1.5px solid #88B9C8 !important;
            padding: 9px 14px !important;
            border-radius: 9999px !important;
            display: inline-flex !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
        }
        .ep-toast-text {
            color: #EFFCFF !important;
            font-size: 12px !important;
            margin: 0 !important;
            white-space: nowrap !important;
            font-weight: bold !important;
        }

        /* 크랙 순정 에디터 박스 및 폼 잔여 요소의 높이 점유 원천 박멸 */
        .flex.w-full.flex-col.rounded-lg.border.bg-background.transition-colors,
        form:has(.ProseMirror),
        .relative.flex.w-full.flex-col:has(.ProseMirror) {
            position: absolute !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            visibility: hidden !important;
        }

        /* 크랙 순정 안내 문구 및 기타 불필요한 하단 잔여 레이아웃 격리 */
        .bg-bg_screen.pointer-events-auto p.text-xs,
        .bg-bg_screen.pointer-events-auto .text-text_tertiary {
            display: none !important;
        }

        /* 크랙 하단 부모 컨테이너 완벽 바닥 고정 (평상시 z-index 30) */
        .bg-bg_screen.pointer-events-auto,
        .flex.flex-col.w-\\[calc\\(100\\%-40px\\)\\] {
            position: fixed !important;
            bottom: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            max-width: 760px !important;
            width: calc(100% - 64px) !important;
            padding: 0 0 10px 0 !important;
            margin: 0 !important;
            background-color: var(--bg_screen, #ffffff) !important;
            z-index: 30 !important;
            overflow: visible !important;
        }

        /* 크랙 순정 서랍 딤 활성화 시(opacity-100 감지): 입력창을 0보다 작은 -1로 내려 순정 딤 및 서랍 아래로 자동 격하 */
        body:has(.bg-bg_dimmed.opacity-100) .bg-bg_screen.pointer-events-auto,
        body:has(.bg-bg_dimmed.opacity-100) .flex.flex-col.w-\\[calc\\(100\\%-40px\\)\\] {
            z-index: -1 !important;
        }
        body[data-theme="dark"] .bg-bg_screen.pointer-events-auto {
            background-color: #141413 !important;
        }

        /* 하단 입력바 & 특수문자 구슬 툴바 (crack.html 순정 100% 복원) */
        .chat-footer-control {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
            background: transparent;
            position: relative;
            user-select: none;
            overflow: visible !important;
        }
        .input-area {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 160px;
            border: 1px solid #E6E6E6;
            border-radius: 12px;
            background-color: #fafafa;
            padding: 15px 20px 10px 20px !important;
            box-sizing: border-box;
            transition: border-color 0.2s, background-color 0.2s;
        }
        .input-area:focus-within {
            border: 2px solid #888888 !important;
            background-color: #ffffff !important;
            padding: 14px 19px 9px 19px !important;
        }
        body[data-theme="dark"] .input-area {
            background-color: #1a1918;
            border-color: #42413D;
        }
        body[data-theme="dark"] .input-area:focus-within {
            background-color: #141413 !important;
            border-color: #b0b0b0 !important;
        }
        .chat-textarea {
            width: 100%;
            height: 100%;
            border: none !important;
            background: transparent !important;
            color: var(--text_primary);
            padding: 0 !important;
            resize: none;
            font-size: 16px;
            outline: none;
            line-height: 20px;
            font-family: inherit;
            box-sizing: border-box;
        }
        .input-toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            user-select: none;
            margin-top: 5px;
        }
        .tool-btn {
            position: relative;
            background-color: #fcfcfc;
            border: 1px solid #B0B0B0;
            color: var(--text_primary);
            cursor: pointer;
            width: 26px !important;
            height: 26px !important;
            min-width: 26px !important;
            min-height: 26px !important;
            border-radius: 50% !important;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 !important;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
            flex-shrink: 0;
        }
        .tool-btn::after {
            content: "";
            position: absolute;
            top: -8px;
            bottom: -8px;
            left: -3px;
            right: -3px;
            border-radius: 50%;
        }
        .tool-btn.active {
            border-color: #888888 !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
        }
        body[data-theme="dark"] .tool-btn {
            background-color: #242321;
            border-color: #555;
            color: #F0EFEB;
        }
        .vertical-divider {
            width: 1px;
            height: 14px;
            border-left: 1px dashed #888888;
            flex-shrink: 0;
        }

        /* 단축어 팝업 (어떤 부모의 overflow에도 잘리지 않도록 fixed 최상단 렌더링) */
        #ep-shortcut-select-popup {
            display: none;
            position: fixed !important;
            bottom: 180px !important;
            left: 50% !important;
            transform: translateX(-360px) !important;
            z-index: 2147483647 !important;
            border-radius: 12px;
            padding: 10px !important;
            width: 130px !important;
            height: auto !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
            flex-direction: column;
            gap: 8px;
            border: 1px solid #E6E6E6;
            background: #ffffff;
            color: #222222;
            box-sizing: border-box;
            user-select: none;
        }
        @media (max-width: 768px) {
            #ep-shortcut-select-popup {
                left: 32px !important;
                transform: none !important;
            }
        }
        body[data-theme="dark"] #ep-shortcut-select-popup {
            background: #242321;
            border-color: #42413D;
            color: #F0EFEB;
        }
        #ep-shortcut-select-list {
            max-height: 164px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .ep-shortcut-popup-item {
            background-color: #f5f5f5;
            border: 1px solid #E6E6E6;
            border-radius: 6px;
            min-height: 28px;
            height: auto;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            padding: 4px 10px;
            cursor: pointer;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #555555;
            transition: background-color 0.2s, color 0.2s;
            white-space: normal;
            word-break: break-all;
            box-sizing: border-box;
        }
        .ep-shortcut-popup-item:hover {
            background-color: #e8e8e8;
            color: #222222;
        }
        body[data-theme="dark"] .ep-shortcut-popup-item {
            background-color: #1a1918;
            border-color: #42413D;
            color: #aaa;
        }
        body[data-theme="dark"] .ep-shortcut-popup-item:hover {
            background-color: #333;
            color: #fff;
        }

        /* 템플릿 퀵패널 (화면 최상단 독립 렌더링) */
        .ep-tpl-quick-panel {
            position: fixed !important;
            bottom: 180px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 760px !important;
            max-width: calc(100% - 64px) !important;
            background: #ffffff;
            border: 1px solid #E6E6E6;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
            padding: 14px 16px;
            display: none;
            flex-direction: column;
            gap: 10px;
            z-index: 2147483647 !important;
            max-height: 360px;
            box-sizing: border-box;
        }
        body[data-theme="dark"] .ep-tpl-quick-panel {
            background: #242321;
            border-color: #42413D;
        }
        .ep-tpl-quick-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .ep-tpl-quick-title {
            font-size: 14px;
            font-weight: 800;
            color: #333;
            user-select: none;
        }
        body[data-theme="dark"] .ep-tpl-quick-title {
            color: #F0EFEB;
        }
        .ep-tpl-quick-folders {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding-bottom: 2px;
            scrollbar-width: none;
        }
        .ep-tpl-quick-folders::-webkit-scrollbar {
            display: none;
        }
        .ep-ftab {
            height: 28px;
            background: #f0f0f0;
            border: 1px solid #ddd;
            padding: 0 12px;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 600;
            color: #555;
            cursor: pointer;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            box-sizing: border-box;
        }
        .ep-ftab.active {
            background: #F5E19A;
            color: #333;
            border-color: #ddd;
        }
        body[data-theme="dark"] .ep-ftab {
            background: #1a1918;
            border-color: #42413D;
            color: #888;
        }
        body[data-theme="dark"] .ep-ftab.active {
            background: #F5E19A;
            color: #222;
        }
        .ep-tpl-quick-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            max-height: 160px;
            overflow-y: auto;
            padding-right: 2px;
        }
        .ep-tpl-quick-card {
            background: #f9f9f9;
            border: 1px solid #E6E6E6;
            border-radius: 8px;
            padding: 9px 11px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: left;
            user-select: none;
            transition: border-color 0.15s, background-color 0.15s;
        }
        .ep-tpl-quick-card:hover {
            border-color: #F5E19A;
            background-color: #fffef9;
        }
        body[data-theme="dark"] .ep-tpl-quick-card {
            background: #1a1918;
            border-color: #42413D;
        }
        body[data-theme="dark"] .ep-tpl-quick-card:hover {
            border-color: #F5E19A;
            background-color: #2a2825;
        }
        .ep-tpl-quick-card-title {
            font-size: 13px;
            font-weight: 700;
            color: #222;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        body[data-theme="dark"] .ep-tpl-quick-card-title {
            color: #F0EFEB;
        }
        .ep-tpl-quick-card-text {
            font-size: 11.5px;
            color: #777;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ep-tpl-quick-search-row {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .ep-tpl-quick-btn-vars {
            background: transparent !important;
            border: 1px solid #E6E6E6 !important;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #888;
            flex-shrink: 0;
            transition: 0.15s;
            outline: none;
        }
        .ep-tpl-quick-btn-vars:hover {
            border-color: #b0b0b0 !important;
            color: #222;
        }
        body[data-theme="dark"] .ep-tpl-quick-btn-vars {
            border-color: #42413D !important;
            color: #aaa;
        }

        .ep-search-wrapper {
            position: relative;
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
        }
        .ep-search {
            width: 100%;
            flex: 1;
            min-width: 0;
            padding: 8px 34px 8px 12px !important;
            min-height: 36px;
            border: 1px solid #ddd !important;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            background: #fff !important;
            color: #222 !important;
            margin: 0 !important;
            outline: none;
        }
        body[data-theme="dark"] .ep-search {
            background: #141413 !important;
            border-color: #42413D !important;
            color: #F0EFEB !important;
        }
        .ep-search-clear-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent !important;
            border: none !important;
            color: #aaa;
            cursor: pointer;
            padding: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            outline: none;
            z-index: 5;
        }

        /* 치환자 설정 모달 */
        .ep-tpl-vars-modal {
            background: #fff !important;
            border-radius: 12px;
            padding: 20px;
            width: 320px;
            max-width: 90vw;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            gap: 14px;
            box-sizing: border-box;
        }
        body[data-theme="dark"] .ep-tpl-vars-modal {
            background: #242321 !important;
            color: #F0EFEB;
        }
        .ep-tpl-vars-row {
            display: flex;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
        }
        .ep-tpl-vars-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: left;
        }
        .ep-tpl-vars-label {
            font-size: 13px;
            font-weight: 700;
            color: #555;
            user-select: none;
        }
        body[data-theme="dark"] .ep-tpl-vars-label {
            color: #aaa;
        }
        .ep-tpl-vars-input {
            width: 100%;
            height: 36px;
            padding: 0 10px;
            border: 1px solid #E6E6E6 !important;
            border-radius: 8px;
            font-size: 13px;
            box-sizing: border-box;
            background: #fafafa !important;
            color: #222 !important;
            outline: none;
        }
        body[data-theme="dark"] .ep-tpl-vars-input {
            background: #141413 !important;
            border-color: #42413D !important;
            color: #F0EFEB !important;
        }
        .ep-tpl-vars-input:focus {
            border-color: #b0b0b0 !important;
            background: #fff !important;
        }

        /* 커스텀 기호 모달 스위치 & 인풋 */
        .ep-prompt-title { font-size: 14px; font-weight: 700; color: #222 !important; }
        .ep-prompt-input {
            width: 100%; height: 36px; padding: 0 10px; border: 1px solid #E6E6E6 !important;
            border-radius: 8px; font-size: 13px; box-sizing: border-box; background: #fafafa !important;
            color: #222 !important; outline: none; transition: 0.2s;
        }
        .ep-prompt-input:focus { border-color: #b0b0b0 !important; background: #fff !important; }
        .ep-profile-label { font-size: 13px; font-weight: 600; color: #333; user-select: none; }
        .drawer-toggle-switch { position: relative; display: inline-block; width: 30px; height: 16px; flex-shrink: 0; cursor: pointer; }
        .drawer-toggle-switch input { opacity: 0; width: 0; height: 0; }
        .drawer-toggle-slider { position: absolute; inset: 0; background-color: #e2e2e2; border-radius: 16px; transition: background-color .2s; }
        .drawer-toggle-slider:before {
            position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px;
            background-color: white; border-radius: 50%; transition: transform .2s;
        }
        .drawer-toggle-switch input:checked + .drawer-toggle-slider { background-color: #F5E19A !important; }
        .drawer-toggle-switch input:checked + .drawer-toggle-slider:before { transform: translateX(14px); }
        body[data-theme="dark"] .drawer-toggle-slider { background-color: #444; }
        body[data-theme="dark"] .ep-prompt-title { color: #F0EFEB !important; }
        body[data-theme="dark"] .ep-prompt-input { background: #141413 !important; border-color: #42413D !important; color: #F0EFEB !important; }
        body[data-theme="dark"] .ep-profile-label { color: #ccc; }

        /* 로어 저장소 모달 전용 순정 스타일시트 (crack.html 100% 일치) */
        .decentral-color-container, .decentral-color-container * { box-sizing: border-box !important; }
        .decentral-color-container {
            --decentral-text: #2c3e50;
            --decentral-text-inverted: #FFFFFF;
            --decentral-text-formal: #555555;
            --decentral-text-inactive-hover: #111111;
            --decentral-text-inactive: #888888;
            --decentral-background: #FFFFFF;
            --decentral-border: #eeeeee;
            --decentral-active-item: #88b9c8;
            --decentral-inactive-item: #cbd5e0;
            --decentral-text-background: #FFFFFF;
            --decentral-text-border: #cccccc;
            --decentral-switch-background: #FFFFFF;
            --decentral-inner-border: #d4d4d4;
        }
        body[data-theme="dark"] .decentral-color-container {
            --decentral-text: #F0EFEB;
            --decentral-text-inverted: #141413;
            --decentral-text-formal: #aaa;
            --decentral-text-inactive-hover: #fff;
            --decentral-text-inactive: #888;
            --decentral-background: #242321;
            --decentral-border: #42413D;
            --decentral-active-item: #bcd0d7;
            --decentral-inactive-item: #42413D;
            --decentral-text-background: #141413;
            --decentral-text-border: #42413D;
            --decentral-switch-background: #141413;
            --decentral-inner-border: #4a4a46;
        }
        .decentral-modal-container {
            display: flex; align-items: center !important; justify-content: center !important;
            z-index: 2147483647 !important; pointer-events: auto; background-color: rgba(0,0,0,0.5);
            top: 0; left: 0; width: 100%; height: 100%; position: fixed; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
        }
        .decentral-modal {
            display: flex !important; flex-direction: column !important; width: 600px !important; max-width: 90vw !important;
            height: 690px !important; min-height: 690px !important; max-height: 690px !important; border-radius: 16px !important;
            background-color: var(--decentral-background) !important; margin: 0 auto !important; color: var(--decentral-text) !important;
            box-shadow: 0 8px 40px rgba(0,0,0,0.2) !important; overflow: hidden !important; box-sizing: border-box !important; padding: 28px !important;
        }
        .decentral-modal-title-container.top-static-title {
            display: flex !important; align-items: center !important; justify-content: space-between !important;
            margin-bottom: 16px !important; flex-shrink: 0; width: 100% !important;
        }
        .decental-modal-title-text { margin: 0 !important; font-weight: 700 !important; font-size: 17px !important; color: var(--decentral-text) !important; }
        .decentral-close-button {
            background: none !important; border: none !important; cursor: pointer !important; padding: 4px 8px !important;
            border-radius: 6px !important; color: #666 !important; transition: 0.2s !important; font-weight: bold !important;
        }
        .decentral-close-button:hover { background: #eee !important; color: #222 !important; }
        .decentral-menu-container {
            box-shadow: inset 0 -1px 0 var(--decentral-border) !important; display: flex !important; align-items: flex-end !important;
            width: 100% !important; margin-bottom: 12px !important; overflow-x: auto !important; gap: 17px !important; flex-shrink: 0;
        }
        .decentral-menu-container::-webkit-scrollbar { display: none; }
        .decentral-menu-container .decentral-menu-element {
            background: none !important; border: none !important; font-size: 14px !important; font-weight: 500 !important;
            color: var(--decentral-text-inactive) !important; padding: 0 4px 8px 4px !important; cursor: pointer !important;
            border-bottom: 2.5px solid transparent !important; transition: 0.2s !important; white-space: nowrap !important;
        }
        .decentral-menu-container .decentral-menu-element[active="true"] {
            color: var(--decentral-text) !important; border-bottom: 2.5px solid var(--decentral-active-item) !important; font-weight: bold !important;
        }
        .decentral-grid-container { display: block !important; width: 100% !important; height: 100% !important; overflow-y: auto !important; overflow-x: hidden !important; }
        .decentral-grid { display: grid !important; width: 100% !important; grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; padding: 4px 0 16px 0 !important; }
        .decentral-grid-element-long-semi-flat { display: flex; flex-direction: column; grid-column: 1 / 3; width: 100%; }
        .decentral-boxed-field {
            display: flex !important; width: 100%; background-color: var(--decentral-switch-background) !important;
            border: 1px solid var(--decentral-text-border) !important; border-radius: 8px !important; padding: 12px; box-sizing: border-box;
        }
        .decentral-boxed-field .element-title { font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--decentral-text) !important; text-align: left; }
        .decentral-boxed-field .element-description { font-size: 11px; color: var(--decentral-text-formal) !important; line-height: 1.4; text-align: left; }
        .decentral-text-field {
            background-color: var(--decentral-text-background) !important; border: 1px solid var(--decentral-text-border) !important;
            border-radius: 8px !important; width: 100%; padding: 4px 8px; color: var(--decentral-text); height: 32px; box-sizing: border-box; outline: none;
        }
        .decentral-text-area {
            background-color: var(--decentral-text-background) !important; border: 1px solid var(--decentral-text-border) !important;
            border-radius: 8px !important; resize: none; width: 100%; padding: 8px; color: var(--decentral-text); box-sizing: border-box; outline: none;
        }
        .decentral-button {
            background-color: var(--decentral-active-item); color: var(--decentral-text-inverted); width: 100%; height: 32px;
            padding: 4px 16px; border: none; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
        }
        .decentral-select { 
            width: 100%; border-radius: 8px !important; background-color: var(--decentral-text-background) !important;
            color: var(--decentral-text) !important; border: 1px solid var(--decentral-text-border) !important; font-size: 13px; height: 32px; padding: 0 10px; cursor: pointer; outline: none;
        }
        .ep-lore-panel { display: none !important; }
        .ep-lore-panel.active-panel { display: grid !important; }
        #ep-lore-panel-log.active-panel, #ep-lore-panel-restore.active-panel { display: flex !important; }
        .ep-costs-log-item {
            padding: 8px 12px; border: 1px solid var(--decentral-inner-border); border-radius: 8px;
            background-color: var(--decentral-background); color: var(--decentral-text); font-size: 12px; line-height: 1.5; text-align: left; width: 100%; box-sizing: border-box;
        }
    `;

    // CSS 주입
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.innerHTML = PASTEL_CSS;
    (document.head || document.documentElement).appendChild(styleEl);

    /* ==========================================================================
     * 2. 토스트 헬퍼 함수 (crack.html 순정 100% 완전 일치)
     * ========================================================================== */
    function showToast(msg) {
        let container = document.getElementById('pastel-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pastel-toast-container';
            document.body.appendChild(container);
        }
        const item = document.createElement('div');
        item.className = 'ep-toast-item';
        item.innerHTML = `<div class="ep-toast-container"><p class="ep-toast-text">${msg}</p></div>`;
        container.appendChild(item);
        setTimeout(() => item.classList.add('visible'), 20);
        setTimeout(() => {
            item.classList.remove('visible');
            setTimeout(() => {
                if (container && container.contains(item)) item.remove();
            }, 200);
        }, 2500);
    }

    let loreExtPersistentToast = null;

    function showLoreExtPersistentToast(message) {
        if (loreExtPersistentToast) {
            loreExtPersistentToast.remove();
            loreExtPersistentToast = null;
        }
        let container = document.getElementById('pastel-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pastel-toast-container';
            document.body.appendChild(container);
        }

        loreExtPersistentToast = document.createElement("div");
        loreExtPersistentToast.className = "ep-toast-item";
        loreExtPersistentToast.innerHTML = `
            <div class="ep-toast-container">
                <p class="ep-toast-text">${message}</p>
            </div>
        `;
        container.appendChild(loreExtPersistentToast);
        setTimeout(() => {
            if (loreExtPersistentToast) loreExtPersistentToast.classList.add('visible');
        }, 20);
    }

    function hideLoreExtPersistentToast() {
        if (loreExtPersistentToast) {
            const target = loreExtPersistentToast;
            loreExtPersistentToast = null;
            target.classList.remove('visible');
            setTimeout(() => {
                let container = document.getElementById('pastel-toast-container');
                if (container && container.contains(target)) target.remove();
            }, 200);
        }
    }

    /* ==========================================================================
     * 2.5 로어 블록 화면 은닉 필터 (index.html 순정 100% 일치)
     * ========================================================================== */
    function stripLoreInjectionBlock(text) {
        if (!text) return "";
        let str = String(text).replace(/\r\n/g, '\n').trimStart();
        if (!str.startsWith('[LORE')) return str;

        // 1. 메시지 시작부의 [LORE 1]부터 유저 본문 경계(\n\n) 직전까지의 모든 줄바꿈 포함 블록을 통째로 적출
        str = str.replace(/^\[LORE[\s\S]*?(?=(?:\n\s*\n(?!\s*\[LORE))|$)/i, '').trimStart();

        // 2. 만약 단일 개행으로 유저 텍스트와 붙어있는 잔여 [LORE ...] 태그가 남아있다면 2차 정리
        while (/^\[LORE\s*\d*\]/i.test(str)) {
            str = str.replace(/^\[LORE\s*\d*\][^\n]*(?:\n|$)/i, '').trimStart();
        }
        return str;
    }

    // [HTML 저장 전용] index.html 순정 100% 완전 일치 마크다운 파서 (화면 비간섭 / 저장 시에만 동작)
    function parseChatMarkdownForExport(text, msgType = 'model') {
        if (!text) return "";

        const isUser = (msgType === 'user');

        // 1. 주입된 로어 블록 은닉 및 과도한 개행만 정리 (일반 문단 빈 줄은 100% 보존)
        let cleanedText = stripLoreInjectionBlock(text).replace(/\n{3,}/g, '\n\n').trim();

        // 2. 크랙 에디터가 대사카드/문자 사이에 강제로 끼워넣은 빈 줄만 스마트 결합
        cleanedText = cleanedText
            .replace(/([—―][^\n]+)\n+(?=▎)/g, '$1\n')
            .replace(/(▎[^\n]*)\n+(?=▎)/g, '$1\n')
            .replace(/([—―][^\n]+)\n+(?=`)/g, '$1\n')
            .replace(/(`[^`\n]+`)\n+(?=`)/g, '$1\n');

        let html = cleanedText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 0. HUD 전용 ❴ ❵ 파싱
        html = html.replace(/❴\n?([\s\S]*?)\n?❵(\r?\n)?/g, function(match, hudContent) {
            return `<div class="ep-hud-box">${hudContent.trim()}</div>`;
        });

        // 0.2 대사 카드 파싱 (사이에 빈 줄이 있어도 완벽 결합)
        html = html.replace(/(^|\r?\n)[—―]\s*([^\n\r]+)(?:\r?\n\s*)*((?:\r?\n\s*▎[^\n\r]*)+)(\r?\n)?/g, function(match, leadNL, name, lines) {
            const cleanName = name.trim();
            const contentList = lines.split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('▎'))
                .map(l => l.replace(/^▎\s*/, ''));
            const cleanContent = contentList.join('\n');
            return `${leadNL}<div class="ep-dialogue-card-wrapper ${isUser ? 'user-side' : ''}"><div class="ep-dialogue-badge-row"><div class="ep-dialogue-badge">${cleanName}</div></div><div class="ep-dialogue-card-box">${cleanContent}</div></div>`;
        });

        // 0.3 메신저 문자 말풍선 파싱 (사이에 빈 줄이 있어도 완벽 결합)
        html = html.replace(/(^|\r?\n)[—―]\s*([^\n\r]+)(?:\r?\n\s*)*((?:\r?\n\s*`[^`\n\r]+`)+)(\r?\n)?/g, function(match, leadNL, name, lines) {
            const cleanName = name.trim();
            const bubbleList = lines.split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('`') && l.endsWith('`'))
                .map(l => l.slice(1, -1).trim());
            if (bubbleList.length === 0) return match;

            const userSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M17.925 20.056a6 6 0 0 0-11.851.001"/><circle cx="12" cy="11" r="4"/><circle cx="12" cy="12" r="10"/></svg>`;
            const bubblesHtml = bubbleList.map(b => `<div class="ep-sms-bubble">${b}</div>`).join('');
            return `${leadNL}<div class="ep-sms-container ${isUser ? 'user-side' : ''}"><div class="ep-sms-avatar-icon">${userSvg}</div><div class="ep-sms-content-col"><span class="ep-sms-name">${cleanName}</span>${bubblesHtml}</div></div>`;
        });

        // 1. 코드블록 치환
        html = html.replace(/`{3}([^\n]*?)(?:\r?\n([\s\S]*?))?`{3}(\r?\n)?/g, function(match, title, content) {
            const trimmedTitle = title.trim();
            if (content === undefined) return `<div class="ep-code-block-wrapper"><div class="ep-code-block-body no-header">${trimmedTitle}</div></div>`;
            const cleanedContent = content.trim();
            return trimmedTitle 
                ? `<div class="ep-code-block-wrapper"><div class="ep-code-block-header">${trimmedTitle}</div><div class="ep-code-block-body">${cleanedContent}</div></div>`
                : `<div class="ep-code-block-wrapper"><div class="ep-code-block-body no-header">${cleanedContent}</div></div>`;
        });

        // 2. 인라인 백틱
        html = html.replace(/`([^`\n]+)`/g, '<span class="ep-inline-code">$1</span>');

        // 2.5 단축어 전송 토큰 치환 (!단축어 뱃지 렌더링)
        html = html.replace(/(![a-zA-Z0-9가-힣/]+)/g, '<span class="ep-chat-shortcut-token">$1</span>');

        // 2.8 점선 구분선
        html = html.replace(/(^\s*([\*_=~+─━═┈┉┄┅―—–‒·•-]\s*){3,}\s*$|\*{3,}|={3,}|─{2,}|━{2,}|═{2,})(\r?\n)?/gm, '<hr class="ep-chat-hr">');

        // 3. 볼드
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="ep-chat-bold">$1</strong>');

        // 4. 행동 지문
        html = html.replace(/\*([^*\n]+)\*/g, '<span class="ep-chat-action">$1</span>');

        // 5. 연속 인용구 그룹핑 알고리즘 (> 로 시작하는 줄 연속 묶음 처리)
        const lines = html.split('\n');
        const processedLines = [];
        let inQuoteBlock = false;
        let quoteBuffer = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('&gt;')) {
                const content = line.replace(/^\s*&gt;\s?/, '');
                if (!inQuoteBlock) inQuoteBlock = true;
                quoteBuffer.push(content);
            } else {
                if (inQuoteBlock) {
                    processedLines.push(`<span class="quote-block">${quoteBuffer.join('\n')}</span><!--qb-end-->`);
                    quoteBuffer = [];
                    inQuoteBlock = false;
                }
                processedLines.push(line);
            }
        }

        if (inQuoteBlock) {
            processedLines.push(`<span class="quote-block">${quoteBuffer.join('\n')}</span><!--qb-end-->`);
        }

        let result = processedLines.join('\n');
        result = result.replace(/(<!--qb-end-->)\n/g, '$1');
        result = result.replace(/<!--qb-end-->/g, '');
        return result;
    }

    /* ==========================================================================
     * 2.6 index.html 순정 100% 완전 일치 소설형 HTML 대화 저장 엔진
     * ========================================================================== */
    async function exportCrackChatToHtml() {
        const chatId = getChatId();
        showToast("📥 1턴부터 전체 대화 내역 수급 중...");

        try {
            // 1. contents-api 커서 순회로 1턴부터 끝까지의 전체 대화 배열 수급
            const messages = await fetchCrackMessagesPure(chatId, -1);
            if (!messages || messages.length === 0) {
                showToast("❌ 저장할 대화 내역이 없습니다.");
                return;
            }

            let title = document.title || '대화방';
            // 크랙/뤼튼 사이트 접미사 및 특수 꼬리표 ('_ 크랙', '| 크랙', '- CRACK' 등) 정밀 제거
            title = title.replace(/\s*[-_|·~/•]\s*(크랙|CRACK|wrtn|뤼튼)\s*$/i, '').trim();
            title = title.replace(/^(크랙|CRACK|wrtn|뤼튼)\s*[-_|·~/•]\s*/i, '').trim();
            title = title.replace(/[\\/:*?"<>|]/g, '_').trim();
            if (!title) title = '대화방';
            const nowStr = new Date().toISOString().slice(0, 10);

            // 2. index.html 순정 100% 동일한 소설형 뷰어 CSS 및 HTML 구조 생성
            let htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
    :root { --text_primary: #222222; --bg_primary: #ffffff; }
    * { box-sizing: border-box; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
        background: #ffffff; color: var(--text_primary);
        max-width: 780px; margin: 0 auto; padding: 40px 24px;
        line-height: 1.7; font-size: 16px; word-break: break-all;
    }
    h1.novel-title {
        font-size: 22px; font-weight: 800; text-align: center;
        margin: 0 0 24px 0; padding-bottom: 16px; border-bottom: 2px solid #333;
    }
    .msg-card { padding: 22px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.6; text-align: left; }
    .msg-text { white-space: pre-wrap !important; }
    .ep-chat-bold { font-weight: 800 !important; }
    .ep-chat-action { color: #666666 !important; font-weight: normal; }
    .quote-block { border-left: 4px solid #888888; padding-left: 12px; margin: 8px 0 8px 8px; display: block; color: var(--text_primary); white-space: pre-wrap; }
    .ep-inline-code { background-color: #F8F2F4; color: #6E5960; border: 1px solid #bfa5a6; border-radius: 4px; padding: 1.5px 4px; font-size: 15px !important; margin: 0 2px; display: inline; }
    .ep-code-block-wrapper { border-radius: 8px; overflow: hidden; margin: 10px 0; box-sizing: border-box; border: 1px solid #e2d5d8; }
    .ep-code-block-header { background-color: #f2e5e9; color: #6E5960; font-weight: 800; font-size: 14px; padding: 8px 16px; text-align: left; }
    .ep-code-block-body { background-color: #F8F2F4; color: #6E5960 !important; padding: 14px 16px !important; white-space: pre-wrap; font-size: 14.5px !important; line-height: 1.6; }
    .ep-code-block-body.no-header { border-radius: 8px; }
    .ep-hud-box { position: relative; margin: 0 0 0 auto; width: fit-content; padding: 2px 0 0 0; text-align: right; font-size: 14px !important; font-weight: 300; letter-spacing: 1.4px; line-height: 1.6; }
    .ep-hud-box::after { content: ""; display: block; width: 100%; margin-top: 6px; border-bottom: 6px double #D2C0C0; }
    .ep-dialogue-card-wrapper { position: relative; display: flex; flex-direction: column; width: fit-content; max-width: 100%; margin: 12px 0; box-sizing: border-box; }
    .ep-dialogue-card-wrapper.user-side { margin-left: auto; }
    .ep-dialogue-badge-row { display: flex; width: 100%; padding: 0 16px; box-sizing: border-box; margin-top: -11px; margin-bottom: -11px; z-index: 2; pointer-events: none; }
    .ep-dialogue-card-wrapper.user-side .ep-dialogue-badge-row { justify-content: flex-end; }
    .ep-dialogue-badge { background-color: #bfa5a6; color: #FDFBFC; font-size: 13px; font-weight: 600; padding: 3px 12px; border-radius: 9999px; width: fit-content; display: inline-flex; align-items: center; white-space: nowrap; }
    .ep-dialogue-card-box { background-color: #F8F2F4; border: 0.7px solid #bfa5a6; border-radius: 0 16px 0 16px; color: #9a868d; font-weight: 700; padding: 14px 16px 12px 16px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; width: 100%; box-sizing: border-box; }
    .ep-dialogue-card-wrapper.user-side .ep-dialogue-card-box { border-radius: 16px 0 16px 0; }
    .ep-sms-container { display: flex; gap: 10px; margin: 12px 0; align-items: flex-start; width: 100%; box-sizing: border-box; }
    .ep-sms-container.user-side { flex-direction: row-reverse; }
    .ep-sms-avatar-icon { width: 28px; height: 28px; flex-shrink: 0; }
    .ep-sms-avatar-icon svg { width: 100%; height: 100%; stroke: #bfa5a6; }
    .ep-sms-content-col { display: flex; flex-direction: column; gap: 6px; max-width: 75%; align-items: flex-start; }
    .ep-sms-container.user-side .ep-sms-content-col { align-items: flex-end; }
    .ep-sms-name { font-size: 13px; font-weight: 700; color: #bfa5a6; line-height: 1; }
    .ep-sms-bubble { background-color: #F8F2F4; border: 1px solid #bfa5a6; border-radius: 16px; color: #9a868d; font-size: 15px; font-weight: 700; line-height: 1.5; padding: 10px 14px; width: fit-content; max-width: 100%; box-sizing: border-box; }
    hr.ep-chat-hr { border: none; border-top: 1.5px dashed #ccc; margin: 25px 0; }
    .ep-chat-shortcut-token { background-color: #f2e5e9; color: #6E5960; border: 1px solid #bfa5a6; border-radius: 4px; padding: 1.5px; font-size: 14px; margin: 0 2px; display: inline; }
</style>
</head>
<body>
<h1 class="novel-title">${title}</h1>
`;

            messages.forEach(m => {
                const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'model';
                const rawTxt = m.content || m.text || m.message || '';
                const parsedHtml = parseChatMarkdownForExport(rawTxt, role);
                if (parsedHtml.trim()) {
                    htmlContent += `<div class="msg-card"><div class="msg-text">${parsedHtml}</div></div>\n`;
                }
            });

            htmlContent += `</body></html>`;

            // 3. 파일 다운로드 트리거
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}_${nowStr}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`📄 총 ${messages.length}개 턴 대화 저장이 완료되었습니다.`);
        } catch (err) {
            console.error("[대화 저장 오류]:", err);
            showToast("❌ 대화 저장 중 오류가 발생했습니다.");
        }
    }

    /* ==========================================================================
     * 3. UI 뼈대 DOM 마크업 주입 (우측 서랍 & 에피소드 노트 모달 & 상단 버튼)
     * ========================================================================== */
    function injectBaseDOM() {
        // [A] 서랍 및 모달 뼈대 주입 (최초 1회만 실행)
        if (!document.getElementById('ep-chat-right-drawer')) {
            // 1. 딤 배경 오버레이
            const overlay = document.createElement('div');
            overlay.id = 'ep-chat-drawer-overlay';
            overlay.className = 'ep-chat-drawer-overlay';
            document.body.appendChild(overlay);

            // 2. 우측 서랍 메뉴 컨테이너
            const drawer = document.createElement('div');
            drawer.id = 'ep-chat-right-drawer';
            drawer.className = 'right-drawer-container';
            drawer.innerHTML = `
                <div class="right-drawer-body">
                    <!-- 1) API 설정 아코디언 -->
                    <div class="drawer-section-title" id="ep-api-accordion-title">
                        <span>API 설정</span>
                        <span class="accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
                    </div>
                    <div class="api-boxed-card" id="api-collapsible-card">
                        <div class="api-tabs-row">
                            <button class="api-tab-btn active" id="ep-api-tab-gemini">Gemini</button>
                            <button class="api-tab-btn" id="ep-api-tab-firebase">Firebase</button>
                        </div>
                        <div class="api-tab-content" id="ep-api-gemini-view">
                            <div class="api-input-group">
                                <label id="ep-api-label-text">Google Gemini API Key</label>
                                <input type="text" class="api-textbox" id="ep-api-key-input">
                                <textarea class="api-textbox" id="ep-api-firebase-textarea" style="display: none; height: 160px; resize: none;"></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- 2) 모델 선택 아코디언 -->
                    <div class="drawer-section-title" id="ep-model-accordion-title">
                        <span>모델 선택</span>
                        <span class="accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
                    </div>
                    <div class="model-boxed-card" id="model-collapsible-card">
                        <div class="model-tabs-row">
                            <button class="model-tab-btn active" id="ep-model-tab-lore">로어</button>
                            <button class="model-tab-btn" id="ep-model-tab-safety">안전 필터</button>
                        </div>

                        <!-- 탭 1: 로어 -->
                        <div class="api-tab-content" id="ep-model-lore-view">
                            <div class="model-input-group">
                                <label>로어 생성 모델</label>
                                <select class="model-select-dropdown" id="ep-lore-extract-model-select">
                                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                                    <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                                    <option value="gemini-3.6-flash" selected>Gemini 3.6 Flash</option>
                                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
                                    <option value="_custom">직접 입력 (Custom)</option>
                                </select>
                                <input type="text" class="api-textbox ep-model-custom-input" id="ep-lore-extract-custom-input" placeholder="모델명 직접 입력" style="display: none;">

                                <label>중요 장면 판단 모델</label>
                                <select class="model-select-dropdown" id="ep-lore-judge-model-select">
                                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                                    <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                                    <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                                    <option value="gemini-3.5-flash-lite" selected>Gemini 3.5 Flash Lite</option>
                                    <option value="_custom">직접 입력 (Custom)</option>
                                </select>
                                <input type="text" class="api-textbox ep-model-custom-input" id="ep-lore-judge-custom-input" placeholder="모델명 직접 입력" style="display: none;">

                                <label>로어 생성 생각 깊이 (Reasoning)</label>
                                <select class="model-select-dropdown" id="ep-lore-reasoning-select">
                                    <option value="off">Off (비활성)</option>
                                    <option value="minimal">Minimal (기본 256)</option>
                                    <option value="low">Low (1024)</option>
                                    <option value="medium" selected>Medium (2048)</option>
                                    <option value="high">High (4096)</option>
                                    <option value="budget">Budget (직접 예산 입력)</option>
                                </select>
                                <input type="number" class="api-textbox ep-model-custom-input" id="ep-lore-reasoning-budget-input" placeholder="토큰 예산 직접 입력" style="display: none;" min="1" max="1000000">

                                <label>중요 장면 판단 생각 깊이</label>
                                <select class="model-select-dropdown" id="ep-lore-judge-reasoning-select">
                                    <option value="minimal" selected>Minimal (권장)</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <!-- 탭 2: 안전 필터 -->
                        <div class="api-tab-content" id="ep-model-safety-view" style="display: none;">
                            <div class="model-input-group">
                                <label>괴롭힘 필터 (Harassment)</label>
                                <select class="model-select-dropdown" id="ep-safety-harassment-select">
                                    <option value="BLOCK_NONE" selected>필터 끄기 (BLOCK_NONE)</option>
                                    <option value="BLOCK_ONLY_HIGH">느슨함 (BLOCK_ONLY_HIGH)</option>
                                    <option value="BLOCK_MEDIUM_AND_ABOVE">보통 (BLOCK_MEDIUM_AND_ABOVE)</option>
                                    <option value="BLOCK_LOW_AND_ABOVE">엄격함 (BLOCK_LOW_AND_ABOVE)</option>
                                </select>

                                <label>증오 발언 필터 (Hate Speech)</label>
                                <select class="model-select-dropdown" id="ep-safety-hate-select">
                                    <option value="BLOCK_NONE" selected>필터 끄기 (BLOCK_NONE)</option>
                                    <option value="BLOCK_ONLY_HIGH">느슨함 (BLOCK_ONLY_HIGH)</option>
                                    <option value="BLOCK_MEDIUM_AND_ABOVE">보통 (BLOCK_MEDIUM_AND_ABOVE)</option>
                                    <option value="BLOCK_LOW_AND_ABOVE">엄격함 (BLOCK_LOW_AND_ABOVE)</option>
                                </select>

                                <label>선정성 필터 (Sexually Explicit)</label>
                                <select class="model-select-dropdown" id="ep-safety-explicit-select">
                                    <option value="BLOCK_NONE" selected>필터 끄기 (BLOCK_NONE)</option>
                                    <option value="BLOCK_ONLY_HIGH">느슨함 (BLOCK_ONLY_HIGH)</option>
                                    <option value="BLOCK_MEDIUM_AND_ABOVE">보통 (BLOCK_MEDIUM_AND_ABOVE)</option>
                                    <option value="BLOCK_LOW_AND_ABOVE">엄격함 (BLOCK_LOW_AND_ABOVE)</option>
                                </select>

                                <label>위험 콘텐츠 필터 (Dangerous)</label>
                                <select class="model-select-dropdown" id="ep-safety-dangerous-select">
                                    <option value="BLOCK_NONE" selected>필터 끄기 (BLOCK_NONE)</option>
                                    <option value="BLOCK_ONLY_HIGH">느슨함 (BLOCK_ONLY_HIGH)</option>
                                    <option value="BLOCK_MEDIUM_AND_ABOVE">보통 (BLOCK_MEDIUM_AND_ABOVE)</option>
                                    <option value="BLOCK_LOW_AND_ABOVE">엄격함 (BLOCK_LOW_AND_ABOVE)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 3) 어시스턴트 -->
                    <div class="drawer-section-title">어시스턴트</div>
                    <div class="menu-item" id="ep-menu-epnote-btn">
                        <span>에피소드 노트</span>
                    </div>
                    <div class="menu-item" id="ep-menu-lore-btn">
                        <span>로어 저장소</span>
                    </div>

                    <!-- 4) 데이터 관리 -->
                    <div class="drawer-section-title">데이터 관리</div>
                    <div class="menu-item" id="ep-menu-html-save-btn">
                        <span>대화 저장</span>
                    </div>
                    <div class="menu-item" id="ep-menu-crack-clear-btn">
                        <span>크랙 데이터 전체 정리</span>
                    </div>
                </div>
            `;
            document.body.appendChild(drawer);

            // 3. 에피소드 노트 모달
            const epNoteModal = document.createElement('div');
            epNoteModal.id = 'ep-epnote-modal-overlay';
            epNoteModal.className = 'ep-prompt-overlay';
            epNoteModal.innerHTML = `
                <div class="ep-prompt-modal ep-epnote-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h2 class="ep-header2" style="margin:0;">에피소드 노트 (미전송 메모)</h2>
                        <button class="ep-menu-toggle" id="ep-epnote-close-btn" style="padding:4px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                    </div>
                    <textarea class="ep-profile-textarea" id="ep-epnote-unsent-textarea" placeholder="AI에게 전송되지 않는 자유 비공개 메모나 설정을 입력하세요..."></textarea>
                </div>
            `;
            document.body.appendChild(epNoteModal);

            // 4. 커스텀 시스템 기호 설정 모달창
            const cmdModal = document.createElement('div');
            cmdModal.id = 'ep-comment-custom-modal-overlay';
            cmdModal.className = 'ep-prompt-overlay';
            cmdModal.style.zIndex = '100060';
            cmdModal.innerHTML = `
                <div class="ep-prompt-modal" style="width: 320px; max-width: 90vw; gap: 16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="ep-prompt-title" style="margin:0;">시스템 기호 설정</div>
                        <button id="ep-cmd-cancel-btn" style="background:transparent; border:none; color:#888; cursor:pointer; padding:4px;" title="닫기">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="ep-profile-label" style="font-size:13px; font-weight:bold; color:var(--text_primary);">세트 기호</span>
                            <label class="drawer-toggle-switch" title="세트 기호 활성화">
                                <input type="checkbox" id="ep-cmd-toggle-set">
                                <span class="drawer-toggle-slider"></span>
                            </label>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <label class="ep-profile-label" style="font-size:12px; color:#888;">시작 기호</label>
                            <textarea rows="1" class="ep-prompt-input" id="ep-cmd-open-input" style="height: 38px; max-height: 74px; resize: none; padding: 8px 10px; font-family: inherit; font-size: 13px; line-height: 1.4; box-sizing: border-box; overflow-y: auto;" placeholder="예: /* 또는 ("></textarea>
                        </div>
                        <div id="ep-cmd-close-group" style="display:none; flex-direction:column; gap:6px;">
                            <label class="ep-profile-label" style="font-size:12px; color:#888;">종료 기호</label>
                            <textarea rows="1" class="ep-prompt-input" id="ep-cmd-close-input" style="height: 38px; max-height: 74px; resize: none; padding: 8px 10px; font-family: inherit; font-size: 13px; line-height: 1.4; box-sizing: border-box; overflow-y: auto;" placeholder="예: */ 또는 )"></textarea>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(cmdModal);

            // 5. 전송 버튼 전용 홀드 프로그레스 링 SVG
            const progressRing = document.createElement('div');
            progressRing.id = 'sh-progress-ring';
            progressRing.innerHTML = `
                <svg id="sh-svg">
                    <circle class="track"/>
                    <circle class="fill"/>
                </svg>
            `;
            document.body.appendChild(progressRing);

            // 6. 치환자 설정 모달 (순정 100%)
            const varsModal = document.createElement('div');
            varsModal.id = 'ep-tpl-vars-modal-overlay';
            varsModal.className = 'ep-prompt-overlay';
            varsModal.style.zIndex = '2147483647';
            varsModal.innerHTML = `
                <div class="ep-tpl-vars-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:14px; font-weight:700; color:var(--text_primary);">치환자 설정</div>
                        <button id="ep-tpl-vars-cancel-btn" style="background:transparent; border:none; color:#888; cursor:pointer; padding:4px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                    </div>
                    <div class="ep-tpl-vars-row">
                        <div class="ep-tpl-vars-col">
                            <label class="ep-tpl-vars-label">Ⓤ</label>
                            <input type="text" class="ep-tpl-vars-input" id="ep-tpl-var-user-input" placeholder="유저 캐릭터명">
                        </div>
                        <div class="ep-tpl-vars-col">
                            <label class="ep-tpl-vars-label">Ⓒ</label>
                            <input type="text" class="ep-tpl-vars-input" id="ep-tpl-var-char-input" placeholder="상대 캐릭터명">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(varsModal);

            // 7. 단축어 팝업을 body에 직접 독립 추가 (잘림 원천 방지)
            const shPopup = document.createElement('div');
            shPopup.id = 'ep-shortcut-select-popup';
            shPopup.innerHTML = `
                <div style="font-weight:bold; line-height: 1; margin-bottom:0 !important; font-size:12px; border-bottom:1px solid rgba(128,128,128,0.15); padding-bottom:8px; color: var(--text_primary);">단축어 선택</div>
                <div id="ep-shortcut-select-list"></div>
            `;
            document.body.appendChild(shPopup);

            // 8. 템플릿 퀵패널을 body에 직접 독립 추가 (잘림 원천 방지)
            const tplPanel = document.createElement('div');
            tplPanel.id = 'ep-tpl-quick-panel';
            tplPanel.className = 'ep-tpl-quick-panel';
            tplPanel.innerHTML = `
                <div class="ep-tpl-quick-header">
                    <span class="ep-tpl-quick-title">템플릿</span>
                </div>
                <div class="ep-tpl-quick-folders" id="ep-tpl-quick-folder-bar"></div>
                <div class="ep-tpl-quick-grid" id="ep-tpl-quick-grid"></div>
                <div class="ep-tpl-quick-search-row">
                    <button type="button" class="ep-tpl-quick-btn-vars" id="ep-tpl-quick-btn-vars" title="치환자 설정">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m14.305 16.53.923-.382"/><path d="m15.228 13.852-.923-.383"/><path d="m16.852 12.228-.383-.923"/><path d="m16.852 17.772-.383.924"/><path d="m19.148 12.228.383-.923"/><path d="m19.53 18.696-.382-.924"/><path d="m20.772 13.852.924-.383"/><path d="m20.772 16.148.924.383"/><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/></svg>
                    </button>
                    <div class="ep-search-wrapper">
                        <input type="text" class="ep-search" id="ep-tpl-quick-search-input" placeholder="템플릿 제목 또는 내용 검색..." style="height:36px;">
                        <button type="button" class="ep-search-clear-btn" id="ep-tpl-quick-search-clear-btn" title="검색어 지우기"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/><path d="m5.082 11.09 8.828 8.828"/></svg></button>
                    </div>
                </div>
            `;
            document.body.appendChild(tplPanel);

            // 9. 로어 저장소 5대 탭 메인 모달창 (crack.html 순정 100% 완전 일치)
            const loreModal = document.createElement('div');
            loreModal.id = 'ep-lore-storage-modal-overlay';
            loreModal.className = 'decentral-modal-container decentral-color-container';
            loreModal.style.display = 'none';
            loreModal.innerHTML = `
                <div class="decentral-modal">
                    <div class="decentral-modal-title-container top-static-title">
                        <p class="decental-modal-title-text">로어 저장소</p>
                        <div class="decentral-modal-button-container">
                            <button class="decentral-close-button" id="ep-lore-close-btn"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                        </div>
                    </div>
                    <div class="decentral-menu-container" style="justify-content: space-between !important; padding-right: 12px !important;">
                        <div style="display:flex; gap:17px; align-items: flex-end;">
                            <button class="decentral-menu-element" id="ep-lore-tab-active" active="true">활성 로어</button>
                            <button class="decentral-menu-element" id="ep-lore-tab-log">실행 로그</button>
                            <button class="decentral-menu-element" id="ep-lore-tab-manage">로어 관리</button>
                            <button class="decentral-menu-element" id="ep-lore-tab-restore">로어 복원</button>
                            <button class="decentral-menu-element" id="ep-lore-tab-settings">설정</button>
                        </div>
                    </div>
                    <div class="decentral-grid-container">
                        <!-- 탭 1: 활성 로어 -->
                        <div class="decentral-grid ep-lore-panel active-panel" id="ep-lore-panel-active" style="padding-top: 10px;">
                            <div style="grid-column: 1 / 3; text-align: center; padding: 30px; font-size: 13px; color: #999;">활성화된 지식이 존재하지 않습니다.</div>
                        </div>

                        <!-- 탭 2: 실행 로그 -->
                        <div class="decentral-grid ep-lore-panel" id="ep-lore-panel-log" style="padding-top: 10px; flex-direction: column !important; height: 100% !important; min-height: 0; gap: 12px; box-sizing: border-box;">
                            <div class="decentral-grid-element-long-semi-flat" style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch; flex: 1; min-height: 0;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 8px 0;">주입 기록</p>
                                    <div id="ep-lore-modal-inject-log-container" style="flex: 1; min-height: 0; overflow-y: auto; font-size: 12px; display: flex; flex-direction: column; gap: 8px; width: 100%;"></div>
                                </div>
                            </div>
                            <div class="decentral-grid-element-long-semi-flat" style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch; flex: 1; min-height: 0;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 8px 0;">추출 기록</p>
                                    <div id="ep-lore-modal-extract-log-container" style="flex: 1; min-height: 0; overflow-y: auto; font-size: 12px; display: flex; flex-direction: column; gap: 8px; width: 100%;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 탭 3: 로어 관리 -->
                        <div class="decentral-grid ep-lore-panel" id="ep-lore-panel-manage">
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 12px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">로어 병합</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">대화방 내의 유사 로어들을 병합 정리합니다.</p>
                                    <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                                        <div style="flex: 1; display: flex; flex-direction: column;">
                                            <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">최대 글자수</span>
                                            <input type="number" id="ep-lore-merge-maxchars" class="decentral-text-field" value="1200" min="200" max="3000" step="50">
                                        </div>
                                        <div style="flex: 1; display: flex; flex-direction: column;">
                                            <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">병합 방식</span>
                                            <select id="ep-lore-merge-bulk-mode" class="decentral-select">
                                                <option value="keep-longest">가장 긴 항목 보존 (안전)</option>
                                                <option value="llm-summarize" selected>LLM 인공지능 요약 병합</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div id="ep-lore-checklist-container" style="display: none; width: 100%;"></div>
                                </div>
                            </div>
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 12px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">로어로 변환 (텍스트 → 로어)</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">별도의 텍스트를 로어 데이터로 가공합니다.</p>
                                    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                                        <textarea id="ep-lore-text-textarea" class="decentral-text-area" placeholder="로어로 변환할 텍스트를 기입하십시오." style="height: 120px;"></textarea>
                                        <button id="ep-lore-text-btn" class="decentral-button" style="background-color: #bcd0d7 !important; border: 1px solid #334a52; color: #334a52; font-weight: bold; height: 36px;">텍스트 지식 변환 실행</button>
                                        <div id="ep-lore-text-status" style="font-size: 11px; color: #888888; text-align: left; margin-top: 2px;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 12px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">수동 로어 생성</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">최근 대화 중 지정한 턴수만큼의 이력을 수동으로 분석하여 로어를 생성합니다.</p>
                                    <div style="display: flex; flex-direction: column; margin-bottom: 14px; width: 100%;">
                                        <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">추출할 최근 턴 수</span>
                                        <input type="number" id="ep-lore-manual-ext-turns" class="decentral-text-field" min="1" max="100" step="1">
                                    </div>
                                    <button id="ep-lore-manual-ext-btn" class="decentral-button" style="background-color: #bcd0d7 !important; border: 1px solid #334a52; color: #334a52; font-weight: bold; height: 36px;">지정 턴수만큼 수동 로어 생성</button>
                                    <div id="ep-lore-manual-ext-status" style="font-size: 11px; color: #888888; margin-top: 6px; text-align: center;"></div>
                                </div>
                            </div>
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 16px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">로어 재생성</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">대화 이력을 처음부터 재분석하여 모든 로어를 재구성합니다. 기존 로어는 초기화됩니다.</p>
                                    <button id="ep-lore-regenerate-btn" class="decentral-button" style="background-color: #bcd0d7 !important; border: 1px solid #334a52; color: #334a52; font-weight: bold; height: 36px;">초기화 및 전체 로어 재생성</button>
                                    <div id="ep-lore-regenerate-status" style="font-size: 11px; color: #888888; margin-top: 6px; text-align: center;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 탭 4: 로어 복원 -->
                        <div class="decentral-grid ep-lore-panel" id="ep-lore-panel-restore" style="padding-top: 10px; flex-direction: column !important; height: 100% !important; min-height: 0; gap: 12px; box-sizing: border-box;">
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 12px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">로어 복원</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">현재 로어들을 세이브 파일로 수동 백업하거나, 과거 시점으로 롤백합니다.</p>
                                    <button id="ep-lore-btn-create-snapshot" class="decentral-button" style="background-color: #bcd0d7 !important; border: 1px solid #334a52; color: #334a52; font-weight: bold; height: 36px;">현재 로어 백업</button>
                                    <div id="ep-lore-snapshot-status" style="font-size: 11px; color: #888888; margin-top: 6px; text-align: center;"></div>
                                </div>
                            </div>
                            <div class="decentral-grid-element-long-semi-flat" style="display: flex; flex-direction: column; background-color: var(--decentral-switch-background); border: 1px solid var(--decentral-text-border); border-radius: 8px; padding: 16px; flex: 1; min-height: 0; margin-bottom: 12px;">
                                <div style="font-size:13px; color:#74a1c0; font-weight:bold; margin-bottom:8px; border-bottom:1px solid var(--decentral-border); padding-bottom:6px; text-align:left;">백업 세이브 포인트</div>
                                <div id="ep-lore-snapshot-list-container" style="flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; width: 100%;"></div>
                            </div>
                        </div>

                        <!-- 탭 5: 설정 -->
                        <div class="decentral-grid ep-lore-panel" id="ep-lore-panel-settings">
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 12px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">로어 생성 설정</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">대화 중 로어를 자동으로 추출할 주기 및 추가 세부 지시사항을 설정합니다.</p>
                                    <div style="display: flex; flex-direction: column; margin-bottom: 14px; width: 100%;">
                                        <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">자동 생성 주기 (턴)</span>
                                        <input type="number" id="ep-lore-auto-ext-turns" class="decentral-text-field" value="6" min="1" max="50" step="1">
                                    </div>
                                    <div style="display: flex; flex-direction: column; width: 100%;">
                                        <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">로어 추출시 추가 지시사항</span>
                                        <textarea id="ep-lore-auto-ext-instruction" class="decentral-text-area" style="height: 150px; font-size: 12px; line-height: 1.5;" placeholder="추가 지시사항은 입력하지 않으면 전송되지 않습니다."></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="decentral-grid-element-long-semi-flat" style="margin-bottom: 12px;">
                                <div class="decentral-boxed-field" style="padding: 16px !important; display: flex; flex-direction: column; align-items: stretch;">
                                    <p class="element-title" style="color: #74a1c0 !important; font-size: 15px !important; margin: 0 0 4px 0;">임베딩 API 설정</p>
                                    <p class="element-description" style="margin: 0 0 12px 0;">임베딩을 위한 Google API 설정을 지정해 주십시오.</p>
                                    <div style="display: flex; flex-direction: column; margin-bottom: 12px; width: 100%;">
                                        <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">Gemini API key</span>
                                        <textarea id="ep-lore-embed-key-input" class="decentral-text-field" placeholder="AIzaSy..." style="height: 32px; overflow: hidden; white-space: nowrap;"></textarea>
                                    </div>
                                    <div style="display: flex; flex-direction: column; width: 100%;">
                                        <span style="font-size: 12px; margin-bottom: 4px; font-weight: bold;">embedding 모델 선택</span>
                                        <select id="ep-lore-embed-model-select" class="decentral-select">
                                            <option value="gemini-embedding-001">gemini-embedding-001</option>
                                            <option value="gemini-embedding-2-preview">gemini-embedding-2-preview</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(loreModal);

            bindDrawerEvents();
        }

        injectHeaderButton();
        injectCustomInputBox();
    }

    // 헤더 버튼 정밀 탐색 및 주입 함수
    function injectHeaderButton() {
        let menuBtn = document.getElementById('ep-native-menu-btn');
        if (!menuBtn) {
            menuBtn = document.createElement('button');
            menuBtn.id = 'ep-native-menu-btn';
            menuBtn.type = 'button';
            menuBtn.title = 'PASTELchat 메뉴 열기';
            menuBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"></path>
                </svg>
            `;
            // 버튼 클릭 이벤트 직접 연결 (슬라이딩 애니메이션 클래스 연동)
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                const drawer = document.getElementById('ep-chat-right-drawer');
                const overlay = document.getElementById('ep-chat-drawer-overlay');
                if (drawer && overlay) {
                    const isOpen = drawer.classList.contains('open');
                    if (!isOpen) {
                        const subHeader = document.querySelector('.absolute.z-docked.left-0.w-full.h-12') || document.querySelector('.h-12.px-5.flex.justify-between');
                        const topOffset = subHeader ? subHeader.getBoundingClientRect().bottom : 104;
                        drawer.style.top = `${topOffset}px`;
                        overlay.style.top = `${topOffset}px`;
                        drawer.classList.add('open');
                        overlay.classList.add('open');
                    } else {
                        drawer.classList.remove('open');
                        overlay.classList.remove('open');
                    }
                }
            };
        }

        // 헤더 안의 순정 메뉴 버튼 컨테이너 탐색 (여러 패턴으로 확실하게 탐색)
        const subHeader = document.querySelector('.absolute.z-docked.left-0.w-full.h-12') || document.querySelector('.h-12.px-5.flex.justify-between');
        if (subHeader) {
            const btnGroup = subHeader.querySelector('.flex.gap-3.items-center') || subHeader.lastElementChild;
            if (btnGroup && !btnGroup.contains(menuBtn)) {
                btnGroup.appendChild(menuBtn);
            }
        }
    }

    /* ==========================================================================
     * 6. 하단 파스텔 입력창 & 구슬 툴바 주입 및 인터랙션 로직 (crack.html 순정)
     * ========================================================================== */
    const HOLD_MS = 600;
    let isSendConfirmed = false;
    let sendHoldTimer = null;

    // [오리지널 순정 _CrackCookieApi] 쿠키에서 access_token 직접 추출
    function getCrackAuthToken() {
        const cookieMatch = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
        if (cookieMatch && cookieMatch[1]) {
            return decodeURIComponent(cookieMatch[1]);
        }

        // 스토리지 보조 탐색
        try {
            const raw = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || '';
            if (raw) return raw.replace(/^["']|["']$/g, '').trim();
            const auth = localStorage.getItem('auth-storage');
            if (auth) {
                const p = JSON.parse(auth);
                const t = p?.state?.accessToken || p?.state?.token || p?.accessToken;
                if (t) return String(t).replace(/^["']|["']$/g, '').trim();
            }
        } catch (_) {}
        return '';
    }

    // [오리지널 순정 _CrackPathApi] /characters/.../chats/<chatRoomId> 정밀 추출
    function getChatId() {
        const path = location.pathname || '';
        const split = path.substring(1).split('/');

        // 1. /characters/<charId>/chats/<chatRoomId>
        // 2. /stories/<storyId>/episodes/<chatRoomId>
        // 3. /u/<userId>/c/<chatRoomId>
        if (split.length >= 4 && (split[0] === 'characters' || split[0] === 'stories' || split[0] === 'u')) {
            const chatRoomId = split[3];
            if (chatRoomId && chatRoomId !== 'chats' && chatRoomId !== 'episodes' && chatRoomId !== 'c') {
                return chatRoomId;
            }
        }

        // 4. /chats/<chatRoomId>
        if (split.length >= 2 && (split[0] === 'chats' || split[0] === 'chat')) {
            if (split[1]) return split[1];
        }

        // 5. 24자리 ObjectId 정규식
        const hexMatch = path.match(/([a-f0-9]{24})/i);
        if (hexMatch && hexMatch[1]) return hexMatch[1];

        return 'global';
    }

    // [오리지널 순정 contents-api 커서 기반 300턴 전수 수급 엔진]
    async function fetchCrackMessagesPure(targetChatId, maxCount = 300) {
        const chatId = targetChatId || getChatId();
        if (!chatId || chatId === 'global') return [];

        const token = getCrackAuthToken();
        const headers = { 'accept': 'application/json, text/plain, */*' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let loadedMessages = [];
        let cursor = undefined;

        // [1계층]: 오리지널 contents-api.wrtn.ai 커서 반복 순회 (1턴부터 최대 maxCount까지 완벽 수급)
        try {
            while (maxCount === -1 || loadedMessages.length < maxCount) {
                const itemPerPage = Math.min(20, (maxCount === -1 ? 20 : maxCount - loadedMessages.length));
                const nextUrl = cursor === undefined
                    ? `https://contents-api.wrtn.ai/character-chat/v3/chats/${chatId}/messages?limit=${itemPerPage}`
                    : `https://contents-api.wrtn.ai/character-chat/v3/chats/${chatId}/messages?limit=${itemPerPage}&cursor=${encodeURIComponent(cursor)}`;

                const res = await fetch(nextUrl, { method: 'GET', headers: headers, credentials: 'include' });
                if (!res.ok) break;

                const result = await res.json();
                const messages = result?.data?.messages || result?.messages || [];
                if (!Array.isArray(messages) || messages.length === 0) break;

                for (const msg of messages) {
                    const rawContent = msg.content || msg.message || msg.text || '';
                    if (!rawContent || rawContent.length === 0) continue;
                    loadedMessages.push(msg);
                    if (maxCount !== -1 && loadedMessages.length >= maxCount) break;
                }

                if (result?.data?.nextCursor) {
                    cursor = result.data.nextCursor;
                } else {
                    break;
                }
            }
        } catch (err) {
            console.warn("[contents-api 수급 예외]:", err);
        }

        // [2계층 폴백]: crack-api 단일 호출
        if (loadedMessages.length === 0) {
            try {
                const res2 = await fetch(`https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages?limit=${maxCount}`, {
                    method: 'GET', headers: headers, credentials: 'include'
                });
                if (res2.ok) {
                    const p2 = await res2.json();
                    const arr = p2?.data?.messages || p2?.data || p2?.messages || [];
                    if (Array.isArray(arr) && arr.length > 0) loadedMessages = arr;
                }
            } catch (_) {}
        }

        // API 수급 성공: 과거 1턴부터 순서대로 reverse() 정렬 및 [crack.html 순정] 유저 턴수 카운팅
        if (loadedMessages.length > 0) {
            loadedMessages.reverse();
            // [crack.html 순정 100%] 백엔드 대화 배열 중 유저 메시지(role === 'user')의 개수로 실시간 턴수 산출
            const userTurns = loadedMessages.filter(m => (m.role === 'user' || m.type === 'user')).length;
            localStorage.setItem(`pastel_crack_chat_turns_${chatId}`, String(userTurns));

            console.log(`📥 [PASTEL:수급] contents-api에서 총 ${loadedMessages.length}개 메시지 수급 완료! (현재 ${userTurns}턴)`);
            return loadedMessages;
        }

        // [3계층 폴백]: 화면 DOM 파서
        console.warn("⚠️ [PASTEL:수급] API 수급 불가로 화면 DOM 파서를 가동합니다.");
        const domTurns = [];
        const allNodes = document.querySelectorAll('p, .whitespace-pre-wrap, .break-words, .prose');
        allNodes.forEach(el => {
            if (el.closest('#ep-chat-right-drawer') || el.closest('#ep-lore-storage-modal-overlay') || el.closest('.ep-prompt-overlay') || el.closest('.chat-footer-control') || el.closest('.ProseMirror')) return;
            let txt = (el.getAttribute('data-pastel-raw') || el.innerText || el.textContent || '').trim();
            let clean = stripLoreInjectionBlock(txt).trim();
            if (clean.length > 0) {
                const isUser = !!el.closest('.justify-end, [class*="items-end"], .bg-accent_translucent') || el.classList.contains('bg-accent_translucent');
                domTurns.push({ role: isUser ? 'user' : 'assistant', content: clean, message: clean, text: clean });
            }
        });
        if (document.querySelector('.flex-col-reverse')) domTurns.reverse();

        const domUserTurns = domTurns.filter(m => m.role === 'user').length;
        if (domUserTurns > 0) {
            localStorage.setItem(`pastel_crack_chat_turns_${chatId}`, String(domUserTurns));
        }

        console.log(`📥 [PASTEL:수급] DOM 파서에서 ${domTurns.length}개 메시지 수급 완료! (현재 ${domUserTurns}턴)`);
        return domTurns;
    }

    // [crack.html 순정 100%] 실시간 유저 턴수 계산기
    function getCrackChatTurns(chatId) {
        const targetId = chatId || getChatId();
        const saved = parseInt(localStorage.getItem(`pastel_crack_chat_turns_${targetId}`) || '0', 10);
        if (saved > 0) return saved;

        // DOM에서 유저 말풍선 카운팅 폴백
        const domUserCount = document.querySelectorAll('.justify-end, [class*="items-end"], .bg-accent_translucent').length;
        return domUserCount || 0;
    }

    function injectCustomInputBox() {
        // 크랙의 하단 입력 영역 컨테이너 안전 탐색
        const crackInputWrapper = document.querySelector('.bg-bg_screen.pointer-events-auto') || 
                                 document.querySelector('.pointer-events-auto') ||
                                 document.querySelector('.max-w-\\[768px\\].py-4');
        if (!crackInputWrapper) return;

        if (document.getElementById('ep-chat-input-textarea')) return;

        const footerControl = document.createElement('div');
        footerControl.className = 'chat-footer-control';
        footerControl.innerHTML = `
            <div class="input-area">
                <textarea class="chat-textarea" id="ep-chat-input-textarea" placeholder="메시지를 입력하세요..."></textarea>
                <div class="input-toolbar">
                    <!-- 단축어 / 템플릿 버튼 (모듈 3에서 퀵패널 연동) -->
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="tool-btn" id="ep-chat-shortcut-popup-btn" type="button" title="단축어 선택"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
                        <button class="tool-btn" id="ep-chat-tpl-popup-btn" type="button" title="페더 템플릿"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.086 18.412A2 2 0 0 1 12.67 19H5v-7.672a2 2 0 0 1 .586-1.414L11.75 3.75a6 6 0 1 1 8.49 8.49z"/><path d="M16 8 2 22"/><path d="M17.488 15H9"/></svg></button>
                    </div>
                    <span class="vertical-divider"></span>
                    <!-- 순정 구슬 단축 버튼 9종 -->
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="tool-btn ep-symbol-btn" data-open="*" type="button" title="행동 지문"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M12 6v12"/><path d="M17.196 9 6.804 15"/><path d="m6.804 9 10.392 6"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open='"' type="button" title="쌍따옴표 대사"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:15px;height:15px;fill:#888888;"><path d="M96 280C96 213.7 149.7 160 216 160L224 160C241.7 160 256 174.3 256 192C256 209.7 241.7 224 224 224L216 224C185.1 224 160 249.1 160 280L160 288L224 288C259.3 288 288 316.7 288 352L288 416C288 451.3 259.3 480 224 480L160 480C124.7 480 96 451.3 96 416L96 280zM352 280C352 213.7 405.7 160 472 160L480 160C497.7 160 512 174.3 512 192C512 209.7 497.7 224 480 224L472 224C441.1 224 416 249.1 416 280L416 288L480 288C515.3 288 544 316.7 544 352L544 416C544 451.3 515.3 480 480 480L416 480C380.7 480 352 451.3 352 416L352 280z"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="'" type="button" title="홑따옴표 독백"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:15px;height:15px;fill:#888888;"><path d="M352 160C369.7 160 384 174.3 384 192C384 209.7 369.7 224 352 224L344 224C313.1 224 288 249.1 288 280L288 288L352 288C387.3 288 416 316.7 416 352L416 416C416 451.3 387.3 480 352 480L288 480C252.7 480 224 451.3 224 416L224 280C224 213.7 277.7 160 344 160L352 160z"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="…" type="button" title="말줄임표"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="—" type="button" title="엠대쉬"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M5 12h14"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="&#96;" type="button" title="백틱"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="(" data-close=")" type="button" title="괄호"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="[" data-close="]" type="button" title="대괄호"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3"/><path d="M8 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3"/></svg></button>
                        <button class="tool-btn ep-symbol-btn" data-open="(OOC：" data-close=")" type="button" title="OOC"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg></button>
                        <button class="tool-btn" id="ep-cmd-symbol-btn" data-open="/*" data-close="*/" type="button" title="커스텀 기호 설정" style="color: #888;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: block;"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg></button>
                    </div>

                    <!-- 순정 전송 버튼을 담아둘 우측 슬롯 -->
                    <div id="ep-native-send-slot" style="margin-left: auto; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;"></div>
                </div>
            </div>
        `;
        crackInputWrapper.appendChild(footerControl);

        moveNativeSendButtonToSlot();
        bindInputEvents();
    }

    // 크랙 순정 전송 버튼을 파스텔 툴바 슬롯으로 이동 및 잔여 컨테이너 완벽 숨김
    function moveNativeSendButtonToSlot() {
        const slot = document.getElementById('ep-native-send-slot');
        if (!slot) return;

        const pathList = document.querySelectorAll('svg path');
        for (const p of pathList) {
            const d = p.getAttribute('d') || '';
            if (d.startsWith('M18.77 11.13')) {
                const nativeBtn = p.closest('button');
                if (nativeBtn && !slot.contains(nativeBtn)) {
                    nativeBtn.style.position = 'relative';
                    nativeBtn.style.zIndex = '10';
                    nativeBtn.style.cursor = 'pointer';
                    nativeBtn.style.margin = '0';
                    nativeBtn.style.transform = 'none';
                    slot.appendChild(nativeBtn);
                    break;
                }
            }
        }
    }

    function insertSymbolsToTextarea(openSymbol, closeSymbol) {
        const textarea = document.getElementById('ep-chat-input-textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const after = text.substring(end);

        let newText;
        let newCursorPos;

        if (closeSymbol) {
            newText = before + openSymbol + closeSymbol + after;
            newCursorPos = start + openSymbol.length;
        } else {
            newText = before + openSymbol + after;
            newCursorPos = start + openSymbol.length;
        }

        textarea.value = newText;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function showProgressRing(ringEl, svgEl, trackEl, fillEl, targetBtn) {
        const rect = targetBtn.getBoundingClientRect();
        const offset = 4;
        const halfOffset = offset / 2;

        const size = Math.max(rect.width, rect.height) + offset;
        const cx = size / 2;
        const cy = size / 2;
        const r = (size / 2) - 2;
        const circumference = 2 * Math.PI * r;

        svgEl.setAttribute('width', size);
        svgEl.setAttribute('height', size);
        svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);
        
        trackEl.setAttribute('cx', cx);
        trackEl.setAttribute('cy', cy);
        trackEl.setAttribute('r', r);
        
        fillEl.setAttribute('cx', cx);
        fillEl.setAttribute('cy', cy);
        fillEl.setAttribute('r', r);
        
        fillEl.style.strokeDasharray = circumference;
        fillEl.style.strokeDashoffset = circumference;

        ringEl.style.left = `${rect.left - halfOffset}px`;
        ringEl.style.top = `${rect.top - halfOffset}px`;
        ringEl.classList.add('active');

        requestAnimationFrame(() => {
            fillEl.style.transition = `stroke-dashoffset ${HOLD_MS}ms linear`;
            fillEl.style.strokeDashoffset = '0';
        });
    }

    function hideProgressRing(ringEl, fillEl) {
        if (!ringEl || !fillEl) return;
        ringEl.classList.remove('active');
        fillEl.style.transition = 'none';
        if (fillEl.style.strokeDasharray) {
            fillEl.style.strokeDashoffset = fillEl.style.strokeDasharray;
        }
    }

    function cancelSendHold() {
        if (!sendHoldTimer) return;
        clearTimeout(sendHoldTimer);
        sendHoldTimer = null;
        const sendRing = document.getElementById('sh-progress-ring');
        const sendFill = sendRing?.querySelector('circle.fill');
        hideProgressRing(sendRing, sendFill);
    }

    function startSendHold(e) {
        if (e.type === 'touchstart') e.preventDefault();
        cancelSendHold();
        const sendRing = document.getElementById('sh-progress-ring');
        const sendSvg = document.getElementById('sh-svg');
        const sendTrack = sendRing?.querySelector('circle.track');
        const sendFill = sendRing?.querySelector('circle.fill');
        const safeSendBtnEl = document.getElementById('ep-chat-send-btn');
        if (!sendRing || !sendSvg || !sendTrack || !sendFill || !safeSendBtnEl) return;

        showProgressRing(sendRing, sendSvg, sendTrack, sendFill, safeSendBtnEl);
        sendHoldTimer = setTimeout(() => {
            hideProgressRing(sendRing, sendFill);
            isSendConfirmed = true;
            safeSendBtnEl.click();
            sendHoldTimer = null;
        }, HOLD_MS);
    }

    function updateSendButtonColor() {
        const chatInputTextareaEl = document.getElementById('ep-chat-input-textarea');
        const sendBtnEl = document.getElementById('ep-chat-send-btn');
        if (!chatInputTextareaEl || !sendBtnEl) return;
        const hasText = chatInputTextareaEl.value.trim().length > 0;
        sendBtnEl.style.backgroundColor = hasText ? '#F5E19A' : '#eee';
    }

    function getCustomCommentConfig(chatId) {
        const targetId = chatId || getChatId();
        const openVal = localStorage.getItem(`pastel_crack_custom_comment_open_ep_${targetId}`);
        const closeVal = localStorage.getItem(`pastel_crack_custom_comment_close_ep_${targetId}`);
        const isSetVal = localStorage.getItem(`pastel_crack_custom_comment_is_set_ep_${targetId}`);

        if (!openVal && !closeVal && isSetVal === null) {
            return { open: '/*', close: '*/', isSet: true };
        }
        return {
            open: openVal !== null ? openVal : '/*',
            close: closeVal !== null ? closeVal : '*/',
            isSet: isSetVal !== 'false'
        };
    }

    function updateCustomCommentSymbolButton(chatId) {
        const config = getCustomCommentConfig(chatId);
        const btn = document.getElementById('ep-cmd-symbol-btn');
        if (btn) {
            btn.setAttribute('data-open', config.open);
            btn.setAttribute('data-close', config.isSet ? config.close : '');
        }
    }

    function autoSaveCustomCommentConfig() {
        const openInput = document.getElementById('ep-cmd-open-input');
        const closeInput = document.getElementById('ep-cmd-close-input');
        const toggleSet = document.getElementById('ep-cmd-toggle-set');
        if (!openInput || !closeInput || !toggleSet) return;

        let openVal = openInput.value;
        let closeVal = closeInput.value;
        const isSet = toggleSet.checked;

        if (!openVal.trim() && (!isSet || !closeVal.trim())) {
            openVal = '/*';
            closeVal = '*/';
        }

        const targetId = getChatId();
        localStorage.setItem(`pastel_crack_custom_comment_open_ep_${targetId}`, openVal);
        localStorage.setItem(`pastel_crack_custom_comment_close_ep_${targetId}`, closeVal);
        localStorage.setItem(`pastel_crack_custom_comment_is_set_ep_${targetId}`, String(isSet));

        updateCustomCommentSymbolButton(targetId);
    }

    function openCustomCommentModal() {
        const config = getCustomCommentConfig(getChatId());
        const modal = document.getElementById('ep-comment-custom-modal-overlay');
        const openInput = document.getElementById('ep-cmd-open-input');
        const closeInput = document.getElementById('ep-cmd-close-input');
        const toggleSet = document.getElementById('ep-cmd-toggle-set');
        const closeGroup = document.getElementById('ep-cmd-close-group');

        if (!modal || !openInput || !closeInput || !toggleSet) return;

        openInput.value = config.open;
        closeInput.value = config.close;
        toggleSet.checked = config.isSet;
        closeGroup.style.display = config.isSet ? 'flex' : 'none';

        modal.classList.add('visible');
    }

    // 파스텔 텍스트를 크랙 순정 에디터에 주입하고 전송 트리거
    function executeSendMessage() {
        const textarea = document.getElementById('ep-chat-input-textarea');
        if (!textarea) return;
        const rawText = textarea.value.trim();
        if (!rawText) return;

        // 크랙의 원래 ProseMirror 에디터 탐색
        const editor = document.querySelector('.ProseMirror') || document.querySelector('[contenteditable="true"]');
        if (editor) {
            editor.focus();
            
            // ProseMirror 단락 구조에 맞게 줄바꿈을 p 태그들로 변환 주입
            const paragraphs = rawText.split('\n').map(line => `<p>${line || '<br>'}</p>`).join('');
            editor.innerHTML = paragraphs;
            
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            editor.dispatchEvent(new Event('change', { bubbles: true }));

            // 제공해주신 전송 아이콘(path d="M18.77 11.13...")을 가진 순정 전송 버튼을 1:1로 정밀 탐색
            setTimeout(() => {
                let nativeSendBtn = null;
                const pathList = document.querySelectorAll('svg path');
                for (const p of pathList) {
                    const d = p.getAttribute('d') || '';
                    if (d.startsWith('M18.77 11.13')) {
                        const candidateBtn = p.closest('button');
                        // 파스텔 자체 전송 버튼이 아닌 크랙의 원래 순정 전송 버튼인지 확인
                        if (candidateBtn && candidateBtn.id !== 'ep-chat-send-btn') {
                            nativeSendBtn = candidateBtn;
                            break;
                        }
                    }
                }

                if (nativeSendBtn) {
                    nativeSendBtn.removeAttribute('disabled');
                    nativeSendBtn.click();
                    textarea.value = '';
                    updateSendButtonColor();
                } else {
                    showToast("❌ 순정 전송 버튼 탐색 실패");
                }
            }, 50);
        } else {
            showToast("❌ 에디터 탐색 실패");
        }
    }

    // (중복 무한 루프 방지를 위해 syncTextToNativeEditor를 전송 버튼 클릭 핸들러로 완전 단일화)

    /* ==========================================================================
     * 7. 단축어, 템플릿 퀵패널 및 치환자 계산 엔진 (crack.html 순정 100%)
     * ========================================================================== */
    const EP_CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    function getChosungString(str) {
        let result = "";
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code >= 0xAC00 && code <= 0xD7A3) result += EP_CHOSUNG_LIST[Math.floor((code - 0xAC00) / 588)];
            else result += str[i];
        }
        return result;
    }
    function isChosungOnly(query) {
        return query.split('').every(ch => EP_CHOSUNG_LIST.includes(ch) || ch === ' ');
    }
    function matchesTemplateSearch(tpl, query) {
        if (!query) return true;
        const q = query.trim().toLowerCase();
        const titleLower = (tpl.title || "").toLowerCase();
        const textLower = (tpl.text || "").toLowerCase();
        if (isChosungOnly(q) && getChosungString(titleLower).includes(q)) return true;
        return titleLower.includes(q) || textLower.includes(q);
    }

    function hasKoreanJongseong(char) {
        if (!char) return false;
        const code = char.charCodeAt(0);
        return (code >= 0xAC00 && code <= 0xD7A3) ? (code - 0xAC00) % 28 > 0 : false;
    }
    function getAutoKoreanJosa(name, josa) {
        if (!name) return josa;
        const hasBatchim = hasKoreanJongseong(name[name.length - 1]);
        if (josa === '으로' || josa === '로') {
            const jongIndex = (name.charCodeAt(name.length - 1) - 0xAC00) % 28;
            return (jongIndex === 0 || jongIndex === 8) ? '로' : '으로';
        }
        const josaMap = { '이': hasBatchim ? '이' : '가', '가': hasBatchim ? '이' : '가', '은': hasBatchim ? '은' : '는', '는': hasBatchim ? '은' : '는', '을': hasBatchim ? '을' : '를', '를': hasBatchim ? '을' : '를', '과': hasBatchim ? '과' : '와', '와': hasBatchim ? '과' : '와', '아': hasBatchim ? '아' : '야', '야': hasBatchim ? '아' : '야' };
        return josaMap[josa] || josa;
    }

    function transformTemplatePlaceholders(text) {
        if (!text) return "";
        const raw = localStorage.getItem(`pastel_crack_feather_vars_ep_${getChatId()}`);
        const vars = raw ? JSON.parse(raw) : { user: '', char: '' };
        let result = text;
        result = result.replace(/([ⓊⒸⓤⓒ])(이\(가\)|은\(는\)|을\(를\)|과\(와\)|으로\(로\)|[이가은는을를과와아야]|으로|로)/g, (m, sym, josaRaw) => {
            const isUser = (sym === 'Ⓤ' || sym === 'ⓤ');
            const name = isUser ? vars.user : vars.char;
            if (!name) return m;
            let baseJosa = josaRaw.replace(/\(.*?\)/g, '');
            return name + getAutoKoreanJosa(name, baseJosa);
        });
        result = result.replace(/[Ⓤⓤ]/g, vars.user || 'Ⓤ').replace(/[Ⓒⓒ]/g, vars.char || 'Ⓒ');
        return result;
    }

    let activeQuickTplFolder = '전체';
    function renderQuickTemplates() {
        const grid = document.getElementById('ep-tpl-quick-grid');
        const searchInp = document.getElementById('ep-tpl-quick-search-input');
        if (!grid) return;
        grid.innerHTML = '';
        const query = searchInp ? searchInp.value.trim() : '';

        const tpls = GM_getValue('pastel_mockTemplates', null) || JSON.parse(localStorage.getItem('pastel_mockTemplates') || '[]');
        const filtered = tpls.filter(tpl => {
            const matchesFolder = (activeQuickTplFolder === '전체' || tpl.folder === activeQuickTplFolder);
            return matchesFolder && matchesTemplateSearch(tpl, query);
        });

        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko-KR'));

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/3; text-align:center; padding:20px; font-size:12px; color:#999;">일치하는 템플릿이 없습니다.</div>`;
            return;
        }

        filtered.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'ep-tpl-quick-card';
            card.innerHTML = `<div class="ep-tpl-quick-card-title">${tpl.title || '무제'}</div><div class="ep-tpl-quick-card-text">${tpl.text || ''}</div>`;
            card.onclick = (e) => {
                e.stopPropagation();
                const finalTxt = transformTemplatePlaceholders(tpl.text || '');
                const ta = document.getElementById('ep-chat-input-textarea');
                if (ta) {
                    const start = ta.selectionStart, end = ta.selectionEnd;
                    ta.value = ta.value.substring(0, start) + finalTxt + ta.value.substring(end);
                    ta.focus();
                    ta.setSelectionRange(start + finalTxt.length, start + finalTxt.length);
                }
                document.getElementById('ep-tpl-quick-panel').style.display = 'none';
                document.getElementById('ep-chat-tpl-popup-btn').classList.remove('active');
            };
            grid.appendChild(card);
        });
    }

    function rebuildQuickTemplateFolders() {
        const quickBar = document.getElementById('ep-tpl-quick-folder-bar');
        if (!quickBar) return;
        quickBar.innerHTML = '';
        const folders = GM_getValue('pastel_mockTemplateFolders', null) || JSON.parse(localStorage.getItem('pastel_mockTemplateFolders') || '["전체"]');
        folders.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `ep-ftab ${f === activeQuickTplFolder ? 'active' : ''}`;
            btn.textContent = f;
            btn.onclick = (e) => {
                e.stopPropagation();
                quickBar.querySelectorAll('.ep-ftab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                activeQuickTplFolder = f;
                renderQuickTemplates();
            };
            quickBar.appendChild(btn);
        });
    }

    function bindInputEvents() {
        const textarea = document.getElementById('ep-chat-input-textarea');
        const cmdBtn = document.getElementById('ep-cmd-symbol-btn');
        const cmdModal = document.getElementById('ep-comment-custom-modal-overlay');
        const toggleSet = document.getElementById('ep-cmd-toggle-set');
        const closeGroup = document.getElementById('ep-cmd-close-group');
        const cancelBtn = document.getElementById('ep-cmd-cancel-btn');

        const shBtn = document.getElementById('ep-chat-shortcut-popup-btn');
        const shPopup = document.getElementById('ep-shortcut-select-popup');
        const shList = document.getElementById('ep-shortcut-select-list');
        const tplBtn = document.getElementById('ep-chat-tpl-popup-btn');
        const tplPanel = document.getElementById('ep-tpl-quick-panel');

        if (textarea) {
            textarea.addEventListener('keydown', (e) => e.stopPropagation());
            textarea.addEventListener('keyup', (e) => e.stopPropagation());
        }

        // 1. 단축어 선택 팝업 바인딩
        if (shBtn && shPopup) {
            shBtn.onclick = (e) => {
                e.stopPropagation();
                const isShowing = shPopup.style.display === 'flex';
                if (!isShowing) {
                    if (tplPanel) tplPanel.style.display = 'none';
                    if (tplBtn) tplBtn.classList.remove('active');
                    const shortcuts = GM_getValue('pastel_mockShortcuts', null) || JSON.parse(localStorage.getItem('pastel_mockShortcuts') || '[]');
                    shList.innerHTML = shortcuts.length > 0 
                        ? shortcuts.map(sh => `<div class="ep-shortcut-popup-item" data-title="${sh.title}">!${sh.title}</div>`).join('')
                        : '<div style="font-size:11px; color:#888; text-align:center; padding:10px;">단축어 없음</div>';
                    
                    shList.querySelectorAll('.ep-shortcut-popup-item').forEach(item => {
                        item.onclick = (ev) => {
                            ev.stopPropagation();
                            insertSymbolsToTextarea(`!${item.dataset.title}`);
                            shPopup.style.display = 'none';
                            shBtn.classList.remove('active');
                        };
                    });
                    shPopup.style.display = 'flex';
                    shBtn.classList.add('active');
                } else {
                    shPopup.style.display = 'none';
                    shBtn.classList.remove('active');
                }
            };
        }

        // 2. 템플릿 퀵패널 바인딩
        if (tplBtn && tplPanel) {
            tplBtn.onclick = (e) => {
                e.stopPropagation();
                const isShowing = tplPanel.style.display === 'flex';
                if (!isShowing) {
                    if (shPopup) shPopup.style.display = 'none';
                    if (shBtn) shBtn.classList.remove('active');
                    rebuildQuickTemplateFolders();
                    renderQuickTemplates();
                    tplPanel.style.display = 'flex';
                    tplBtn.classList.add('active');
                } else {
                    tplPanel.style.display = 'none';
                    tplBtn.classList.remove('active');
                }
            };
        }

        // 템플릿 검색 및 지우개
        const tplSearchInp = document.getElementById('ep-tpl-quick-search-input');
        if (tplSearchInp) tplSearchInp.addEventListener('input', renderQuickTemplates);
        const tplClearBtn = document.getElementById('ep-tpl-quick-search-clear-btn');
        if (tplClearBtn && tplSearchInp) {
            tplClearBtn.onclick = (e) => {
                e.stopPropagation();
                tplSearchInp.value = '';
                renderQuickTemplates();
            };
        }

        // 치환자 모달 개폐
        const varsModal = document.getElementById('ep-tpl-vars-modal-overlay');
        const varsBtn = document.getElementById('ep-tpl-quick-btn-vars');
        const varsCancel = document.getElementById('ep-tpl-vars-cancel-btn');
        const varUserInp = document.getElementById('ep-tpl-var-user-input');
        const varCharInp = document.getElementById('ep-tpl-var-char-input');

        if (varsBtn && varsModal) {
            varsBtn.onclick = (e) => {
                e.stopPropagation();
                const raw = localStorage.getItem(`pastel_crack_feather_vars_ep_${getChatId()}`);
                const vars = raw ? JSON.parse(raw) : { user: '', char: '' };
                if (varUserInp) varUserInp.value = vars.user || '';
                if (varCharInp) varCharInp.value = vars.char || '';
                varsModal.classList.add('visible');
            };
        }
        if (varsCancel && varsModal) {
            varsCancel.onclick = () => {
                if (varUserInp && varCharInp) {
                    localStorage.setItem(`pastel_crack_feather_vars_ep_${getChatId()}`, JSON.stringify({
                        user: varUserInp.value.trim(),
                        char: varCharInp.value.trim()
                    }));
                }
                varsModal.classList.remove('visible');
            };
        }

        // 바깥 클릭 시 단축어/템플릿 팝업 닫기
        document.addEventListener('click', (e) => {
            if (shPopup && !shPopup.contains(e.target) && e.target !== shBtn) {
                shPopup.style.display = 'none';
                if (shBtn) shBtn.classList.remove('active');
            }
            if (tplPanel && !tplPanel.contains(e.target) && e.target !== tplBtn && (!varsModal || !varsModal.contains(e.target))) {
                tplPanel.style.display = 'none';
                if (tplBtn) tplBtn.classList.remove('active');
            }
        });

        // 9종 구슬 버튼 클릭 시 기호 삽입
        document.querySelectorAll('.ep-symbol-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                insertSymbolsToTextarea(btn.dataset.open, btn.dataset.close);
            };
        });

        // 커스텀 기호 버튼
        if (cmdBtn) {
            let pressTimer = null;
            let isLongPress = false;

            const startPress = () => {
                isLongPress = false;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    openCustomCommentModal();
                }, 800);
            };

            const cancelPress = () => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            };

            cmdBtn.addEventListener('touchstart', startPress, { passive: true });
            cmdBtn.addEventListener('touchend', cancelPress);
            cmdBtn.addEventListener('mousedown', startPress);
            cmdBtn.addEventListener('mouseup', cancelPress);
            cmdBtn.addEventListener('mouseleave', cancelPress);

            cmdBtn.onclick = (e) => {
                if (isLongPress) {
                    e.preventDefault();
                    e.stopPropagation();
                    isLongPress = false;
                    return;
                }
                const config = getCustomCommentConfig(getChatId());
                if (config.open) {
                    insertSymbolsToTextarea(config.open, config.isSet ? config.close : '');
                }
            };

            updateCustomCommentSymbolButton(getChatId());
        }

        // 커스텀 기호 모달 내부 컨트롤
        if (toggleSet && closeGroup) {
            toggleSet.onchange = () => {
                closeGroup.style.display = toggleSet.checked ? 'flex' : 'none';
            };
        }

        const closeCmdModal = () => {
            autoSaveCustomCommentConfig();
            if (cmdModal) cmdModal.classList.remove('visible');
        };

        if (cancelBtn) cancelBtn.onclick = closeCmdModal;
        if (cmdModal) {
            cmdModal.onclick = (e) => {
                if (e.target === cmdModal) closeCmdModal();
            };
        }

        // [비동기 완벽 보장] 전송 가로채기 -> 2000자 RAG 로어 조립 주입 -> 실제 크랙 전송 실행
        const slot = document.getElementById('ep-native-send-slot');
        let isInternalSending = false;

        if (slot) {
            slot.addEventListener('click', async (e) => {
                // 내부에서 RAG 주입 완료 후 진짜 보낼 때는 통과
                if (isInternalSending) return;

                // 1. 브라우저의 조급한 0초 즉시 전송을 강제로 가로채어 멈춤
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                const textarea = document.getElementById('ep-chat-input-textarea');
                if (!textarea) return;
                const rawInput = textarea.value.trim();
                if (!rawInput) return;

                // 2. [단축어 100% 최우선 확장] (!단축어 -> additional note)
                let userExpandedText = rawInput;
                const shortcuts = GM_getValue('pastel_mockShortcuts', null) || JSON.parse(localStorage.getItem('pastel_mockShortcuts') || '[]');
                if (Array.isArray(shortcuts)) {
                    shortcuts.forEach(sh => {
                        const token = `!${sh.title}`;
                        if (userExpandedText.includes(token)) {
                            userExpandedText += `\n\n---\n\`\`\`additional note: !${sh.title}\n${sh.text}\n\`\`\``;
                        }
                    });
                }

                // 3. [단축어 포함 전체 길이 기준 예산 산출]: 유저본문 + 단축어 공간을 먼저 100% 확보하고 남은 공간에만 로어 조립
                const chatId = getChatId();
                const loreBlock = await buildCrackRAGLoreBlock(userExpandedText, chatId);
                const finalPayloadMessage = loreBlock ? `${loreBlock}\n\n${userExpandedText}` : userExpandedText;

                // 4. [원문 긴급 비상 백업] (어떤 오류가 발생해도 글이 날아가지 않도록 즉시 로컬 백업)
                localStorage.setItem('pastel_last_sent_backup', rawInput);

                // 5. [ProseMirror 가상 클립보드 트랜잭션 주입]: 내부 State에 2,000자 완벽 안착 (빈 공백 전송 100% 차단)
                const editor = document.querySelector('.ProseMirror') || document.querySelector('[contenteditable="true"]');
                if (editor) {
                    editor.focus();

                    // 전체 선택
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(editor);
                    sel.removeAllRanges();
                    sel.addRange(range);

                    // 1순위: execCommand 가상 붙여넣기 (React/ProseMirror State가 100% 인식)
                    let success = false;
                    try {
                        success = document.execCommand('insertText', false, finalPayloadMessage);
                    } catch (_) {}

                    // 2순위: DataTransfer 클립보드 붙여넣기 시뮬레이션
                    if (!success || !editor.textContent.trim()) {
                        try {
                            const dt = new DataTransfer();
                            dt.setData('text/plain', finalPayloadMessage);
                            const pasteEvt = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
                            editor.dispatchEvent(pasteEvt);
                        } catch (_) {}
                    }

                    // 3순위: DOM 단락 주입 및 트랜잭션 InputEvent 발송
                    if (!editor.textContent.trim()) {
                        const paragraphs = finalPayloadMessage.split('\n').map(line => `<p>${line || '<br class="ProseMirror-trailingBreak">'}</p>`).join('');
                        editor.innerHTML = paragraphs;
                    }

                    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: finalPayloadMessage }));
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    editor.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // 6. 에디터에 텍스트가 정상 채워졌는지 검증 후 순정 전송 버튼 클릭 및 실시간 턴수 +1 카운트
                isInternalSending = true;
                setTimeout(() => {
                    const nativeBtn = slot.querySelector('button');
                    if (nativeBtn) {
                        nativeBtn.removeAttribute('disabled');
                        nativeBtn.click();
                        // 전송 클릭 완료 시 턴수 +1 즉시 반영
                        const prevTurns = parseInt(localStorage.getItem(`pastel_crack_chat_turns_${chatId}`) || '0', 10);
                        localStorage.setItem(`pastel_crack_chat_turns_${chatId}`, String(prevTurns + 1));

                        textarea.value = '';
                        updateSendButtonColor();
                    } else {
                        showToast("❌ 크랙 순정 전송 버튼 탐색 실패");
                    }
                    isInternalSending = false;
                }, 80);

                // 7. N턴 주기 백그라운드 자동 로어 추출 검사 및 실행 (중복 실행 방지)
                setTimeout(() => {
                    const extTurns = parseInt(localStorage.getItem(`pastel_crack_lore_auto_ext_turns_ep_${chatId}`), 10) || 6;
                    const currentTurns = getCrackChatTurns();
                    const lastAutoTurnKey = `pastel_crack_last_auto_ext_turn_${chatId}`;
                    const lastAutoTurn = parseInt(localStorage.getItem(lastAutoTurnKey) || '0', 10);

                    if (currentTurns > 0 && currentTurns % extTurns === 0 && currentTurns !== lastAutoTurn) {
                        localStorage.setItem(lastAutoTurnKey, String(currentTurns));
                        (async () => {
                            try {
                                showLoreExtPersistentToast("🔮 로어 자동 생성 중...");
                                await executeBackgroundAutoExtraction(chatId);
                                showToast("✨ 로어 생성 완료!");
                                renderCrackActiveLores();
                            } catch (_) {
                                showToast("❌ 로어 자동 생성 실패");
                            } finally {
                                hideLoreExtPersistentToast();
                            }
                        })();
                    }
                }, 800);
            }, true); // Capture phase로 이벤트 최우선 가로채기
        }
    }

    /* ==========================================================================
     * 4. 서랍 / 아코디언 / 모달 이벤트 바인딩 로직
     * ========================================================================== */
    function bindDrawerEvents() {
        const menuBtn = document.getElementById('ep-native-menu-btn');
        const drawer = document.getElementById('ep-chat-right-drawer');
        const overlay = document.getElementById('ep-chat-drawer-overlay');

        // 서랍 열기/닫기 (슬라이딩 & 페이드 애니메이션 연동)
        const toggleDrawer = (open) => {
            const isOpen = (open !== undefined) ? open : !drawer.classList.contains('open');
            if (isOpen) {
                const subHeader = document.querySelector('.absolute.z-docked.left-0.w-full.h-12') || document.querySelector('.h-12.px-5.flex.justify-between');
                const topOffset = subHeader ? subHeader.getBoundingClientRect().bottom : 104;
                drawer.style.top = `${topOffset}px`;
                overlay.style.top = `${topOffset}px`;
                drawer.classList.add('open');
                overlay.classList.add('open');
            } else {
                drawer.classList.remove('open');
                overlay.classList.remove('open');
            }
        };

        if (menuBtn) menuBtn.onclick = () => toggleDrawer();
        if (overlay) overlay.onclick = () => toggleDrawer(false);

        // 1. API 설정 아코디언
        const apiTitle = document.getElementById('ep-api-accordion-title');
        const apiCard = document.getElementById('api-collapsible-card');
        const tabGemini = document.getElementById('ep-api-tab-gemini');
        const tabFb = document.getElementById('ep-api-tab-firebase');
        const apiKeyInp = document.getElementById('ep-api-key-input');
        const apiFbTextarea = document.getElementById('ep-api-firebase-textarea');
        const apiLabel = document.getElementById('ep-api-label-text');

        if (apiKeyInp) apiKeyInp.value = localStorage.getItem('pastel_api_gemini') || '';
        if (apiFbTextarea) apiFbTextarea.value = localStorage.getItem('pastel_api_firebase') || '';

        if (apiTitle && apiCard) {
            apiTitle.onclick = () => {
                const arrow = apiTitle.querySelector('.accordion-arrow');
                const isOpen = apiCard.style.display === 'flex';
                apiCard.style.display = isOpen ? 'none' : 'flex';
                if (arrow) arrow.classList.toggle('open', !isOpen);
            };
        }

        if (tabGemini && tabFb) {
            tabGemini.onclick = () => {
                tabGemini.classList.add('active');
                tabFb.classList.remove('active');
                apiLabel.textContent = 'Google Gemini API Key';
                apiKeyInp.style.display = 'block';
                apiFbTextarea.style.display = 'none';
            };
            tabFb.onclick = () => {
                tabFb.classList.add('active');
                tabGemini.classList.remove('active');
                apiLabel.textContent = 'firebase script';
                apiKeyInp.style.display = 'none';
                apiFbTextarea.style.display = 'block';
            };
        }

        // 붙여넣기 및 타이핑 즉시 영구 저장 (날아감 100% 방지)
        if (apiKeyInp) {
            apiKeyInp.addEventListener('input', (e) => localStorage.setItem('pastel_api_gemini', e.target.value.trim()));
            apiKeyInp.addEventListener('change', (e) => localStorage.setItem('pastel_api_gemini', e.target.value.trim()));
        }
        if (apiFbTextarea) {
            apiFbTextarea.addEventListener('input', (e) => localStorage.setItem('pastel_api_firebase', e.target.value.trim()));
            apiFbTextarea.addEventListener('change', (e) => localStorage.setItem('pastel_api_firebase', e.target.value.trim()));
        }

        // 2. 모델 선택 아코디언
        const modelTitle = document.getElementById('ep-model-accordion-title');
        const modelCard = document.getElementById('model-collapsible-card');
        const tabModelLore = document.getElementById('ep-model-tab-lore');
        const tabModelSafety = document.getElementById('ep-model-tab-safety');
        const modelLoreView = document.getElementById('ep-model-lore-view');
        const modelSafetyView = document.getElementById('ep-model-safety-view');

        if (modelTitle && modelCard) {
            modelTitle.onclick = () => {
                const arrow = modelTitle.querySelector('.accordion-arrow');
                const isOpen = modelCard.style.display === 'flex';
                modelCard.style.display = isOpen ? 'none' : 'flex';
                if (arrow) arrow.classList.toggle('open', !isOpen);
            };
        }

        if (tabModelLore && tabModelSafety) {
            tabModelLore.onclick = () => {
                tabModelLore.classList.add('active');
                tabModelSafety.classList.remove('active');
                modelLoreView.style.display = 'block';
                modelSafetyView.style.display = 'none';
            };
            tabModelSafety.onclick = () => {
                tabModelSafety.classList.add('active');
                tabModelLore.classList.remove('active');
                modelSafetyView.style.display = 'block';
                modelLoreView.style.display = 'none';
            };
        }

        // 모델 세부 설정 로드/저장
        const modelSettingsMap = [
            ['pastel_crack_lore_extract_model', 'ep-lore-extract-model-select', 'gemini-3.6-flash'],
            ['pastel_crack_lore_extract_custom', 'ep-lore-extract-custom-input', ''],
            ['pastel_crack_lore_judge_model', 'ep-lore-judge-model-select', 'gemini-3.5-flash-lite'],
            ['pastel_crack_lore_judge_custom', 'ep-lore-judge-custom-input', ''],
            ['pastel_crack_lore_reasoning', 'ep-lore-reasoning-select', 'medium'],
            ['pastel_crack_lore_reasoning_budget', 'ep-lore-reasoning-budget-input', '2048'],
            ['pastel_crack_lore_judge_reasoning', 'ep-lore-judge-reasoning-select', 'minimal'],
            ['pastel_crack_safety_harassment', 'ep-safety-harassment-select', 'BLOCK_NONE'],
            ['pastel_crack_safety_hate', 'ep-safety-hate-select', 'BLOCK_NONE'],
            ['pastel_crack_safety_explicit', 'ep-safety-explicit-select', 'BLOCK_NONE'],
            ['pastel_crack_safety_dangerous', 'ep-safety-dangerous-select', 'BLOCK_NONE']
        ];

        const syncModelInputs = () => {
            modelSettingsMap.forEach(([k, id, def]) => {
                const el = document.getElementById(id);
                if (el) el.value = localStorage.getItem(k) || def;
            });
            const extSel = document.getElementById('ep-lore-extract-model-select');
            const extInp = document.getElementById('ep-lore-extract-custom-input');
            if (extSel && extInp) extInp.style.display = extSel.value === '_custom' ? 'block' : 'none';

            const jdgSel = document.getElementById('ep-lore-judge-model-select');
            const jdgInp = document.getElementById('ep-lore-judge-custom-input');
            if (jdgSel && jdgInp) jdgInp.style.display = jdgSel.value === '_custom' ? 'block' : 'none';

            const rsnSel = document.getElementById('ep-lore-reasoning-select');
            const rsnInp = document.getElementById('ep-lore-reasoning-budget-input');
            if (rsnSel && rsnInp) rsnInp.style.display = rsnSel.value === 'budget' ? 'block' : 'none';
        };

        syncModelInputs();

        modelSettingsMap.forEach(([k, id]) => {
            const el = document.getElementById(id);
            if (el) {
                el.onchange = () => {
                    localStorage.setItem(k, el.value);
                    syncModelInputs();
                };
                el.oninput = () => localStorage.setItem(k, el.value);
            }
        });

        // 3. 에피소드 노트 모달 개폐
        const epNoteBtn = document.getElementById('ep-menu-epnote-btn');
        const epNoteModal = document.getElementById('ep-epnote-modal-overlay');
        const epNoteClose = document.getElementById('ep-epnote-close-btn');
        const epNoteTextarea = document.getElementById('ep-epnote-unsent-textarea');

        const getChatId = () => {
            const match = location.pathname.match(/chats\/([a-zA-Z0-9_-]+)/);
            return match ? match[1] : 'global';
        };

        if (epNoteBtn && epNoteModal && epNoteTextarea) {
            epNoteBtn.onclick = (e) => {
                e.stopPropagation();
                const chatId = getChatId();
                epNoteTextarea.value = localStorage.getItem(`pastel_crack_unsent_note_${chatId}`) || '';
                epNoteModal.classList.add('visible'); // 뒤의 서랍 메뉴를 닫지 않고 그 위에 팝업을 띄움
            };
        }

        const closeEpNote = () => {
            if (epNoteTextarea) {
                const chatId = getChatId();
                localStorage.setItem(`pastel_crack_unsent_note_${chatId}`, epNoteTextarea.value);
            }
            if (epNoteModal) epNoteModal.classList.remove('visible');
        };

        if (epNoteClose) epNoteClose.onclick = closeEpNote;
        if (epNoteModal) {
            epNoteModal.onclick = (e) => {
                if (e.target === epNoteModal) closeEpNote();
            };
        }

        // 4. 로어 저장소 모달 개폐 연동
        const loreBtn = document.getElementById('ep-menu-lore-btn');
        const loreModal = document.getElementById('ep-lore-storage-modal-overlay');
        const loreCloseBtn = document.getElementById('ep-lore-close-btn');

        if (loreBtn && loreModal) {
            loreBtn.onclick = (e) => {
                e.stopPropagation();
                loadCrackLoreSettingsTab();
                switchCrackLoreTab('ep-lore-tab-active', 'ep-lore-panel-active');
                loreModal.style.display = 'flex';
            };
        }
        if (loreCloseBtn && loreModal) {
            loreCloseBtn.onclick = () => {
                saveCrackLoreModalFields();
                loreModal.style.display = 'none';
            };
        }
        if (loreModal) {
            loreModal.onclick = (e) => {
                if (e.target === loreModal) {
                    saveCrackLoreModalFields();
                    loreModal.style.display = 'none';
                }
            };
        }

        // 로어 설정 및 관리 탭 변경 시 자동 저장
        ['ep-lore-auto-ext-turns', 'ep-lore-auto-ext-instruction', 'ep-lore-embed-key-input', 'ep-lore-embed-model-select', 'ep-lore-merge-maxchars', 'ep-lore-merge-bulk-mode', 'ep-lore-manual-ext-turns'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', saveCrackLoreModalFields);
        });

        // 로어 5대 탭 버튼 연결
        const tabAct = document.getElementById('ep-lore-tab-active');
        if (tabAct) tabAct.onclick = () => switchCrackLoreTab('ep-lore-tab-active', 'ep-lore-panel-active');
        const tabLog = document.getElementById('ep-lore-tab-log');
        if (tabLog) tabLog.onclick = () => switchCrackLoreTab('ep-lore-tab-log', 'ep-lore-panel-log');
        const tabMan = document.getElementById('ep-lore-tab-manage');
        if (tabMan) tabMan.onclick = () => switchCrackLoreTab('ep-lore-tab-manage', 'ep-lore-panel-manage');
        const tabRes = document.getElementById('ep-lore-tab-restore');
        if (tabRes) tabRes.onclick = () => switchCrackLoreTab('ep-lore-tab-restore', 'ep-lore-panel-restore');
        const tabSet = document.getElementById('ep-lore-tab-settings');
        if (tabSet) tabSet.onclick = () => switchCrackLoreTab('ep-lore-tab-settings', 'ep-lore-panel-settings');

        // 4-1. 데이터 관리: 대화 저장 (HTML)
        const htmlSaveBtn = document.getElementById('ep-menu-html-save-btn');
        if (htmlSaveBtn) {
            htmlSaveBtn.onclick = (e) => {
                e.stopPropagation();
                exportCrackChatToHtml();
            };
        }

        // 4-2. 데이터 관리: 크랙 로컬 DB 및 설정값 전체 완전 초기화 (Wipe)
        const clearBtn = document.getElementById('ep-menu-crack-clear-btn');
        if (clearBtn) {
            clearBtn.onclick = async () => {
                if (!confirm("⚠️ 주의: 크랙 사이트에 저장된 모든 로컬 데이터(로어 저장소 DB, 백업 스냅샷, 치환자, 메모, API 캐시 등)를 완전히 삭제하고 초기화하시겠습니까?")) return;

                try {
                    // 1. Dexie IndexedDB ('lore-injector') 완전 삭제 및 초기화
                    if (loreDb) {
                        try {
                            await loreDb.delete();
                            console.log("🗑️ [PASTEL] Dexie lore-injector DB 완전 삭제 완료");
                        } catch (dbErr) {
                            console.warn("Dexie 삭제 예외:", dbErr);
                        }
                    }

                    // 2. LocalStorage 내 PASTEL & CRACK 관련 모든 키 일괄 삭제
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k && (k.startsWith('pastel_') || k.startsWith('pastel_crack_') || k.includes('crack'))) {
                            keysToRemove.push(k);
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));

                    showToast("✨ 크랙 로컬 DB 및 데이터가 완전히 초기화되었습니다.");
                    setTimeout(() => location.reload(), 900);
                } catch (err) {
                    alert("초기화 중 오류 발생: " + err.message);
                }
            };
        }
    }

    /* ==========================================================================
     * 4.5 [순정 1:1 무손실] 말풍선 텍스트 직접 렌더러 & 수정모드 완벽 연동
     * ========================================================================== */
    let chatObserverInstance = null;
    let scanScheduled = false;

    function renderSingleMessageLeaf(targetEl) {
        if (!targetEl) return;

        // 1. 에디터 툴바, 서랍, 모달 내부 요소는 절대 건드리지 않음
        if (targetEl.closest('.chat-footer-control') ||
            targetEl.closest('#ep-chat-right-drawer') ||
            targetEl.closest('.ProseMirror') ||
            targetEl.closest('.ep-prompt-overlay') ||
            targetEl.closest('#ep-tpl-quick-panel') ||
            targetEl.closest('#ep-shortcut-select-popup')) {
            return;
        }

        // 2. 크랙 순정 수정 모드(textarea 활성화)일 때는 파싱을 건너뛰고 순정 에디터 보존
        if (targetEl.tagName === 'TEXTAREA' || 
            targetEl.querySelector('textarea') || 
            targetEl.getAttribute('contenteditable') === 'true' || 
            targetEl.closest('textarea, [contenteditable="true"]')) {
            targetEl.removeAttribute('data-pastel-parsed');
            targetEl.removeAttribute('data-pastel-raw');
            return;
        }

        // 3. 자식 요소 중에 텍스트 컨테이너가 또 있다면 최하위(Leaf) 노드만 처리
        if (targetEl.querySelector('.whitespace-pre-wrap, .break-words, .prose, p')) {
            return;
        }

        // 4. 유저 메시지 여부 판별
        const isUser = !!targetEl.closest('.justify-end') || 
                       !!targetEl.closest('[class*="items-end"]') || 
                       !!targetEl.closest('.bg-accent_translucent') ||
                       targetEl.classList.contains('bg-accent_translucent');

        // 5. 엔터(\n)가 살아있는 순수 텍스트 추출 (최초 1회 캐싱 후 갱신 시 업데이트)
        let rawText = targetEl.getAttribute('data-pastel-raw');
        if (!rawText) {
            rawText = targetEl.innerText || '';
            if (!rawText.trim()) return;
            targetEl.setAttribute('data-pastel-raw', rawText);
        }

        const role = isUser ? 'user' : 'model';
        const parsedHtml = parseChatMarkdown(rawText, role);

        if (targetEl.innerHTML !== parsedHtml) {
            targetEl.innerHTML = parsedHtml;
            targetEl.setAttribute('data-pastel-parsed', 'true');
        }
    }

    function scanAndRenderAllMessages() {
        scanScheduled = false;

        const chatRoot = document.querySelector('.flex.flex-col-reverse.w-full') || 
                         document.querySelector('main') || 
                         document.body;

        if (!chatRoot) return;

        // 크랙 대화창 내의 텍스트 말풍선 컨테이너들 전수 탐색
        const textElements = chatRoot.querySelectorAll(
            '.whitespace-pre-wrap, .break-words, .prose, p, div[class*="bubble"]'
        );

        textElements.forEach(el => {
            renderSingleMessageLeaf(el);
        });
    }

    function scheduleScan() {
        if (scanScheduled) return;
        scanScheduled = true;
        requestAnimationFrame(scanAndRenderAllMessages);
    }

    function attachCrackChatObserver() {
        if (chatObserverInstance) return;

        const chatRoot = document.querySelector('.flex.flex-col-reverse.w-full') || 
                         document.querySelector('main') || 
                         document.body;

        if (!chatRoot) return;

        chatObserverInstance = new MutationObserver((mutations) => {
            let needsScan = false;
            for (const m of mutations) {
                // 수정 입력창 내부 타이핑은 무시
                if (m.target && (m.target.tagName === 'TEXTAREA' || m.target.getAttribute?.('contenteditable') === 'true')) {
                    continue;
                }
                if (m.addedNodes.length > 0 || m.type === 'characterData') {
                    needsScan = true;
                    break;
                }
            }
            if (needsScan) {
                scheduleScan();
            }
        });

        chatObserverInstance.observe(chatRoot, {
            childList: true,
            subtree: true,
            characterData: true
        });

        scheduleScan();
    }

    /* ==========================================================================
     * 5. [모듈 5] Dexie 로어 DB, crack.html 순정 100% 원문 프롬프트 & 5대 로어 엔진
     * ========================================================================== */
    let loreDb = null;
    try {
        loreDb = new Dexie("lore-injector");
        loreDb.version(9).stores({
            entries: "++id, name, type, packName, project, rootId, isCurrentArc, createdTurn, updatedTurn, lastMentionedTurn, eventTurn, sceneId, arcId, realTimestamp, *entities, *subjects, *objects, *locations, *promises, *triggers",
            packs: "name, entryCount, project",
            snapshots: "++id, packName, timestamp, type",
            embeddings: "++id, entryId, packName, model, field, sourceHash, entryUpdatedAt, schemaVersion, &[entryId+field]",
            workingMemory: "url", encounters: "++id, &[char1+char2], lastSeenTurn", entryVersions: "++id, entryId, ts, turn"
        });
    } catch (e) { console.warn("Dexie 로어 DB 초기화:", e); }

    const C = {
        uniq(arr) {
            return Array.from(new Set((arr || []).filter(Boolean).map(v => String(v).trim()).filter(Boolean)));
        },
        mergeObj(a, b) {
            const out = a && typeof a === "object" && !Array.isArray(a) ? JSON.parse(JSON.stringify(a)) : {};
            if (b && typeof b === "object" && !Array.isArray(b)) {
                for (const [k, v] of Object.entries(b)) {
                    if (Array.isArray(v)) out[k] = C.uniq([...Array.isArray(out[k]) ? out[k] : [], ...v]);
                    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = C.mergeObj(out[k], v);
                    else if (v !== undefined && v !== null && v !== "") out[k] = v;
                }
            }
            return out;
        },
        clampText(text, max) {
            text = String(text || "").replace(/\s+/g, " ").trim();
            if (!max || text.length <= max) return text;
            return text.slice(0, Math.max(0, max - 1)).trim() + "…";
        },
        normalizeSummaryValue(summary, name, state) {
            if (summary && typeof summary === "object" && !Array.isArray(summary)) {
                const full = this.clampText(summary.full || summary.compact || summary.micro || "", 700);
                const compact = this.clampText(summary.compact || full, 180);
                const micro = this.clampText(summary.micro || (state ? `${name}=${state}` : compact || name), 60);
                return { full, compact, micro };
            }
            const full = this.clampText(summary || "", 700);
            const compact = this.clampText(full || state || name || "", 180);
            const micro = this.clampText(state ? `${name}=${state}` : compact || name || "", 60);
            return { full, compact, micro };
        },
        mergeLoreSummary(existingSummary, incomingSummary, name, state) {
            const ex = C.normalizeSummaryValue(existingSummary, name, state);
            const inc = C.normalizeSummaryValue(incomingSummary, name, state);
            let finalFull = inc.full || ex.full || "";
            if (ex.full && inc.full && ex.full.length > 300) {
                if (inc.full.length / ex.full.length < 0.65) finalFull = ex.full + " \n " + inc.full;
            }
            let finalCompact = inc.compact || ex.compact || "";
            if (ex.compact && inc.compact && ex.compact.length > 150) {
                if (inc.compact.length / ex.compact.length < 0.65) finalCompact = ex.compact + " \n " + inc.compact;
            }
            return {
                full: this.clampText(finalFull, 700),
                compact: this.clampText(finalCompact, 180),
                micro: this.clampText(inc.micro || ex.micro || "", 60)
            };
        }
    };

    function reorderLoreKeys(entry) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
        const ordered = {};
        const keyOrder = ['type', 'name', 'promises', 'summary', 'callState', 'triggers', 'state', 'entities'];
        const metaKeys = ['source', 'ts', 'lastUpdated'];
        keyOrder.forEach(k => { if (Object.prototype.hasOwnProperty.call(entry, k)) ordered[k] = entry[k]; });
        Object.keys(entry).forEach(k => { if (!keyOrder.includes(k) && k !== 'eventHistory' && !metaKeys.includes(k)) ordered[k] = entry[k]; });
        if (Object.prototype.hasOwnProperty.call(entry, 'eventHistory')) ordered['eventHistory'] = entry['eventHistory'];
        metaKeys.forEach(k => { if (Object.prototype.hasOwnProperty.call(entry, k)) ordered[k] = entry[k]; });
        return ordered;
    }

    function parseFirebaseConfig(scriptStr) {
        try {
            const clean = scriptStr.trim();
            if (clean.startsWith("{")) return JSON.parse(clean);
            const match = scriptStr.match(/firebaseConfig\s*=\s*(\{[\s\S]*?\});?/);
            if (match && match[1]) {
                return new Function("return " + match[1])();
            }
        } catch (e) {}
        return null;
    }

    function getGeminiOrFirebaseEndpoint(selectedModel, action = 'generateContent') {
        const apiKey = localStorage.getItem('pastel_api_gemini') || '';
        const firebaseScript = localStorage.getItem('pastel_api_firebase') || '';

        if (apiKey.trim()) {
            return `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:${action}?key=${apiKey.trim()}`;
        } else if (firebaseScript.trim()) {
            const config = parseFirebaseConfig(firebaseScript);
            if (config && config.projectId && config.apiKey) {
                return `https://firebasevertexai.googleapis.com/v1beta/projects/${config.projectId}/locations/global/publishers/google/models/${selectedModel}:${action}?key=${config.apiKey}`;
            }
        }
        return "";
    }

    function getSafetySettingsPayload() {
        return [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: localStorage.getItem('pastel_crack_safety_harassment') || 'BLOCK_NONE' },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: localStorage.getItem('pastel_crack_safety_hate') || 'BLOCK_NONE' },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: localStorage.getItem('pastel_crack_safety_explicit') || 'BLOCK_NONE' },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: localStorage.getItem('pastel_crack_safety_dangerous') || 'BLOCK_NONE' }
        ];
    }

    // ==========================================
    // crack.html 순정 100% 원문 프롬프트 템플릿
    // ==========================================
    const SCHEMA_FORMAT = `[
    {
        "type": "character|relationship|location|item|event|concept|setting|promise",
        "name": "지식 명칭",
        "triggers": ["키워드1", "인물&&사건"],
        "promises": ["[인물A ↔ 인물B] 약속 내용"],
        "summary": {
            "full": "누적 요약: 현재 정보 및 진행 중인 서사",
            "compact": "지식 핵심 내용",
            "micro": "지식명=상태"
        },
        "state": "상태 구절",
        "callState": { "A→B": "호칭/별명", "B→A": "호칭/별명" },
        "entities": ["관련 인물/장소명"],
        "eventHistory": [
            { 
                "turn": 0, 
                "summary": "핵심 사건 1줄 요약 (명사형 종결 ~함, 최대 40자 제한. 예: '론과 오해로 싸움')", 
                "quote": { "speaker": "말한/생각한 이", "listener": "들은 이 | 'self'", "text": "『대사』 또는 「속마음」" }
            }
        ]
    }
]`;

    const PROMPT_TEMPLATE_TEXT = `You are an AI Lore Archivist.
Convert the provided [Source Text to convert] into structured JSON lore entries for RP.
Use the original language of the text (Korean).
Output ONLY a valid JSON array matching the schema below. No markdown backticks, no trailing commas.

=========================================
[CORE MISSION: DUAL-TASK OF LORE ARCHIVIST]
Your core mission is to manage the Lore Database with absolute consistency. You must perform two tasks simultaneously in a single pass:
- Read the [Source Text to convert] carefully and merge its extracted information into the [Existing Lore generated so far] provided below.
- Do NOT create duplicate cards under similar, altered, or differently formatted names. You must directly update the fields of the existing cards from [Existing Lore generated so far] if they represent the same entity, or append NEW cards if they are completely new.
- Output the ENTIRE updated and merged JSON array containing both the retained old cards and any newly created cards.

Task 1. GENERAL LORE & PROFILES (인물/관계/장소/세계관):
- If a new character, relationship, location, item, setting, or world concept is introduced in the [Source Text to convert] that does NOT already exist in the [Existing Lore generated so far], you MUST create a NEW JSON card (object) for it.
- If it already exists, you MUST edit and update the existing JSON card. Do NOT create duplicate cards.
- For "character" and "relationship" type entries, you MUST populate the "promises" array ONLY with active, ongoing promises/agreements.
    * Each item in "promises" MUST strictly follow the format: "[인물A ↔ 인물B] 무엇을 하기로 약속함" (specifying exactly who promised what to whom).
    * CRITICAL (DELETION RULE): If a promise has been fulfilled, completed, canceled, or broken in the current context, you MUST REMOVE/OMIT it from the "promises" array completely. Do NOT keep resolved or past promises.
    * If a new/updated promise overlaps or contradicts an existing one, overwrite it with the latest status.
- For "relationship" type entries, ALWAYS populate the "callState" field mapping how characters address each other (e.g. {"A→B": "오빠", "B→A": "이름"}). For other types, leave it as an empty object {}.
- "eventHistory": Actively extract and append any meaningful narrative progress, emotional changes, or actions as milestone events. You MUST ensure each event has a corresponding "quote" to capture the character's voice.
  * "eventHistory.summary" Rules: This MUST be an extremely short, single-sentence summary (strictly under 40 characters) written in nominal style (~함). Do NOT narrate details; only write the core milestone (e.g., 'A와 화해함', '비밀 조약 체결함').
  * quote: You MUST actively extract the most representative dialogue or inner thought of this event milestone under "quote". Do NOT omit the "quote" field unless the character was completely silent.
- Target Length: Keep the "summary.full" of these cards strictly under 700 characters. Focus on identity and core rules, offloading specific scene descriptions to Task 2.

Task 2. SCENE EVENTS (사건 기록) & LARGE PROMISES (대형 약속/계약):
- Analyze the [Source Text to convert] to extract concrete, plot-critical scene milestones, major reveals, emotional shifts, or agreements that occurred in this log segment.
- Create a NEW card of "type": "event" for each major scene milestone.
- Create a card of "type": "promise" ONLY for major, high-stakes contracts, solemn covenants, or life-altering oaths (e.g., a psychopath's solemn oath not to harm someone, a playboy's promise to look only at you, or other major contracts/vows of similar or higher significance).
  * This card threshold must be high. Do not create standalone "promise" cards for trivial agreements.
  * For "type": "promise" cards, the "summary.full" field MUST strictly begin with "[진행 상황: <상태>] " (where <상태> represents the current status of the promise/contract dynamically determined by you, such as "진행중", "완료", "해제", "보류" etc.).
  * Unlike minor promises inside profiles, a "type": "promise" card is an enduring historical record and MUST NOT be deleted even if its status is completed/resolved.
- Focus: Capture the participants, location, the outcome of the scene, and crucially, any unresolved tension or ongoing plot threads under "hooks".
- Target Length: Keep the "summary.full" of event cards strictly under 700 characters.
- Event Date/Period Formatting: For "type": "event" entries, you MUST prepend the specific date or date range of the event at the very beginning of the "summary.full" field. You must strictly follow these exact formats with precise spaces:
  * Single Date: "yyyy. mm. dd | " (Example: "2025. 10. 15 | ...". Year must be 4 digits, month and day must be 2 digits with leading zeros, separated by a dot and a space. Do NOT write "2025년 10월 15일", "2025/10/15", "2025.10.15", or "2025. 10. 15. 밤").
  * Date Range: "yyyy. mm. dd ~ yyyy. mm. dd | " (Example: "2025. 10. 15 ~ 2025. 10. 18 | ...").
  * Unknown Date: "Relative Timeline | " (Example: "합숙 첫째 날 낮 | ...", "축제 사흘째 밤 | ...". Only use this if the exact calendar date is unknown).

=========================================
[TOKEN-SAVING & STYLE CONSTRAINT]
- EXCLUSION: Only the "text" field inside the "quote" array is allowed to use natural, colloquial speech (e.g. "『...』", "「...」").
- MANDATORY STYLE: ALL other text fields—including "summary.full", "summary.compact", "summary.micro", and "state" fields—MUST be written in Korean using concise nominal/noun-ending styles (개조식 종결어미: e.g., "~함", "~임", "~음", "~했음", or noun form).
- NEVER use polite, formal, or plain prose endings (e.g., "~합니다", "~이다", "~했다" 등 평서문/설명조 문체 영구 금지).

=========================================
[ADVANCED DEDUPLICATION & INTEGRITY RULES]
- DIRECT UPDATE ONLY (APPLIES TO ALL CARD TYPES: character, rel, location, item, event, concept, setting): If any card of any type already exists in the provided Lore Database, DO NOT create a new duplicate card under an altered, shortened, or differently formatted name. You must directly update the fields of the existing card and output it.
  * NO RECENT CHANGES? OMIT OUTPUT: If there is no new narrative progress, emotional shift, or factual change for an existing card (of any type), do NOT output it at all. Omit it from the output array to save tokens.
  * UPDATE COMPLIANCE (FOR ALL CARD TYPES): When updating the fields (especially "summary.full") of any existing card, you MUST strictly adhere to the [PROPORTIONAL NARRATIVE CONDENSING RULE] and [TOKEN-SAVING & STYLE CONSTRAINT] below to maintain style consistency and prevent narrative fragmentation.
  * CHARACTER NAME MATCHING: Specifically for characters, if they are referred to by a shortened name or nickname in the log (e.g., "하늘"), but their full name card (e.g., "강하늘") exists in the database, you MUST directly update the existing full name card ("강하늘"). Never output a new separate card under "하늘".
  * CANONICAL RELATIONSHIPS (↔): Specifically for relationships, they must ALWAYS be named under the strict format "NameA ↔ NameB" (with space-bracket-space, sorted alphabetically, e.g., "강하늘 ↔ 김도훈"). If a relationship card between these two characters already exists (even if written as "김도훈 ↔ 강하늘", with different separators, or different orders), you MUST reuse the exact same name of that existing card and update its fields directly.

- SACRED NARRATIVE ANCHORS (핵심 서사 보존 대원칙):
  * You MUST NEVER delete, alter, or heavily compress the core plot milestones, traumatic past events, or defining relationship turning points (e.g., family background, childhood piano hideout memory, major injuries or violent incidents).
  * These are the sacred narrative anchors of the character's identity and must be preserved verbatim in "summary.full" even if they are old.

- ANCHOR AWARENESS (CRITICAL — USER-LOCKED NARRATIVE FACTS):
  * Some existing entries in the Lore Database have "anchor": true. These are user-locked canonical facts.
  * For anchored entries: NEVER output or overwrite "summary", "state", "detail", "call", "callState", "cond", "imp", "sur", "emo", "gs", or "arc". These fields are PROTECTED and any output will be discarded by the merge layer.
  * You MAY only APPEND new items to "eventHistory" (if genuinely new and memorable), or add new keywords to "triggers".
  * If nothing new qualifies for an anchored entry, OMIT it entirely from your output. Do not echo its existing fields.

=========================================
[DYNAMIC EXTRACTION BALANCE (서사 엔진 중심 수급 원칙)]
- CHARACTER, RELATIONSHIP (relationship), and PROMISE (promise) are the absolute highest priority narrative engines of this story. You must be extremely vigilant in creating or updating these types whenever a bond shifts, an emotional milestone is reached, or an agreement is made.
- Other background types like "location", "concept", and "setting" should ONLY be created or updated when a highly significant, plot-defining physical transformation or world-rule change actually occurs. Never create or update these for minor, transient details.

=========================================
[STRICT EVENT CARD RULES (사건 카드 수호 규칙)]
- EVENT NAMING RULE: Never include turn markers (e.g. t12, turn 12), dates, or time indicators in the event "name" or "title". Keep it strictly as a clean, thematic title in the conversation language (e.g., '비밀의 방에서의 야간 비밀 회동', '헤르미온느의 약점 고백', '칼잡이의 습격과 대처').
- EVENT DEDUPLICATION & REUSE: If the event being extracted is a continuation, update, or similar occurrence of an event that already exists in the provided Lore Database, you MUST reuse the EXACT same "name" of that existing event card so it merges cleanly, instead of inventing a new name.
- EVENT SIGNIFICANCE CRITERIA (사건 추출의 실질성 원칙):
  * Focus on the SUBSTANCE of the interaction, not just the setting.
  * Even if the scene is set in a casual, daily-life environment (e.g., eating dinner, taking a walk, resting), if a significant emotional shift, a critical agreement, a major confession, or a narrative reveal actually occurs, you MUST extract it as an "event" card.
  * Only ignore routine, meaningless small talk that has no narrative consequence or emotional development.

=========================================
[CONTEXTUAL QUOTE PLACEMENT (어록의 입체적 배정 원칙)]
- Do NOT blindly record all quotes under 'character' cards. Instead, record the dialogue or inner thoughts inside the "quote" object of an "eventHistory" entry of the specific card that they define most critically:
  * RELATIONSHIP QUOTES: If a quote defines a relationship shift, emotional bond, or oath between two characters, record it inside the "eventHistory" of the corresponding "relationship" card.
  * EVENT QUOTES: If a quote is the defining highlight or climax of a scene event, record it inside the "eventHistory" of that specific "event" card.
  * LOCATION QUOTES: If a quote is deeply tied to a location's atmosphere or occurrence, record it inside the "eventHistory" of that "location" card.
  * CHARACTER QUOTES: Otherwise, default to recording it inside the "eventHistory" of the speaker's "character" card.

=========================================
[PROPORTIONAL NARRATIVE CONDENSING RULE (summary.full: Max 700 Chars)]
- You are editing/creating the "summary.full" field, which has a strict 700-character budget.
- When updating an existing entity's "summary.full" to reflect new events:
  * If the existing summary length is UNDER 550 characters, you MUST copy the existing summary text WORD-FOR-WORD (Verbatim) and simply APPEND the new events chronologically at the end.
  * If the combined length approaches or exceeds 700 characters, you MUST perform "Proportional Narrative Condensing":
    - Priority 1 (Verbatim Preservation): Look at "eventHistory", "promises", and "callState". The nominal sentences in the summary describing these critical turning points (e.g., 고백함, 중상 입음, 계약 체결함) must be preserved VERBATIM. Never summarize or delete them.
    - Priority 2 (Latest Situation): Append the events from the latest [Source Text to convert] in a highly dense nominal style at the very end of the summary.
    - Priority 3 (Condensing Zone): Intellectually condense only the trivial, older, or minor past descriptions in the middle of the summary into brief, high-density background clauses (e.g., "~한 가벼운 일상이 있었으나").
 - Date Prefix Preservation (CRITICAL): If the card being updated is an "event" type, you MUST preserve the exact date prefix at the very beginning of "summary.full" (e.g., "yyyy. mm. dd | " or "Relative Timeline | ") without changing even a single digit, space, or period.
 - Ensure the entire updated summary is a single, grammatically complete, flowing paragraph ending in nominal style. Never end with an unfinished sentence or trailing dots (…).

=========================================
[METADATA PRESERVATION & UPDATE RULES]
You MUST NOT lose or overwrite the other fields in the JSON. Preserve and update them with extreme care:
- "triggers": Maintain existing keyword patterns, appending new relevant search queries.
- "promises": Maintain active promises. Ensure all entries strictly use the "[인물A ↔ 인물B] 약속 내용" format. If a minor promise is completely resolved or broken, remove it. If it is updated, replace it with the latest status. Distinct promises must all be preserved separately.
- "callState": Strictly preserve and update the honorific/vocative relationship matrix (from→to: title).

=========================================
[MEMORABLE QUOTES (명대사 및 어록 보존 규칙)]
  * When extracting a key narrative event (eventHistory) representing emotional shifts, relationship milestones, or contract execution, always record the most influential and memorable dialogue or inner thoughts representing that event inside the quote object of that event.
    - Dialogue (대사): Use 『 』 bracket quotes. e.g., "speaker": "해리포터", "listener": "론", "text": "『제발 한 번만 내 말 들어줘』"
    - Inner Thoughts (속마음/독백): Use 「 」 bracket quotes. e.g., "speaker": "해리포터", "listener": "self", "text": "「볼드모트에게 절대로 지고 싶지 않음」"
  * CRITICAL JSON SAFETY: Inside any JSON string values, you MUST NEVER use double quotes (") for dialogue or emphasis. Use single quotes (') or bracket-quotes instead to prevent JSON parsing syntax crashes.

Schema:
${SCHEMA_FORMAT}

[Existing Lore generated so far]:
{existing_lore}

[Source Text to convert]:
`;

    const PROMPT_TEMPLATE_CHAT = `You are an AI Lore Archivist.
Convert the following conversation log into structured JSON lore entries for RP.
Output ONLY a valid JSON array matching the schema. No markdown backticks, no trailing commas.

=========================================
[CORE MISSION: DUAL-TASK OF LORE ARCHIVIST]
Your core mission is to manage the Lore Database with absolute consistency. You must perform two tasks simultaneously in a single pass:

Task 1. GENERAL LORE & PROFILES (인물/관계/장소/세계관):
- If a new character, relationship, location, item, setting, or world concept is introduced in the [Conversation Log] that does NOT already exist in the [Existing Lore Database], you MUST create a NEW JSON card (object) for it.
- If it already exists, you MUST edit and update the existing JSON card. Do NOT create duplicate cards.
- For "character" and "relationship" type entries, you MUST populate the "promises" array ONLY with active, ongoing promises/agreements.
  * Each item in "promises" MUST strictly follow the format: "[인물A ↔ 인물B] 무엇을 하기로 약속함" (specifying exactly who promised what to whom).
  * CRITICAL (DELETION RULE): If a promise has been fulfilled, completed, canceled, or broken in the current context, you MUST REMOVE/OMIT it from the "promises" array completely. Do NOT keep resolved or past promises.
  * If a new/updated promise overlaps or contradicts an existing one, overwrite it with the latest status.
- For "relationship" type entries, ALWAYS populate the "callState" field mapping how characters address each other (e.g. {"A→B": "오빠", "B→A": "이름"}). For other types, leave it as an empty object {}.
- "eventHistory": Actively extract and append any meaningful narrative progress, emotional changes, or actions as milestone events. You MUST ensure each event has a corresponding "quote" to capture the character's voice.
  * "eventHistory.summary" Rules: This MUST be an extremely short, single-sentence summary (strictly under 40 characters) written in nominal style (~함). Do NOT narrate details; only write the core milestone (e.g., 'A와 화해함', '비밀 조약 체결함').
  * quote: You MUST actively extract the most representative dialogue or inner thought of this event milestone under "quote". Do NOT omit the "quote" field unless the character was completely silent.
- Target Length: Keep the "summary.full" of these cards strictly under 700 characters. Focus on identity and core rules, offloading specific scene descriptions to Task 2.

Task 2. SCENE EVENTS (사건 기록) & LARGE PROMISES (대형 약속/계약):
- Analyze the [Conversation Log] to extract concrete, plot-critical scene milestones, major reveals, emotional shifts, or agreements that occurred in this log segment.
- Create a NEW card of "type": "event" for each major scene milestone.
- Create a card of "type": "promise" ONLY for major, high-stakes contracts, solemn covenants, or life-altering oaths (e.g., a psychopath's solemn oath not to harm someone, a playboy's promise to look only at you, or other major contracts/vows of similar or higher significance).
  * This card threshold must be high. Do not create standalone "promise" cards for trivial agreements.
  * For "type": "promise" cards, the "summary.full" field MUST strictly begin with "[진행 상황: <상태>] " (where <상태> represents the current status of the promise/contract dynamically determined by you, such as "진행중", "완료", "해제", "보류" etc.).
  * Unlike minor promises inside profiles, a "type": "promise" card is an enduring historical record and MUST NOT be deleted even if its status is completed/resolved.
- Focus: Capture the participants, location, the outcome of the scene, and crucially, any unresolved tension or ongoing plot threads under "hooks".
- Target Length: Keep the "summary.full" of event cards strictly under 700 characters.
- Event Date/Period Formatting: For "type": "event" entries, you MUST prepend the specific date or date range of the event at the very beginning of the "summary.full" field. You must strictly follow these exact formats with precise spaces:
  * Single Date: "yyyy. mm. dd | " (Example: "2025. 10. 15 | ...". Year must be 4 digits, month and day must be 2 digits with leading zeros, separated by a dot and a space. Do NOT write "2025년 10월 15일", "2025/10/15", "2025.10.15", or "2025. 10. 15. 밤").
  * Date Range: "yyyy. mm. dd ~ yyyy. mm. dd | " (Example: "2025. 10. 15 ~ 2025. 10. 18 | ...").
  * Unknown Date: "Relative Timeline | " (Example: "합숙 첫째 날 낮 | ...", "축제 사흘째 밤 | ...". Only use this if the exact calendar date is unknown).

=========================================
[TOKEN-SAVING & STYLE CONSTRAINT]
- EXCLUSION: Only the "text" field inside the "quote" array is allowed to use natural, colloquial speech (e.g. "『...』", "「...」").
- MANDATORY STYLE: ALL other text fields—including "summary.full", "summary.compact", "summary.micro", and "state" fields—MUST be written in Korean using concise nominal/noun-ending styles (개조식 종결어미: e.g., "~함", "~임", "~음", "~했음", or noun form).
- NEVER use polite, formal, or plain prose endings (e.g., "~합니다", "~이다", "~했다" 등 평서문/설명조 문체 영구 금지).

=========================================
[ADVANCED DEDUPLICATION & INTEGRITY RULES]
- DIRECT UPDATE ONLY (APPLIES TO ALL CARD TYPES: character, rel, location, item, event, concept, setting): If any card of any type already exists in the provided Lore Database, DO NOT create a new duplicate card under an altered, shortened, or differently formatted name. You must directly update the fields of the existing card and output it.
  * NO RECENT CHANGES? OMIT OUTPUT: If there is no new narrative progress, emotional shift, or factual change for an existing card (of any type), do NOT output it at all. Omit it from the output array to save tokens.
  * UPDATE COMPLIANCE (FOR ALL CARD TYPES): When updating the fields (especially "summary.full") of any existing card, you MUST strictly adhere to the [PROPORTIONAL NARRATIVE CONDENSING RULE] and [TOKEN-SAVING & STYLE CONSTRAINT] below to maintain style consistency and prevent narrative fragmentation.
  * CHARACTER NAME MATCHING: Specifically for characters, if they are referred to by a shortened name or nickname in the log (e.g., "하늘"), but their full name card (e.g., "강하늘") exists in the database, you MUST directly update the existing full name card ("강하늘"). Never output a new separate card under "하늘".
  * CANONICAL RELATIONSHIPS (↔): Specifically for relationships, they must ALWAYS be named under the strict format "NameA ↔ NameB" (with space-bracket-space, sorted alphabetically, e.g., "강하늘 ↔ 김도훈"). If a relationship card between these two characters already exists (even if written as "김도훈 ↔ 강하늘", with different separators, or different orders), you MUST reuse the exact same name of that existing card and update its fields directly.

- SACRED NARRATIVE ANCHORS (핵심 서사 보존 대원칙):
  * You MUST NEVER delete, alter, or heavily compress the core plot milestones, traumatic past events, or defining relationship turning points (e.g., family background, childhood piano hideout memory, major injuries or violent incidents).
  * These are the sacred narrative anchors of the character's identity and must be preserved verbatim in "summary.full" even if they are old.

- ANCHOR AWARENESS (CRITICAL — USER-LOCKED NARRATIVE FACTS):
  * Some existing entries in the Lore Database have "anchor": true. These are user-locked canonical facts.
  * For anchored entries: NEVER output or overwrite "summary", "state", "detail", "call", "callState", "cond", "imp", "sur", "emo", "gs", or "arc". These fields are PROTECTED and any output will be discarded by the merge layer.
  * You MAY only APPEND new items to "eventHistory" (if genuinely new and memorable), or add new keywords to "triggers".
  * If nothing new qualifies for an anchored entry, OMIT it entirely from your output. Do not echo its existing fields.

=========================================
[DYNAMIC EXTRACTION BALANCE (서사 엔진 중심 수급 원칙)]
- CHARACTER, RELATIONSHIP (relationship), and PROMISE (promise) are the absolute highest priority narrative engines of this story. You must be extremely vigilant in creating or updating these types whenever a bond shifts, an emotional milestone is reached, or an agreement is made.
- Other background types like "location", "concept", and "setting" should ONLY be created or updated when a highly significant, plot-defining physical transformation or world-rule change actually occurs. Never create or update these for minor, transient details.

=========================================
[STRICT EVENT CARD RULES (사건 카드 수호 규칙)]
- EVENT NAMING RULE: Never include turn markers (e.g. t12, turn 12), dates, or time indicators in the event "name" or "title". Keep it strictly as a clean, thematic title in the conversation language (e.g., '비밀의 방에서의 야간 비밀 회동', '헤르미온느의 약점 고백', '칼잡이의 습격과 대처').
- EVENT DEDUPLICATION & REUSE: If the event being extracted is a continuation, update, or similar occurrence of an event that already exists in the provided Lore Database, you MUST reuse the EXACT same "name" of that existing event card so it merges cleanly, instead of inventing a new name.
- EVENT SIGNIFICANCE CRITERIA (사건 추출의 실질성 원칙):
  * Focus on the SUBSTANCE of the interaction, not just the setting.
  * Even if the scene is set in a casual, daily-life environment (e.g., eating dinner, taking a walk, resting), if a significant emotional shift, a critical agreement, a major confession, or a narrative reveal actually occurs, you MUST extract it as an "event" card.
  * Only ignore routine, meaningless small talk that has no narrative consequence or emotional development.

=========================================
[CONTEXTUAL QUOTE PLACEMENT (어록의 입체적 배정 원칙)]
- Do NOT blindly record all quotes under 'character' cards. Instead, record the dialogue or inner thoughts inside the "quote" object of an "eventHistory" entry of the specific card that they define most critically:
  * RELATIONSHIP QUOTES: If a quote defines a relationship shift, emotional bond, or oath between two characters, record it inside the "eventHistory" of the corresponding "relationship" card.
  * EVENT QUOTES: If a quote is the defining highlight or climax of a scene event, record it inside the "eventHistory" of that specific "event" card.
  * LOCATION QUOTES: If a quote is deeply tied to a location's atmosphere or occurrence, record it inside the "eventHistory" of that "location" card.
  * CHARACTER QUOTES: Otherwise, default to recording it inside the "eventHistory" of the speaker's "character" card.

=========================================
[PROPORTIONAL NARRATIVE CONDENSING RULE (summary.full: Max 700 Chars)]
- You are editing/creating the "summary.full" field, which has a strict 700-character budget.
- When updating an existing entity's "summary.full" to reflect new events:
  * If the existing summary length is UNDER 550 characters, you MUST copy the existing summary text WORD-FOR-WORD (Verbatim) and simply APPEND the new events chronologically at the end.
  * If the combined length approaches or exceeds 700 characters, you MUST perform "Proportional Narrative Condensing":
    - Priority 1 (Verbatim Preservation): Look at "eventHistory", "promises", and "callState". The nominal sentences in the summary describing these critical turning points (e.g., 고백함, 중상 입음, 계약 체결함) must be preserved VERBATIM. Never summarize or delete them.
    - Priority 2 (Latest Situation): The events from the latest [Conversation Log] must be appended in a highly dense nominal style at the very end of the summary.
    - Priority 3 (Condensing Zone): Intellectually condense only the trivial, older, or minor past descriptions in the middle of the summary into brief, high-density background clauses (e.g., "~한 가벼운 일상이 있었으나").
  - Date Prefix Preservation (CRITICAL): If the card being updated is an "event" type, you MUST preserve the exact date prefix at the very beginning of "summary.full" (e.g., "yyyy. mm. dd | " or "Relative Timeline | ") without changing even a single digit, space, or period.
  - Ensure the entire updated summary is a single, grammatically complete, flowing paragraph ending in nominal style. Never end with an unfinished sentence or trailing dots (…).

=========================================
[METADATA PRESERVATION & UPDATE RULES]
You MUST NOT lose or overwrite the other fields in the JSON. Preserve and update them with extreme care:
- "triggers": Maintain existing keyword patterns, appending new relevant search queries.
- "promises": Maintain active promises. Ensure all entries strictly use the "[인물A ↔ 인물B] 약속 내용" format. If a minor promise is completely resolved or broken, remove it. If it is updated, replace it with the latest status. Distinct promises must all be preserved separately.
- "callState": Strictly preserve and update the honorific/vocative relationship matrix (from→to: title).

=========================================
[MEMORABLE QUOTES (명대사 및 어록 보존 규칙)]
  * When extracting a key narrative event (eventHistory) representing emotional shifts, relationship milestones, or contract execution, always record the most influential and memorable dialogue or inner thoughts representing that event inside the quote object of that event.
    - Dialogue (대사): Use 『 』 bracket quotes. e.g., "speaker": "해리포터", "listener": "론", "text": "『제발 한 번만 내 말 들어줘』"
    - Inner Thoughts (속마음/독백): Use 「 」 bracket quotes. e.g., "speaker": "해리포터", "listener": "self", "text": "「볼드모트에게 절대로 지고 싶지 않음」"
  * CRITICAL JSON SAFETY: Inside any JSON string values, you MUST NEVER use double quotes (") for dialogue or emphasis. Use single quotes (') or bracket-quotes instead to prevent JSON parsing syntax crashes.

Schema:
${SCHEMA_FORMAT}

Existing Lore Database:
{existing_lore}

Conversation Log:
`;

    // ==========================================
    // 로깅, 턴수 및 스냅샷 복원 엔진
    // ==========================================
    // [crack.html 순정 100% 1:1 완전 일치] 10,000턴 원본 메시지 배열 수급기
    async function fetchCrackMessagesPure(targetChatId) {
        const chatId = targetChatId || getChatId();
        if (!chatId || chatId === 'global') return [];

        const token = getCrackAuthToken();
        const headers = { 'accept': 'application/json, text/plain, */*' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let loadedMessages = [];

        // 1단계: crack.html 순정 1순위 (/messages?limit=10000)
        try {
            const res = await fetch(`https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages?limit=10000`, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });
            if (res.ok) {
                const parsedMsgData = await res.json();
                if (Array.isArray(parsedMsgData?.data)) loadedMessages = parsedMsgData.data;
                else if (Array.isArray(parsedMsgData?.data?.messages)) loadedMessages = parsedMsgData.data.messages;
                else if (Array.isArray(parsedMsgData?.messages)) loadedMessages = parsedMsgData.messages;
                else if (Array.isArray(parsedMsgData)) loadedMessages = parsedMsgData;
            }
        } catch (_) {}

        // 2단계: crack.html 순정 2순위 폴백 (/chats/${chatId}?limit=10000)
        if (loadedMessages.length === 0) {
            try {
                const res2 = await fetch(`https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}?limit=10000`, {
                    method: 'GET',
                    headers: headers,
                    credentials: 'include'
                });
                if (res2.ok) {
                    const parsedChatData = await res2.json();
                    if (Array.isArray(parsedChatData?.data?.messages)) loadedMessages = parsedChatData.data.messages;
                    else if (Array.isArray(parsedChatData?.messages)) loadedMessages = parsedChatData.messages;
                }
            } catch (_) {}
        }

        // crack.html 순정 3단계: 과거 1턴부터 순서대로 reverse() 정렬
        if (loadedMessages.length > 0) {
            loadedMessages.reverse();
            return loadedMessages;
        }

        return [];
    }

    function getCrackChatTurns(chatId) {
        const count = document.querySelectorAll('.justify-end, [class*="items-end"], .bg-accent_translucent').length;
        return count || 0;
    }

    function getCrackChatTurns(chatId) {
        const domHistory = [];
        const leaves = document.querySelectorAll('.whitespace-pre-wrap, .break-words, .prose');
        leaves.forEach(l => {
            if (!l.closest('.chat-footer-control') && !l.closest('#ep-chat-right-drawer') && !!l.closest('.justify-end, [class*="items-end"], .bg-accent_translucent')) {
                domHistory.push(l);
            }
        });
        return domHistory.length || 0;
    }

    function recordInjectLog(epId, turn, matched, count, usedChars, budget) {
        try {
            const targetEpId = epId ? String(epId) : 'global';
            const key = `pastel_crack_inject_logs_${targetEpId}`;
            const logs = JSON.parse(localStorage.getItem(key) || '[]');
            const newLog = {
                ts: Date.now(),
                epId: targetEpId,
                turn: turn || getCrackChatTurns(),
                matched: Array.isArray(matched) ? matched : [],
                count: count || 0,
                usedChars: usedChars || 0,
                budget: budget || 2000
            };
            localStorage.setItem(key, JSON.stringify([newLog, ...logs.slice(0, 29)]));
        } catch (_) {}
    }

    function recordExtractLog(epId, turn, count, msgs, status, model, elapsedMs) {
        try {
            const targetEpId = epId ? String(epId) : 'global';
            const key = `pastel_crack_extract_logs_${targetEpId}`;
            const logs = JSON.parse(localStorage.getItem(key) || '[]');
            const newLog = {
                ts: Date.now(),
                epId: targetEpId,
                turn: turn || getCrackChatTurns(),
                count: count || 0,
                msgs: msgs || 0,
                status: status || 'success',
                model: model || 'unknown',
                elapsedMs: elapsedMs || 0
            };
            localStorage.setItem(key, JSON.stringify([newLog, ...logs.slice(0, 29)]));
        } catch (_) {}
    }

    async function createLoreSnapshot(episodeId, typeText) {
        if (!loreDb || !episodeId) return;
        const packName = `Ep_Crack_${episodeId}_Pack`;
        const currentEntries = await loreDb.entries.where('packName').equals(packName).toArray();
        await loreDb.snapshots.add({
            packName: packName,
            timestamp: Date.now(),
            type: typeText,
            data: JSON.stringify(currentEntries)
        });
    }

    async function restoreLoreSnapshot(snapshotId) {
        if (!loreDb) return;
        const snapshot = await loreDb.snapshots.get(snapshotId);
        if (!snapshot) return;

        const packName = snapshot.packName;
        const restoredEntries = JSON.parse(snapshot.data || '[]');

        await loreDb.transaction('rw', loreDb.entries, loreDb.embeddings, async () => {
            await loreDb.entries.where('packName').equals(packName).delete();
            await loreDb.embeddings.where('packName').equals(packName).delete();

            for (const e of restoredEntries) {
                await loreDb.entries.add(e);
            }
        });
    }

    async function executeLoreEmbeddingForEntry(entry) {
        const selectedModel = localStorage.getItem('pastel_crack_lore_embed_model') || 'gemini-embedding-001';
        if (!loreDb) return;

        let embedUrl = "";
        const customEmbedKey = localStorage.getItem('pastel_crack_lore_embed_key') || localStorage.getItem('pastel_api_gemini') || '';
        if (customEmbedKey.trim()) {
            embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:embedContent?key=${customEmbedKey.trim()}`;
        } else {
            embedUrl = getGeminiOrFirebaseEndpoint(selectedModel, 'embedContent');
        }

        if (!embedUrl) return;
        const sumText = entry.summary ? (typeof entry.summary === 'object' ? (entry.summary.full || entry.summary.compact || "") : entry.summary) : "";
        const text = [entry.name, (entry.triggers || []).join(" "), entry.state, sumText].filter(Boolean).join(" ").slice(0, 1000);

        try {
            const res = await fetch(embedUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: { parts: [{ text }] }, taskType: "RETRIEVAL_DOCUMENT" })
            });

            if (!res.ok) return;
            const resData = await res.json();
            const vec = resData.embedding?.values;
            if (vec && Array.isArray(vec)) {
                const payload = { entryId: entry.id, field: "summary", packName: entry.packName, sourceHash: 0, schemaVersion: 2, model: selectedModel, vector: vec, updatedAt: Date.now() };
                const existingEmb = await loreDb.embeddings.where('entryId').equals(entry.id).first();
                if (existingEmb) payload.id = existingEmb.id;
                await loreDb.embeddings.put(payload);
            }
        } catch (_) {}
    }

    async function mergeAndSaveLoreEntry(e, packName, chatId) {
        if (!e || !e.name || !loreDb) return null;
        e = reorderLoreKeys(e);
        const ensureArray = (val) => Array.isArray(val) ? val.filter(x => typeof x === 'string' || typeof x === 'number').map(String) : (typeof val === 'string' && val.trim() ? [val.trim()] : []);

        delete e.id;
        e.summary = C.normalizeSummaryValue(e.summary, e.name, e.state);
        e.entities = ensureArray(e.entities);
        e.promises = ensureArray(e.promises);
        e.triggers = ensureArray(e.triggers);
        e.packName = packName;
        e.project = "";
        e.enabled = false;
        e.source = "auto_extracted";
        e.ts = Date.now();
        e.lastUpdated = e.ts;

        let existing = await loreDb.entries.where('packName').equals(packName).and(x => x.name === e.name).first();
        let targetId = null;

        if (existing) {
            targetId = existing.id;
            if (!existing.anchor) {
                existing.triggers = C.uniq([...existing.triggers || [], ...e.triggers || []]);
                existing.entities = C.uniq([...existing.entities || [], ...e.entities || []]);
                if (Array.isArray(e.promises)) existing.promises = e.promises;
                if (e.embed_text) existing.embed_text = e.embed_text;
                if (e.state !== undefined) existing.state = e.state;
                existing.summary = C.mergeLoreSummary(existing.summary, e.summary, existing.name, e.state || existing.state);
                if (e.callState) existing.callState = { ...existing.callState || {}, ...e.callState };
            }

            if (Array.isArray(e.eventHistory) && e.eventHistory.length > 0) {
                existing.eventHistory = existing.eventHistory || [];
                for (const ev of e.eventHistory) {
                    if (!ev || !ev.summary) continue;
                    const normSum = ev.summary.trim();
                    const matchedEv = existing.eventHistory.find(x => x.summary === normSum);
                    if (matchedEv) {
                        if (!matchedEv.quote && ev.quote) matchedEv.quote = ev.quote;
                        continue;
                    }
                    existing.eventHistory.push({ turn: ev.turn || 0, summary: normSum, quote: ev.quote || undefined, ts: Date.now() });
                }
                existing.eventHistory.sort((a, b) => (a.turn || 0) - (b.turn || 0));
            }

            existing.lastUpdated = Date.now();
            existing = reorderLoreKeys(existing);
            await loreDb.entries.put(existing);
            await loreDb.embeddings.where('entryId').equals(existing.id).delete();
        } else {
            targetId = await loreDb.entries.add(e);
        }

        try {
            const totalCount = await loreDb.entries.where('packName').equals(packName).count();
            await loreDb.packs.put({ name: packName, entryCount: totalCount, project: "" });
            const savedEntry = await loreDb.entries.get(targetId);
            if (savedEntry) await executeLoreEmbeddingForEntry(savedEntry);
        } catch (_) {}

        return targetId;
    }

    /* ==========================================================================
     * 1. 텍스트 → 로어 변환 엔진 (crack.html 100% 일치)
     * ========================================================================== */
    async function convertTextToStructuredLore(rawText, statusEl) {
        const _extT0 = Date.now();
        const chatId = getChatId();
        let selectedModel = localStorage.getItem('pastel_crack_lore_extract_model') || 'gemini-3.6-flash';
        if (selectedModel === '_custom') selectedModel = localStorage.getItem('pastel_crack_lore_extract_custom') || 'gemini-3.6-flash';

        const reasoningValue = localStorage.getItem('pastel_crack_lore_reasoning') || 'medium';
        const thinkingConfig = {};
        if (selectedModel.includes('gemini-3') || selectedModel.includes('gemini-2.0-flash-thinking')) {
            if (reasoningValue !== 'off') {
                if (reasoningValue === 'budget') thinkingConfig.thinkingBudget = parseInt(localStorage.getItem('pastel_crack_lore_reasoning_budget')) || 2048;
                else thinkingConfig.thinkingLevel = reasoningValue;
            }
        }

        const url = getGeminiOrFirebaseEndpoint(selectedModel, 'generateContent');
        if (!url) throw new Error("우측 서랍의 [API 설정]에 Gemini API Key 또는 Firebase Script를 입력해 주십시오.");

        if (loreDb && chatId) {
            try { await createLoreSnapshot(chatId, "텍스트 변환 전 백업"); } catch(_) {}
        }

        const chunks = [];
        const CHUNK_SIZE = 15000;
        for (let i = 0; i < rawText.length; i += CHUNK_SIZE) chunks.push(rawText.slice(i, i + CHUNK_SIZE));

        let accumulatedLore = [];
        let importedCount = 0;
        const packName = `Ep_Crack_${chatId}_Pack`;

        for (let ci = 0; ci < chunks.length; ci++) {
            if (statusEl) statusEl.textContent = `텍스트 변환 중... (청크 ${ci+1}/${chunks.length})`;
            const customInst = localStorage.getItem(`pastel_crack_lore_auto_ext_instruction_ep_${chatId}`) || '';
            const customBlock = customInst.trim() ? `\n\n[USER DIRECTIVES - EXTRACTION GUIDELINES (MANDATORY)]:\n- ${customInst.trim()}` : '';
            const finalPrompt = PROMPT_TEMPLATE_TEXT.replace('{existing_lore}', JSON.stringify(accumulatedLore, null, 2)) + chunks[ci] + customBlock;

            const body = {
                contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
                generationConfig: Object.keys(thinkingConfig).length > 0 ? { thinkingConfig, responseMimeType: "application/json" } : { responseMimeType: "application/json" },
                safetySettings: getSafetySettingsPayload()
            };

            const appCheckToken = await getAppCheckToken();
            if (!appCheckToken) {
                throw new Error("App Check 토큰 획득 실패. 콘솔을 확인해 주십시오.");
            }

            const headers = { 
                "Content-Type": "application/json",
                "X-Firebase-AppCheck": appCheckToken
            };

            const abortCtrl = new AbortController();
            const fetchTimeout = setTimeout(() => abortCtrl.abort(), 480000); // 8분(480초) 완벽 무제한급 대기

            let res;
            try {
                res = await fetch(url, { 
                    method: "POST", 
                    headers: headers, 
                    body: JSON.stringify(body),
                    signal: abortCtrl.signal 
                });
            } catch (fetchErr) {
                if (fetchErr.name === 'AbortError') throw new Error("재생성 구간 응답 시간 초과(8분). AI 연산량이 많아 잠시 후 다시 시도해 주십시오.");
                throw fetchErr;
            } finally {
                clearTimeout(fetchTimeout);
            }

            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`API 통신 실패 (HTTP ${res.status}): ${errBody.slice(0, 150)}`);
            }
            const resData = await res.json();

            const rawJsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (!rawJsonText.trim()) throw new Error("AI가 로어 데이터를 반환하지 않았습니다.");
            let raw = rawJsonText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim().replace(/,(\s*[\]\}])/g, "$1");
            const fb = raw.indexOf("["), fc = raw.indexOf("{"), first = fb === -1 ? fc : fc === -1 ? fb : Math.min(fb, fc);
            if (first > 0) raw = raw.slice(first);
            const lastB = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
            if (lastB !== -1 && lastB < raw.length - 1) raw = raw.slice(0, lastB + 1);

            const parsedArray = JSON.parse(raw);
            if (Array.isArray(parsedArray)) accumulatedLore = parsedArray;
        }

        const currentTurn = getCrackChatTurns();

        if (Array.isArray(accumulatedLore) && accumulatedLore.length > 0) {
            for (let e of accumulatedLore) {
                const tid = await mergeAndSaveLoreEntry(e, packName, chatId);
                if (tid) importedCount++;
            }
            recordExtractLog(chatId, currentTurn, importedCount, chunks.length, 'success', selectedModel, Date.now() - _extT0);
        } else {
            recordExtractLog(chatId, currentTurn, 0, chunks.length, 'failed', selectedModel, Date.now() - _extT0);
        }
        return importedCount;
    }

    async function executeTextConversion() {
        const ta = document.getElementById('ep-lore-text-textarea');
        const btn = document.getElementById('ep-lore-text-btn');
        const st = document.getElementById('ep-lore-text-status');
        if (!ta || !btn || !st) return;

        const text = ta.value.trim();
        if (!text) return alert("변환할 텍스트를 입력해 주십시오.");

        btn.disabled = true; btn.textContent = "변환 중...";
        st.textContent = "로어 가공 시작..."; st.style.color = "#74a1c0";

        try {
            const cnt = await convertTextToStructuredLore(text, st);
            st.textContent = `✅ 성공: ${cnt}개의 로어가 저장소에 병합되었습니다.`;
            st.style.color = "#88b9c8";
            ta.value = '';
            renderCrackActiveLores();
        } catch (err) {
            st.textContent = "❌ 실패: " + err.message; st.style.color = "#da8";
        } finally {
            btn.disabled = false; btn.textContent = "텍스트 지식 변환 실행";
        }
    }

    /* ==========================================================================
     * 2. 수동 로어 생성 엔진 (crack.html 100% 일치)
     * ========================================================================== */
    async function executeManualLoreExtraction(episodeId, turns) {
        const _manT0 = Date.now();
        let selectedModel = localStorage.getItem('pastel_crack_lore_extract_model') || 'gemini-3.6-flash';
        if (selectedModel === '_custom') selectedModel = localStorage.getItem('pastel_crack_lore_extract_custom') || 'gemini-3.6-flash';

        const reasoningValue = localStorage.getItem('pastel_crack_lore_reasoning') || 'medium';
        const thinkingConfig = {};
        if (selectedModel.includes('gemini-3') || selectedModel.includes('gemini-2.0-flash-thinking')) {
            if (reasoningValue !== 'off') {
                if (reasoningValue === 'budget') thinkingConfig.thinkingBudget = parseInt(localStorage.getItem('pastel_crack_lore_reasoning_budget')) || 2048;
                else thinkingConfig.thinkingLevel = reasoningValue;
            }
        }

        const url = getGeminiOrFirebaseEndpoint(selectedModel, 'generateContent');
        if (!url) throw new Error("우측 서랍의 [API 설정]에 Gemini API Key 또는 Firebase Script를 입력해 주십시오.");

        const history = await fetchCrackMessagesPure(episodeId);
        if (!history || history.length < 2) throw new Error("분석할 대화 이력이 부족합니다.");

        const targetMessagesCount = turns * 2;
        const targetList = history.slice(-targetMessagesCount);
        const context = targetList.map(m => {
            const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'assistant';
            const cleanText = stripLoreInjectionBlock(m.content || m.message || m.text || '');
            return `${role}: ${cleanText}`;
        }).join("\n");

        const packName = `Ep_Crack_${episodeId}_Pack`;
        let entriesText = "[]";
        if (loreDb) {
            try {
                const existingEntries = await loreDb.entries.where('packName').equals(packName).toArray();
                if (existingEntries.length > 0) {
                    entriesText = JSON.stringify(existingEntries.slice(0, 20).map(e => {
                        const cloned = { ...e };
                        delete cloned.id; delete cloned.packName; delete cloned.project;
                        return cloned;
                    }), null, 2);
                }
            } catch (_) {}
        }

        const customInst = localStorage.getItem(`pastel_crack_lore_auto_ext_instruction_ep_${episodeId}`) || '';
        const customBlock = customInst.trim() ? `\n\n[USER DIRECTIVES - EXTRACTION GUIDELINES (MANDATORY)]:\n- ${customInst.trim()}` : '';
        const finalPrompt = PROMPT_TEMPLATE_CHAT.replace('{existing_lore}', entriesText) + context + customBlock;

        const body = {
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: Object.keys(thinkingConfig).length > 0 ? { thinkingConfig, responseMimeType: "application/json" } : { responseMimeType: "application/json" },
            safetySettings: getSafetySettingsPayload()
        };

        const appCheckToken = await getAppCheckToken();
        const headers = { "Content-Type": "application/json" };
        if (appCheckToken) {
            headers["X-Firebase-AppCheck"] = appCheckToken;
        }

        const abortCtrl = new AbortController();
        const fetchTimeout = setTimeout(() => abortCtrl.abort(), 480000); // 8분(480초) 완벽 무제한급 대기

        let res;
        try {
            res = await fetch(url, { 
                method: "POST", 
                headers: headers, 
                body: JSON.stringify(body),
                signal: abortCtrl.signal
            });
        } catch (fetchErr) {
            if (fetchErr.name === 'AbortError') {
                throw new Error("AI 응답 시간 초과(8분). 다시 시도해 주십시오.");
            }
            throw fetchErr;
        } finally {
            clearTimeout(fetchTimeout);
        }

        if (!res.ok) throw new Error(`API 통신 실패 (HTTP ${res.status})`);
        const resData = await res.json();

        const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!rawText.trim()) throw new Error("AI가 로어 데이터를 반환하지 않았습니다.");
        let raw = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim().replace(/,(\s*[\]\}])/g, "$1");
        const fb = raw.indexOf("["), fc = raw.indexOf("{"), first = fb === -1 ? fc : fc === -1 ? fb : Math.min(fb, fc);
        if (first > 0) raw = raw.slice(first);
        const lastB = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
        if (lastB !== -1 && lastB < raw.length - 1) raw = raw.slice(0, lastB + 1);

        let parsedArray = JSON.parse(raw);
        if (parsedArray && !Array.isArray(parsedArray)) {
            if (Array.isArray(parsedArray.entries)) parsedArray = parsedArray.entries;
            else if (Array.isArray(parsedArray.lore)) parsedArray = parsedArray.lore;
            else if (parsedArray.name) parsedArray = [parsedArray];
            else parsedArray = [];
        }

        const currentTurn = getCrackChatTurns();

        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
            try { await createLoreSnapshot(episodeId, "수동 생성 전 백업"); } catch(_) {}
            for (const e of parsedArray) {
                await mergeAndSaveLoreEntry(e, packName, episodeId);
            }
            recordExtractLog(episodeId, currentTurn, parsedArray.length, targetList.length, 'success', selectedModel, Date.now() - _manT0);
            renderCrackActiveLores();
            return parsedArray.length;
        } else {
            recordExtractLog(episodeId, currentTurn, 0, targetList.length, 'failed', selectedModel, Date.now() - _manT0);
            return 0;
        }
    }

    /* ==========================================================================
     * 3. 백그라운드 자동 로어 추출 엔진 (crack.html 100% 일치)
     * ========================================================================== */
    async function executeBackgroundAutoExtraction(episodeId) {
        const _autoT0 = Date.now();
        let selectedModel = localStorage.getItem('pastel_crack_lore_extract_model') || 'gemini-3.6-flash';
        if (selectedModel === '_custom') selectedModel = localStorage.getItem('pastel_crack_lore_extract_custom') || 'gemini-3.6-flash';

        const reasoningValue = localStorage.getItem('pastel_crack_lore_reasoning') || 'medium';
        const thinkingConfig = {};
        if (selectedModel.includes('gemini-3') || selectedModel.includes('gemini-2.0-flash-thinking')) {
            if (reasoningValue !== 'off') {
                if (reasoningValue === 'budget') thinkingConfig.thinkingBudget = parseInt(localStorage.getItem('pastel_crack_lore_reasoning_budget')) || 2048;
                else thinkingConfig.thinkingLevel = reasoningValue;
            }
        }

        const url = getGeminiOrFirebaseEndpoint(selectedModel, 'generateContent');
        if (!url) return;

        const history = await fetchCrackMessagesPure(episodeId);
        if (!history || history.length < 2) return;

        const extTurns = parseInt(localStorage.getItem(`pastel_crack_lore_auto_ext_turns_ep_${episodeId}`), 10) || 6;
        const targetList = history.slice(-(extTurns * 2));
        const context = targetList.map(m => {
            const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'assistant';
            const cleanText = stripLoreInjectionBlock(m.content || m.message || m.text || '');
            return `${role}: ${cleanText}`;
        }).join("\n");

        const packName = `Ep_Crack_${episodeId}_Pack`;
        let entriesText = "[]";
        if (loreDb) {
            try {
                const existingEntries = await loreDb.entries.where('packName').equals(packName).toArray();
                if (existingEntries.length > 0) {
                    entriesText = JSON.stringify(existingEntries.slice(0, 20).map(e => {
                        const cloned = { ...e };
                        delete cloned.id; delete cloned.packName; delete cloned.project;
                        return cloned;
                    }), null, 2);
                }
            } catch (_) {}
        }

        const customInst = localStorage.getItem(`pastel_crack_lore_auto_ext_instruction_ep_${episodeId}`) || '';
        const customBlock = customInst.trim() ? `\n\n[USER DIRECTIVES - EXTRACTION GUIDELINES (MANDATORY)]:\n- ${customInst.trim()}` : '';
        const finalPrompt = PROMPT_TEMPLATE_CHAT.replace('{existing_lore}', entriesText) + context + customBlock;

        const body = {
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: Object.keys(thinkingConfig).length > 0 ? { thinkingConfig, responseMimeType: "application/json" } : { responseMimeType: "application/json" },
            safetySettings: getSafetySettingsPayload()
        };

        try {
            const appCheckToken = await getAppCheckToken();
            if (!appCheckToken) return;

            const headers = { 
                "Content-Type": "application/json",
                "X-Firebase-AppCheck": appCheckToken
            };

            const abortCtrl = new AbortController();
            const fetchTimeout = setTimeout(() => abortCtrl.abort(), 480000); // 8분(480초) 완벽 무제한급 대기

            let res;
            try {
                res = await fetch(url, { 
                    method: "POST", 
                    headers: headers, 
                    body: JSON.stringify(body),
                    signal: abortCtrl.signal 
                });
            } finally {
                clearTimeout(fetchTimeout);
            }

            if (!res.ok) return;
            const resData = await res.json();

            const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (!rawText.trim()) return;

            let raw = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim().replace(/,(\s*[\]\}])/g, "$1");
            const fb = raw.indexOf("["), fc = raw.indexOf("{"), first = fb === -1 ? fc : fc === -1 ? fb : Math.min(fb, fc);
            if (first > 0) raw = raw.slice(first);
            const lastB = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
            if (lastB !== -1 && lastB < raw.length - 1) raw = raw.slice(0, lastB + 1);

            let parsedArray = JSON.parse(raw);
            if (parsedArray && !Array.isArray(parsedArray)) {
                if (Array.isArray(parsedArray.entries)) parsedArray = parsedArray.entries;
                else if (Array.isArray(parsedArray.lore)) parsedArray = parsedArray.lore;
                else if (parsedArray.name) parsedArray = [parsedArray];
                else parsedArray = [];
            }

            const currentTurn = getCrackChatTurns();

            if (Array.isArray(parsedArray) && parsedArray.length > 0) {
                try { await createLoreSnapshot(episodeId, "자동 추출 전 백업"); } catch(_) {}
                for (const e of parsedArray) await mergeAndSaveLoreEntry(e, packName, episodeId);
                recordExtractLog(episodeId, currentTurn, parsedArray.length, targetList.length, 'success', selectedModel, Date.now() - _autoT0);
            } else {
                recordExtractLog(episodeId, currentTurn, 0, targetList.length, 'failed', selectedModel, Date.now() - _autoT0);
            }
        } catch (err) {
            const currentTurn = getCrackChatTurns();
            recordExtractLog(episodeId, currentTurn, 0, 12, 'failed', selectedModel, Date.now() - _autoT0);
        }
    }

    /* ==========================================================================
     * 4. 슬라이딩 전체 로어 재생성 엔진 (crack.html 100% 일치)
     * ========================================================================== */
    async function executeLoreExtractionAPIOnly(episodeId, contextText, chunkTurn = 0) {
        const _regenT0 = Date.now();
        let selectedModel = localStorage.getItem('pastel_crack_lore_extract_model') || 'gemini-3.6-flash';
        if (selectedModel === '_custom') selectedModel = localStorage.getItem('pastel_crack_lore_extract_custom') || 'gemini-3.6-flash';

        const reasoningValue = localStorage.getItem('pastel_crack_lore_reasoning') || 'medium';
        const thinkingConfig = {};
        if (selectedModel.includes('gemini-3') || selectedModel.includes('gemini-2.0-flash-thinking')) {
            if (reasoningValue !== 'off') {
                if (reasoningValue === 'budget') thinkingConfig.thinkingBudget = parseInt(localStorage.getItem('pastel_crack_lore_reasoning_budget')) || 2048;
                else thinkingConfig.thinkingLevel = reasoningValue;
            }
        }

        const url = getGeminiOrFirebaseEndpoint(selectedModel, 'generateContent');
        if (!url) throw new Error("우측 서랍의 [API 설정]에 Gemini API Key 또는 Firebase Script를 입력해 주십시오.");

        const packName = `Ep_Crack_${episodeId}_Pack`;
        let entriesText = "[]";
        if (loreDb) {
            try {
                const existingEntries = await loreDb.entries.where('packName').equals(packName).toArray();
                if (existingEntries.length > 0) {
                    entriesText = JSON.stringify(existingEntries.slice(0, 20).map(e => {
                        const cloned = { ...e };
                        delete cloned.id; delete cloned.packName; delete cloned.project;
                        return cloned;
                    }), null, 2);
                }
            } catch (_) {}
        }

        const customInst = localStorage.getItem(`pastel_crack_lore_auto_ext_instruction_ep_${episodeId}`) || '';
        const customBlock = customInst.trim() ? `\n\n[USER DIRECTIVES - EXTRACTION GUIDELINES (MANDATORY)]:\n- ${customInst.trim()}` : '';
        const finalPrompt = PROMPT_TEMPLATE_CHAT.replace('{existing_lore}', entriesText) + contextText + customBlock;

        const body = {
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: Object.keys(thinkingConfig).length > 0 ? { thinkingConfig, responseMimeType: "application/json" } : { responseMimeType: "application/json" },
            safetySettings: getSafetySettingsPayload()
        };

        const appCheckToken = await getAppCheckToken();
        if (!appCheckToken) {
            throw new Error("App Check 토큰 획득 실패. 콘솔을 확인해 주십시오.");
        }

        const headers = { 
            "Content-Type": "application/json",
            "X-Firebase-AppCheck": appCheckToken
        };

        const abortCtrl = new AbortController();
        const fetchTimeout = setTimeout(() => abortCtrl.abort(), 480000); // 8분(480초) 완벽 무제한급 대기

        let res;
        try {
            res = await fetch(url, { 
                method: "POST", 
                headers: headers, 
                body: JSON.stringify(body),
                signal: abortCtrl.signal 
            });
        } catch (fetchErr) {
            if (fetchErr.name === 'AbortError') throw new Error("재생성 구간 응답 시간 초과(8분). AI 연산량이 많아 잠시 후 다시 시도해 주십시오.");
            throw fetchErr;
        } finally {
            clearTimeout(fetchTimeout);
        }

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`API 통신 실패 (HTTP ${res.status}): ${errBody.slice(0, 150)}`);
        }
        const resData = await res.json();

        const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!rawText.trim()) return;

        let raw = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim().replace(/,(\s*[\]\}])/g, "$1");
        const fb = raw.indexOf("["), fc = raw.indexOf("{"), first = fb === -1 ? fc : fc === -1 ? fb : Math.min(fb, fc);
        if (first > 0) raw = raw.slice(first);
        const lastB = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
        if (lastB !== -1 && lastB < raw.length - 1) raw = raw.slice(0, lastB + 1);

        let parsedArray = JSON.parse(raw);
        if (parsedArray && !Array.isArray(parsedArray)) {
            if (Array.isArray(parsedArray.entries)) parsedArray = parsedArray.entries;
            else if (Array.isArray(parsedArray.lore)) parsedArray = parsedArray.lore;
            else if (parsedArray.name) parsedArray = [parsedArray];
            else parsedArray = [];
        }

        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
            for (const e of parsedArray) await mergeAndSaveLoreEntry(e, packName, episodeId);
            recordExtractLog(episodeId, chunkTurn, parsedArray.length, 16, 'success', selectedModel, Date.now() - _regenT0);
        } else {
            recordExtractLog(episodeId, chunkTurn, 0, 16, 'failed', selectedModel, Date.now() - _regenT0);
        }
    }

    async function executeLoreRegeneration(episodeId) {
        const btn = document.getElementById('ep-lore-regenerate-btn');
        const st = document.getElementById('ep-lore-regenerate-status');
        if (!confirm("현재 방의 로컬 로어들을 완전히 포맷하고, 대화의 처음부터 끝까지 순차 분석하여 전체 재생성하시겠습니까?")) return;

        if (btn) { btn.disabled = true; btn.textContent = "재생성 진행 중..."; }
        if (st) { st.textContent = "초기화 및 분석 시작..."; st.style.color = "#74a1c0"; }

        const packName = `Ep_Crack_${episodeId}_Pack`;

        try {
            try { await createLoreSnapshot(episodeId, "전체 재생성 전 백업"); } catch(_) {}
            showLoreExtPersistentToast("🔮 로어 초기화 및 재생성 준비 중...");
            await loreDb.entries.where('packName').equals(packName).delete();
            await loreDb.embeddings.where('packName').equals(packName).delete();

            showLoreExtPersistentToast("📥 1턴부터 전체 대화 내역 수급 중...");
            const history = await fetchCrackMessagesPure(episodeId);
            if (!history || history.length === 0) throw new Error("대화 내용이 존재하지 않습니다.");
            console.log(`[PASTEL:재생성] crack.html 순정 API로부터 총 ${history.length}개의 메시지를 전수 수급 완료했습니다.`);

            const extTurns = parseInt(localStorage.getItem(`pastel_crack_lore_auto_ext_turns_ep_${episodeId}`), 10) || 6;
            const step = extTurns * 2;
            const total = history.length;
            const totalSteps = Math.ceil(total / step);
            let stepsRun = 0;

            for (let i = 0; i < total; i += step) {
                const slice = history.slice(0, i + step);
                if (slice.length < 2) continue;
                const windowSlice = slice.slice(-(step + 4));
                const contextText = windowSlice.map(m => {
                    const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'assistant';
                    const cleanText = stripLoreInjectionBlock(m.content || m.message || m.text || '');
                    return `${role}: ${cleanText}`;
                }).join("\n");

                const progressPercent = Math.min(100, Math.round(((stepsRun + 1) / totalSteps) * 100));
                showLoreExtPersistentToast(`🔮 전체 로어 재생성 중...(${progressPercent}%)`);
                if (st) st.textContent = `재생성 스캔 중 (${stepsRun + 1}/${totalSteps} 단계)... (${progressPercent}%)`;

                const chunkTurn = slice.filter(m => (m.role === 'user' || m.type === 'user')).length;
                await executeLoreExtractionAPIOnly(episodeId, contextText, chunkTurn);
                stepsRun++;
            }

            const totalCount = await loreDb.entries.where('packName').equals(packName).count();
            if (st) { st.textContent = `✅ 성공: 총 ${totalCount}개의 로어가 재생성되었습니다.`; st.style.color = "#88b9c8"; }
            renderCrackActiveLores();
            showToast("✨ 전체 로어 재생성이 완수되었습니다!");
        } catch (err) {
            if (st) { st.textContent = "❌ 실패: " + err.message; st.style.color = "#da8"; }
            showToast("❌ 로어 재생성 실패");
        } finally {
            hideLoreExtPersistentToast();
            if (btn) { btn.disabled = false; btn.textContent = "초기화 및 전체 로어 재생성"; }
        }
    }

    /* ==========================================================================
     * 5. 수동 로어 병합 & 프리뷰 엔진 (crack.html 100% 순정 프롬프트 탑재)
     * ========================================================================== */
    async function runDuplicateMergerSearch() {
        const mergeBtn = document.getElementById('ep-lore-merge-find-btn');
        const statusEl = document.getElementById('ep-lore-merge-status');
        const maxCharsInput = document.getElementById('ep-lore-merge-maxchars');
        const bulkModeSelect = document.getElementById('ep-lore-merge-bulk-mode');

        if (!maxCharsInput || !bulkModeSelect) return alert("병합 설정 엘리먼트를 찾을 수 없습니다.");

        const maxChars = parseInt(maxCharsInput.value) || 1200;
        const chatId = getChatId();
        const packName = `Ep_Crack_${chatId}_Pack`;

        const checkedBoxes = Array.from(document.querySelectorAll('.ep-crack-merge-chk:checked'));
        if (checkedBoxes.length < 2) return alert("병합할 로어 항목을 최소 2개 이상 선택해 주십시오.");

        const selectedIds = checkedBoxes.map(cb => parseInt(cb.dataset.id, 10));
        const selectedEntries = await loreDb.entries.where('id').anyOf(selectedIds).toArray();

        const anchored = selectedEntries.find(e => e.anchor === true);
        const targetMaster = anchored || selectedEntries[0];
        const toDelete = selectedEntries.filter(e => e.id !== targetMaster.id);

        let previewCard = document.getElementById('ep-lore-preview-container');
        if (previewCard) previewCard.remove();

        if (mergeBtn) { mergeBtn.disabled = true; mergeBtn.textContent = "프리뷰 연산 중..."; }
        if (statusEl) { statusEl.textContent = "병합 결과 조합 연산 중..."; statusEl.style.color = "#74a1c0"; }

        try {
            let mergedDraft = null;
            const mode = bulkModeSelect ? bulkModeSelect.value : 'keep-longest';

            if (mode === 'keep-longest') {
                const sorted = [...selectedEntries].sort((a, b) => {
                    const aSum = a.summary ? (typeof a.summary === 'object' ? (a.summary.full || '') : String(a.summary)) : '';
                    const bSum = b.summary ? (typeof b.summary === 'object' ? (b.summary.full || '') : String(b.summary)) : '';
                    return bSum.length - aSum.length;
                });
                const longestEntry = sorted[0];
                const base = JSON.parse(JSON.stringify(longestEntry));
                let mergedTriggers = [...base.triggers || []];
                let mergedEntities = [...base.entities || []];

                selectedEntries.forEach(e => {
                    if (e.id === longestEntry.id) return;
                    mergedTriggers.push(...e.triggers || []);
                    mergedEntities.push(...e.entities || []);
                });

                base.triggers = Array.from(new Set(mergedTriggers)).slice(0, 15);
                base.entities = Array.from(new Set(mergedEntities));
                base.summary = C.normalizeSummaryValue(base.summary, base.name, base.state);
                base.summary.full = C.clampText(base.summary.full, maxChars);
                mergedDraft = base;
            } else {
                const cleanList = selectedEntries.map(({ id, packName, project, enabled, ...rest }) => rest);
                const customInstruction = localStorage.getItem(`pastel_crack_lore_auto_ext_instruction_ep_${chatId}`) || '';
                const customBlock = customInstruction.trim() ? `\n\n[USER DIRECTIVES - ADDITIONAL GUIDELINES (MANDATORY)]:\n- ${customInstruction.trim()}` : '';

                const prompt = `아래 제공된 중복 로어 조각 리스트를 읽고, 중복된 개념들을 완벽히 단일화한 하나의 초정밀 병합 로어로 요약 가공하여 JSON 객체로만 출력하시오.

[작명 및 정합성 지침 (Name Synthesis Rule)]:
1. 관계(relationship) 타입 병합 지침 (CRITICAL/MANDATORY):
   - 만약 병합 대상이 'relationship' 타입이라면, "name"은 반드시 '인물A ↔ 인물B' 형식(가운데 대칭 화살표 기호 '↔' 필수, 이름 순서는 가나다순/알파벳순 정렬)을 엄격히 고수하십시오. (예: "강하늘 ↔ 김도훈"). 절대로 일반 서술형 제목(예: "두 사람의 우정", "동맹 관계")으로 이름을 변경하거나 새로 짓지 마십시오.
2. 일반 타입 병합 지침:
   - 일반 타입(character, location, item, event, concept, setting, promise 등)의 경우, 병합 대상 중 가장 완성도가 높고 구체적이며 온전한 이름(예: 'Harry' 대신 'Harry Potter')을 그대로 "name"으로 채택하십시오. 임의로 전혀 새로운 명칭이나 제3의 설명조 단어를 지어내지 마십시오.

[약속 병합 및 상태 지침 (Promise Merging & Status Rule)]:
1. 인물/관계 카드 내의 "promises" 배열 병합 지침:
   - 병합 대상 카드들의 모든 "promises" 필드를 수합하십시오.
   - 만약 동일한 주체(예: [인물A ↔ 인물B]) 간에 체결된 약속 중 중복/대치되거나 갱신된 내역이 감지되면, 무조건 가장 최근 정보의 값만 보존하고 과거의 중복 약속 문자열은 삭제하십시오.
   - 주체가 다르거나 서로 다른 독립된 약속들은 누락 없이 각각의 고유 스트링 형태로 보존하여 배열에 모두 남겨놓아야 합니다. (배열 내부 포맷은 무조건 "[인물A ↔ 인물B] 약속 행동" 형식을 엄격히 고수해야 합니다.)
2. 대형 독립 약속(type: "promise") 카드 병합 지침:
   - 대형 약속 카드를 병합할 때, "summary.full" 맨 처음에 표시되는 접두사인 "[진행 상황: <상태>] " 값을 완벽히 보존하십시오. 
   - 상태값(<상태>)은 병합 대상 카드들의 상태 중 가장 최근/최신의 실질적 상황을 고려하여 AI가 상황에 맞춰 동적으로 판단하여 기입하십시오 (예: [진행 상황: 완료], [진행 상황: 진행중] 등).

[트리거 보존 지침 (Trigger Keyword Rule)]:
- "triggers": 병합 대상인 모든 로어 카드들의 기존 트리거 단어들을 단 하나도 누락시키지 말고 전부 개별 스트링(Array element)으로 그대로 보존하여 합치십시오. 절대로 여러 키워드를 하나의 긴 문자열로 뭉개거나 합치지 마십시오.

[요약 고도화 지침 (Rich Summary Rule)]:
- "summary.full": 줄거리 요약은 엄격하게 최대 700자 이하로 압축하여 작성하되, 절대로 기존 줄거리 정보들을 대충 생략하거나 요약해서 날려버리지 마십시오. 병합 대상 카드들이 가진 모든 역사적 사실, 관계 이정표, 주요 상태 등을 꼼꼼하게 전부 누적하여 디테일하고 풍부한 내용의 완성된 문단으로 기술하십시오.
- Date/Period Merging (For "event" type cards): If the cards being merged are of type "event", handle dates in "summary.full" as follows:
  * Same/Single Date: If all merged events occurred on the exact same date, prepend the date at the very beginning: "yyyy. mm. dd | 사건 내용" (Example: "2025. 10. 15 | 해리와 론이 만나 다툼.")
  * Different Dates: If merged events occurred on different dates, format as a single-line sequence without newlines, separating each dated event with ' | ': "<yyyy. mm. dd> 사건 내용 | <yyyy. mm. dd> 사건 내용"
  * Unknown Date: Use "Relative Timeline | 사건 내용" or "<상대적 시점> 사건 내용 | <상대적 시점> 사건 내용"

[사건 및 대사 병합 규칙 (Event History & Quote Merging Rule)]:
- "eventHistory": 병합 대상 카드들이 가진 모든 사건 기록을 연대순으로 정밀 통합하십시오. 중복되는 사건은 제거하되, 해당 사건의 "quote"가 있을 경우 절대 유실하지 말고 온전히 병합 보존하여 최종 JSON에 출력해야 합니다.

[TOKEN-SAVING & STYLE CONSTRAINT (명사형 개조식 필수)]:
- EXCLUSION: Only the "text" field inside the "quote" array is allowed to use natural, colloquial speech (e.g. "Briefly 『...』", "「...」").
- MANDATORY STYLE: ALL other text fields—including "summary.full", "summary.compact", "summary.micro", "state" fields—MUST be written in Korean using concise nominal/noun-ending styles (개조식 종결어미: e.g., "~함", "~임", "~음", "~했음", or noun form).
- NEVER use polite, formal, or plain prose endings (e.g., "~합니다", "~이다", "~했다" 등 평서문/설명조 문체 영구 금지).

[summary.full BUDGET]:
- "summary.full" 줄거리 요약은 설정된 최대 700자 이하를 꽉 채워 최대한 구체적으로 작성하십시오.

[출력 규칙]:
- Markdown 백틱(\`\`\`) 기호 없이 단일 JSON 오브젝트 구조 { ... } 로만 출력하시오.

병합 대상 데이터:
${JSON.stringify(cleanList, null, 2)}${customBlock}`;

                let selectedModel = localStorage.getItem('pastel_crack_lore_extract_model') || 'gemini-3.6-flash';
                if (selectedModel === '_custom') selectedModel = localStorage.getItem('pastel_crack_lore_extract_custom') || 'gemini-3.6-flash';

                const url = getGeminiOrFirebaseEndpoint(selectedModel, 'generateContent');
                if (!url) throw new Error("우측 서랍의 [API 설정]에 Gemini API Key 또는 Firebase Script를 입력해 주십시오.");

                const appCheckToken = await getAppCheckToken();
                if (!appCheckToken) {
                    throw new Error("App Check 토큰 획득 실패. 콘솔을 확인해 주십시오.");
                }

                const headers = { 
                    "Content-Type": "application/json",
                    "X-Firebase-AppCheck": appCheckToken
                };

                const abortCtrl = new AbortController();
                const fetchTimeout = setTimeout(() => abortCtrl.abort(), 480000); // 8분(480초) 완벽 무제한급 대기

                let res;
                try {
                    res = await fetch(url, {
                        method: "POST", 
                        headers: headers,
                        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
                        signal: abortCtrl.signal
                    });
                } catch (fetchErr) {
                    if (fetchErr.name === 'AbortError') throw new Error("병합 요약 응답 시간 초과(8분). AI 연산량이 많아 잠시 후 다시 시도해 주십시오.");
                    throw fetchErr;
                } finally {
                    clearTimeout(fetchTimeout);
                }

                if (!res.ok) {
                    const errBody = await res.text();
                    throw new Error(`AI 병합 통신 실패 (HTTP ${res.status}): ${errBody.slice(0, 150)}`);
                }
                const resData = await res.json();

                let txt = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                let raw = txt.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim().replace(/,(\s*[\]\}])/g, "$1");
                const parsedObj = JSON.parse(raw);
                mergedDraft = { ...JSON.parse(JSON.stringify(targetMaster)), ...parsedObj };
            }

            previewCard = document.createElement('div');
            previewCard.id = 'ep-lore-preview-container';
            previewCard.style.cssText = "display:flex; flex-direction:column; align-items:stretch; width:100%; border-top:1.5px dashed var(--decentral-text-border); padding-top:14px; margin-top:14px; box-sizing:border-box;";

            const previewHeader = document.createElement('div');
            previewHeader.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--decentral-border); padding-bottom:6px; margin-bottom:12px; width:100%; user-select:none;";
            
            const previewTitle = document.createElement('span');
            previewTitle.textContent = "병합 프리뷰";
            previewTitle.style.cssText = "font-size:13px; color:#74a1c0; font-weight:bold;";

            const finalExecuteBtn = document.createElement('button');
            finalExecuteBtn.type = "button";
            finalExecuteBtn.title = "선택한 로어 병합 최종 실행";
            finalExecuteBtn.style.cssText = "background:transparent; border:none; color:#74a1c0; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:4px;";
            finalExecuteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 12v2a2 2 0 0 1-2 2H9a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h0"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-5a2 2 0 0 0-2 2v2"/></svg>
            `;

            previewHeader.appendChild(previewTitle);
            previewHeader.appendChild(finalExecuteBtn);
            previewCard.appendChild(previewHeader);

            const previewBody = document.createElement('div');
            previewBody.style.cssText = "text-align:left; width:100%; box-sizing:border-box;";

            let previewCode = { ...mergedDraft };
            delete previewCode.id; delete previewCode.packName; delete previewCode.project; delete previewCode.enabled;
            previewCode = reorderLoreKeys(previewCode);

            previewBody.innerHTML = `
                <textarea id="ep-lore-preview-textarea" class="decentral-text-area" 
                    style="height:220px; font-size:11px; line-height:1.5; border-radius:8px; border:1px solid #cccccc; background:#ffffff; color:#2c3e50; resize:none; width:100%; box-sizing:border-box; outline:none;"
                >${JSON.stringify(previewCode, null, 2)}</textarea>
            `;
            previewCard.appendChild(previewBody);

            document.getElementById('ep-lore-checklist-container').after(previewCard);

            if (statusEl) {
                statusEl.textContent = "✅ 프리뷰 수정을 거친 후, 우상단 아이콘을 눌러 병합 완료하십시오.";
                statusEl.style.color = "#88b9c8";
            }

            finalExecuteBtn.onclick = async () => {
                const editedText = document.getElementById('ep-lore-preview-textarea').value.trim();
                let finalMergedDraft = null;
                try {
                    finalMergedDraft = JSON.parse(editedText);
                } catch (jsonErr) {
                    return alert("JSON 문법 오류: " + jsonErr.message);
                }

                if (!confirm(`선택한 지식 조각 ${selectedEntries.length}개를 완전히 병합하시겠습니까?`)) return;

                try {
                    const finalEntry = { ...finalMergedDraft, id: targetMaster.id, packName: packName, project: "" };
                    await loreDb.entries.put(finalEntry);
                    await loreDb.embeddings.where('entryId').equals(targetMaster.id).delete();
                    await loreDb.entries.where('id').anyOf(toDelete.map(d => d.id)).delete();
                    await loreDb.embeddings.where('entryId').anyOf(toDelete.map(d => d.id)).delete();

                    showToast("✨ 수동 로어 병합 완료!");
                    previewCard.remove();
                    renderCrackActiveLores();
                    renderCrackManageTab();
                } catch (err) {
                    alert("병합 실패: " + err.message);
                }
            };

        } catch (err) {
            console.error("프리뷰 생성 실패:", err);
            if (statusEl) {
                statusEl.textContent = "❌ 실패: " + err.message;
                statusEl.style.color = "#da8";
            }
            alert("로어 병합 실패: " + err.message);
        } finally {
            if (mergeBtn) {
                mergeBtn.disabled = false;
                mergeBtn.textContent = "선택한 로어 병합 실행";
            }
        }
    }

    async function renderCrackManageTab() {
        const chatId = getChatId();
        const maxCharsInp = document.getElementById('ep-lore-merge-maxchars');
        const bulkModeSel = document.getElementById('ep-lore-merge-bulk-mode');
        const manualTurnsInp = document.getElementById('ep-lore-manual-ext-turns');
        if (maxCharsInp) maxCharsInp.value = localStorage.getItem(`pastel_crack_lore_merge_maxchars_ep_${chatId}`) || '1200';
        if (bulkModeSel) bulkModeSel.value = localStorage.getItem(`pastel_crack_lore_merge_bulk_mode_ep_${chatId}`) || 'llm-summarize';
        if (manualTurnsInp) manualTurnsInp.value = localStorage.getItem(`pastel_crack_lore_manual_ext_turns_ep_${chatId}`) || '6';

        const container = document.getElementById('ep-lore-checklist-container');
        if (!container || !loreDb || !chatId) return;

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.marginTop = '14px';
        container.style.paddingTop = '14px';
        container.style.borderTop = '1.5px dashed var(--decentral-text-border)';

        const packName = `Ep_Crack_${chatId}_Pack`;
        const entries = await loreDb.entries.where('packName').equals(packName).toArray();

        if (entries.length < 2) {
            container.innerHTML = `<div style="text-align:center; padding:14px; font-size:12px; color:#888;">수동 병합을 수행할 활성 로어가 부족합니다. (최소 2개 이상 필요)</div>`;
            return;
        }

        entries.sort((a, b) => {
            const typeA = String(a.type || "").toLowerCase().trim();
            const typeB = String(b.type || "").toLowerCase().trim();
            if (typeA !== typeB) return typeA.localeCompare(typeB);
            return (a.id || 0) - (b.id || 0);
        });

        const listWrapper = document.createElement('div');
        listWrapper.style.cssText = "max-height: 250px; overflow-y: auto; width: 100%; margin-bottom: 12px; box-sizing: border-box;";

        entries.forEach(e => {
            const row = document.createElement('div');
            row.style.cssText = "padding:8px 0; border-bottom:1px dashed var(--decentral-border); display:flex; justify-content:space-between; align-items:center; width:100%;";

            const left = document.createElement('div');
            left.style.cssText = "display:flex; flex-direction:column; gap:4px; text-align:left; flex:1; min-width:0; padding-right:8px;";

            const nameSpan = document.createElement('span');
            nameSpan.innerHTML = `<span style="color:var(--decentral-text); font-weight:bold; font-size:12px;">[${e.type}] ${e.name}</span>` + (e.anchor ? ' <span style="color:#88b9c8; font-weight:bold; font-size:10px;">[⚓︎앵커]</span>' : '');

            const summaryText = e.summary ? (typeof e.summary === 'object' ? (e.summary.full || e.summary.compact || '') : String(e.summary)) : '';
            const descSpan = document.createElement('span');
            descSpan.style.cssText = "font-size:10px; color:#888; word-break:break-all; white-space:normal;";
            descSpan.textContent = summaryText ? summaryText.slice(0, 100) : "(설명 요약 없음)";

            left.appendChild(nameSpan);
            left.appendChild(descSpan);

            const right = document.createElement('div');
            right.style.cssText = "display:flex; align-items:center; flex-shrink:0;";

            const chk = document.createElement('input');
            chk.type = "checkbox";
            chk.className = "ep-crack-merge-chk";
            chk.dataset.id = e.id;
            chk.style.cssText = "width:16px; height:16px; cursor:pointer; accent-color:#88b9c8;";

            row.onclick = (ev) => {
                if (ev.target === chk) return;
                chk.checked = !chk.checked;
            };

            right.appendChild(chk);
            row.appendChild(left);
            row.appendChild(right);
            listWrapper.appendChild(row);
        });

        container.appendChild(listWrapper);

        const mergeBtn = document.createElement('button');
        mergeBtn.id = "ep-lore-merge-find-btn";
        mergeBtn.className = "decentral-button";
        mergeBtn.style.cssText = "background-color: #bcd0d7 !important; border: 1px solid #334a52; color: #334a52; font-weight: bold; height: 36px; width: 100%; margin-top: 4px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;";
        mergeBtn.textContent = "선택한 로어 병합 실행";
        mergeBtn.onclick = runDuplicateMergerSearch;

        const statusEl = document.createElement('div');
        statusEl.id = "ep-lore-merge-status";
        statusEl.style.cssText = "font-size: 11px; color: #888888; margin-top: 6px; text-align: center; width: 100%;";

        container.appendChild(mergeBtn);
        container.appendChild(statusEl);
    }

    // ==========================================
    // [crack.html 순정 100%] 2,000자 임베딩 코사인 유사도 + 오버라이드 + 최소 빈도 슬롯 충원 엔진
    // ==========================================
    async function buildCrackRAGLoreBlock(userRawText, chatId) {
        try {
            if (!loreDb || !chatId) return "";
            const packName = `Ep_Crack_${chatId}_Pack`;
            let allEntries = [];
            try {
                allEntries = await loreDb.entries.where('packName').equals(packName).toArray();
            } catch (_) {}

            if (!allEntries || allEntries.length === 0) return "";

            // 1. 컨텍스트 수집 (최근 4턴 + 유저 입력문)
            const history = (typeof fetchCrackMessagesPure === 'function') ? await fetchCrackMessagesPure(chatId, 6) : [];
            const lastContext = history.slice(-4).map(m => m.content || m.message || m.text || '').join(' ');
            const query = (lastContext + " " + userRawText).toLowerCase();

            // 2. crack.html 순정 트리거 매칭 (0.5 가중치)
            const matchedByTrigger = [];
            allEntries.forEach(e => {
                if (!e.triggers || e.triggers.length === 0) return;
                let maxScore = 0;
                e.triggers.forEach(t => {
                    const triggerStr = t.trim().toLowerCase();
                    if (!triggerStr) return;
                    const andParts = triggerStr.split('&&').map(p => p.trim()).filter(Boolean);
                    if (andParts.length === 0) return;
                    let partsScore = 0;
                    andParts.forEach(p => {
                        if (query.includes(p)) partsScore += 1.0;
                        else {
                            const pWords = p.split(/\s+/).filter(Boolean);
                            if (pWords.length > 0) {
                                const cnt = pWords.filter(w => query.includes(w)).length;
                                if (cnt === pWords.length) partsScore += 0.85;
                                else if (cnt > 0) partsScore += 0.5 * (cnt / pWords.length);
                            }
                        }
                    });
                    const currentScore = partsScore / andParts.length;
                    if (currentScore > maxScore) maxScore = currentScore;
                });
                if (maxScore > 0) matchedByTrigger.push({ entry: e, score: maxScore });
            });

            // 3. crack.html 순정 Gemini 임베딩 코사인 유사도 매칭 (0.5 가중치)
            const matchedByEmbedding = [];
            const embedKey = localStorage.getItem('pastel_crack_lore_embed_key') || localStorage.getItem('pastel_lore_embed_key') || localStorage.getItem('pastel_api_gemini') || '';
            const embedModel = localStorage.getItem('pastel_crack_lore_embed_model') || 'gemini-embedding-001';

            if (embedKey.trim() && userRawText.trim()) {
                try {
                    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/${embedModel}:embedContent?key=${embedKey.trim()}`;
                    const embedRes = await fetch(embedUrl, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content: { parts: [{ text: userRawText.slice(0, 1000) }] } })
                    }).then(r => r.ok ? r.json() : null);

                    if (embedRes && embedRes.embedding && embedRes.embedding.values) {
                        const qVec = embedRes.embedding.values;
                        const entryIds = allEntries.map(e => e.id);
                        const embs = await loreDb.embeddings.where('entryId').anyOf(entryIds).toArray();

                        for (const eb of embs) {
                            if (eb.field === 'summary' && eb.vector) {
                                let dot = 0, na = 0, nb = 0;
                                const len = Math.min(qVec.length, eb.vector.length);
                                for (let i = 0; i < len; i++) {
                                    dot += qVec[i] * eb.vector[i];
                                    na += qVec[i] * qVec[i];
                                    nb += eb.vector[i] * eb.vector[i];
                                }
                                const denom = Math.sqrt(na) * Math.sqrt(nb);
                                const sim = denom === 0 ? 0 : dot / denom;
                                if (sim >= 0.27) {
                                    const ent = allEntries.find(x => x.id === eb.entryId);
                                    if (ent) matchedByEmbedding.push({ entry: ent, score: sim });
                                }
                            }
                        }
                    }
                } catch (_) {}
            }

            // 4. 스코어 융합 & 타입 부스트 (1.3배)
            const scoreMap = {};
            const addToMap = (row, w) => {
                const id = row.entry.id;
                if (!scoreMap[id]) scoreMap[id] = { entry: row.entry, score: 0 };
                scoreMap[id].score += row.score * w;
            };
            matchedByTrigger.forEach(r => addToMap(r, 0.5));
            matchedByEmbedding.forEach(r => addToMap(r, 0.5));

            const BOOST_TYPES = new Set(['event', 'promise', 'concept']);
            Object.values(scoreMap).forEach(row => {
                const typeLow = String(row.entry.type || '').toLowerCase().trim();
                if (BOOST_TYPES.has(typeLow)) row.score *= 1.3;
            });

            // 5. 슬롯 우선순위 배정 알고리즘
            const currentTurn = getCrackChatTurns(chatId);
            const selectedLores = [];
            const injectReport = [];
            const usedIds = new Set();

            // [0순위]: 로어 오버라이드 (스위치 ON) -> 쿨타임 무시하고 무조건 1순위 주입
            const forcedEntries = allEntries.filter(e => e.enabled === true).sort((a, b) => (a.id || 0) - (b.id || 0));
            for (const e of forcedEntries) {
                if (selectedLores.length >= 3) break;
                selectedLores.push(e);
                usedIds.add(e.id);
            }

            // [1순위]: RAG 랭킹 상위 카드 (쿨타임 아닌 것)
            const rankedAutoList = Object.values(scoreMap)
                .filter(row => row.entry.enabled !== true && row.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.entry);

            for (const e of rankedAutoList) {
                if (selectedLores.length >= 3) break;
                if (usedIds.has(e.id)) continue;

                const lastTurn = parseInt(localStorage.getItem(`pastel_crack_lore_last_turn_${chatId}_${e.id}`) || '-999', 10);
                if (lastTurn !== -999 && (currentTurn - lastTurn) <= 3) {
                    injectReport.push({ name: e.name, status: 'failed', reason: '(쿨타임 대기)' });
                    continue;
                }

                selectedLores.push(e);
                usedIds.add(e.id);
            }

            // [2순위 슬롯 보충]: 3개가 안 찼다면, 쿨타임이 아닌 남은 카드 중 "역대 주입 횟수가 가장 적은 순서"대로 채워넣기
            if (selectedLores.length < 3) {
                const remainingPool = allEntries
                    .filter(e => !usedIds.has(e.id) && e.enabled !== true)
                    .map(e => {
                        const lastTurn = parseInt(localStorage.getItem(`pastel_crack_lore_last_turn_${chatId}_${e.id}`) || '-999', 10);
                        const injCount = parseInt(localStorage.getItem(`pastel_crack_lore_inj_cnt_${chatId}_${e.id}`) || '0', 10);
                        const isCooling = (lastTurn !== -999 && (currentTurn - lastTurn) <= 3);
                        return { entry: e, injCount, isCooling };
                    })
                    .filter(item => !item.isCooling) // 쿨타임 아닌 것만
                    .sort((a, b) => a.injCount - b.injCount); // 가장 안 넣은 순서 정렬

                for (const item of remainingPool) {
                    if (selectedLores.length >= 3) break;
                    selectedLores.push(item.entry);
                    usedIds.add(item.entry.id);
                    injectReport.push({ name: item.entry.name, status: 'success', info: `보충(주입${item.injCount}회)` });
                }
            }

            if (selectedLores.length === 0) {
                if (injectReport.length > 0) recordInjectLog(chatId, currentTurn, injectReport, 0, 0, 2000);
                return "";
            }

            // 6. [본문 + 단축어 100% 무손실 보존] 2,000자 절대 한도 철벽 계산
            // userRawText에는 이미 확장된 단축어(additional note)까지 전부 포함되어 있으므로 전체 길이를 차감
            const loreBudget = Math.max(0, 2000 - userRawText.length - 8);
            if (loreBudget <= 10) {
                console.log("ℹ️ [PASTEL:RAG] 유저 본문 및 단축어 전체 길이( " + userRawText.length + "자) 보존을 위해 로어 주입을 안전하게 스킵합니다.");
                return "";
            }

            const buildCardText = (e, level, rank) => {
                const prefix = `[LORE ${rank}] [${e.type}] ${e.name}`;
                const stateText = e.state ? ` (${e.state})` : "";
                if (level === 2) return `${prefix}: ${e.summary?.full || e.summary?.compact || e.name}${stateText}`;
                if (level === 1) return `${prefix}: ${e.summary?.compact || e.summary?.full || e.name}${stateText}`;
                return `${prefix}=${e.summary?.micro || e.state || e.name}`;
            };

            const levels = selectedLores.map(() => 2);
            const getLen = () => selectedLores.reduce((acc, e, idx) => acc + buildCardText(e, levels[idx], idx + 1).length + 1, 0);

            // 3순위 -> 2순위 -> 1순위 역순으로 F -> C -> M -> 드롭 루프
            while (selectedLores.length > 0 && getLen() > loreBudget) {
                let changed = false;
                for (let i = selectedLores.length - 1; i >= 0; i--) {
                    if (levels[i] > 0) {
                        levels[i]--;
                        changed = true;
                        if (getLen() <= loreBudget) break;
                    }
                }
                if (!changed || getLen() > loreBudget) {
                    selectedLores.pop();
                    levels.pop();
                }
            }

            if (selectedLores.length === 0) return "";

            // 7. 주입 성공 기록 및 주입 횟수 + 1 카운트 갱신
            selectedLores.forEach((e, idx) => {
                localStorage.setItem(`pastel_crack_lore_last_turn_${chatId}_${e.id}`, String(currentTurn));
                const prevCount = parseInt(localStorage.getItem(`pastel_crack_lore_inj_cnt_${chatId}_${e.id}`) || '0', 10);
                localStorage.setItem(`pastel_crack_lore_inj_cnt_${chatId}_${e.id}`, String(prevCount + 1));

                const finalLevel = levels[idx];
                const levelLetter = finalLevel === 2 ? ' F' : finalLevel === 1 ? ' C' : ' M';
                if (!injectReport.some(r => r.name.startsWith(e.name) && r.status === 'success')) {
                    injectReport.unshift({
                        name: e.name + levelLetter,
                        status: 'success',
                        info: e.enabled ? '오버라이드' : `${idx + 1}순위`
                    });
                }
            });

            const finalLoreBlock = selectedLores.map((e, idx) => buildCardText(e, levels[idx], idx + 1)).join("\n");
            recordInjectLog(chatId, currentTurn, injectReport, selectedLores.length, finalLoreBlock.length, 2000);

            return finalLoreBlock;
        } catch (err) {
            console.warn("[로어 RAG 조립 예외]:", err);
            return "";
        }
    }

    // ==========================================
    // 로어 UI 렌더러 및 스냅샷 복원 UI
    // ==========================================
    function saveCrackLoreModalFields() {
        const chatId = getChatId();
        const autoTurns = document.getElementById('ep-lore-auto-ext-turns')?.value;
        const autoInst = document.getElementById('ep-lore-auto-ext-instruction')?.value;
        const embedKey = document.getElementById('ep-lore-embed-key-input')?.value;
        const embedModel = document.getElementById('ep-lore-embed-model-select')?.value;
        const maxChars = document.getElementById('ep-lore-merge-maxchars')?.value;
        const bulkMode = document.getElementById('ep-lore-merge-bulk-mode')?.value;
        const manualTurns = document.getElementById('ep-lore-manual-ext-turns')?.value;

        if (autoTurns) localStorage.setItem(`pastel_crack_lore_auto_ext_turns_ep_${chatId}`, autoTurns);
        if (autoInst !== undefined) localStorage.setItem(`pastel_crack_lore_auto_ext_instruction_ep_${chatId}`, autoInst);
        if (embedKey !== undefined) localStorage.setItem('pastel_crack_lore_embed_key', embedKey.trim());
        if (embedModel) localStorage.setItem('pastel_crack_lore_embed_model', embedModel);
        if (maxChars) localStorage.setItem(`pastel_crack_lore_merge_maxchars_ep_${chatId}`, maxChars);
        if (bulkMode) localStorage.setItem(`pastel_crack_lore_merge_bulk_mode_ep_${chatId}`, bulkMode);
        if (manualTurns) localStorage.setItem(`pastel_crack_lore_manual_ext_turns_ep_${chatId}`, manualTurns);
    }

    function loadCrackLoreSettingsTab() {
        const chatId = getChatId();
        const autoTurns = document.getElementById('ep-lore-auto-ext-turns');
        const autoInst = document.getElementById('ep-lore-auto-ext-instruction');
        const embedKey = document.getElementById('ep-lore-embed-key-input');
        const embedModel = document.getElementById('ep-lore-embed-model-select');
        const maxChars = document.getElementById('ep-lore-merge-maxchars');
        const bulkMode = document.getElementById('ep-lore-merge-bulk-mode');
        const manualTurns = document.getElementById('ep-lore-manual-ext-turns');

        if (autoTurns) autoTurns.value = localStorage.getItem(`pastel_crack_lore_auto_ext_turns_ep_${chatId}`) || '6';
        if (autoInst) autoInst.value = localStorage.getItem(`pastel_crack_lore_auto_ext_instruction_ep_${chatId}`) || '';
        if (embedKey) embedKey.value = localStorage.getItem('pastel_crack_lore_embed_key') || localStorage.getItem('pastel_api_gemini') || '';
        if (embedModel) embedModel.value = localStorage.getItem('pastel_crack_lore_embed_model') || 'gemini-embedding-001';
        if (maxChars) maxChars.value = localStorage.getItem(`pastel_crack_lore_merge_maxchars_ep_${chatId}`) || '1200';
        if (bulkMode) bulkMode.value = localStorage.getItem(`pastel_crack_lore_merge_bulk_mode_ep_${chatId}`) || 'llm-summarize';
        if (manualTurns) manualTurns.value = localStorage.getItem(`pastel_crack_lore_manual_ext_turns_ep_${chatId}`) || '6';
    }

    async function renderCrackActiveLores() {
        const activePanel = document.getElementById('ep-lore-panel-active');
        if (!activePanel || !loreDb) return;
        const chatId = getChatId();
        const packName = `Ep_Crack_${chatId}_Pack`;
        let entries = [];
        try {
            entries = await loreDb.entries.where('packName').equals(packName).toArray();
        } catch (_) {}

        if (!entries || entries.length === 0) {
            activePanel.innerHTML = `<div style="grid-column: 1 / 3; text-align: center; padding: 30px; font-size: 13px; color: #999; user-select: none;">현재 대화방 전용 저장소에 등록된 활성 로어가 존재하지 않습니다.<br>로어를 자동/수동 생성하거나 텍스트를 변환해 주십시오.</div>`;
            return;
        }

        activePanel.innerHTML = '';
        entries.sort((a, b) => {
            const typeA = String(a.type || "").toLowerCase().trim();
            const typeB = String(b.type || "").toLowerCase().trim();
            if (typeA !== typeB) return typeA.localeCompare(typeB);
            return (a.id || 0) - (b.id || 0);
        });

        for (const e of entries) {
            const card = document.createElement('div');
            card.className = 'decentral-grid-element-long-semi-flat ep-lore-accordion-card';
            card.style.cssText = "padding: 8px 0; border-bottom: 1px dashed var(--decentral-border); display: flex; flex-direction: column; width: 100%;";
            card.dataset.id = e.id;

            const isEnabled = e.enabled === true;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 6px;">
                    <div style="display: flex; align-items: center; cursor: pointer; flex-shrink: 0; margin-right: 4px;" title="${isEnabled ? '무조건 주입 활성화 (스위치 ON)' : '자동 탐색 활성화 (스위치 OFF)'}">
                        <div class="ep-lore-card-switch" style="width: 24px; height: 12px; border-radius: 6px; background: ${isEnabled ? '#88b9c8' : '#dddddd'}; position: relative;">
                            <div class="ep-lore-card-switch-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: ${isEnabled ? '14px' : '2px'}; transition: left .2s;"></div>
                        </div>
                    </div>
                    <div class="ep-lore-accordion-trigger" style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; padding-right: 8px; cursor: pointer; user-select: none;">
                        <span style="font-size: 13px; color: var(--decentral-text); font-weight: bold; text-align: left; word-break: break-all; line-height: 1.4; pointer-events: none;">
                            [${e.type}] ${e.name}
                            <span class="ep-lore-emb-status" style="margin-left: 6px; font-size: 10px; padding: 1px 4px; border-radius: 3px; white-space: nowrap; background: var(--bg_primary); border: 1px solid #dddddd; color: #888888; display: none;">대기</span>
                        </span>
                    </div>
                    <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
                        <button type="button" class="ep-lore-act-btn btn-embed" title="임베딩 재발급" style="width:24px; height:24px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; background:transparent; border:1px solid #cccccc; color:#888; cursor:pointer; box-sizing:border-box;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg></button>
                        <button type="button" class="ep-lore-act-btn btn-anchor" title="앵커 고정" style="width:24px; height:24px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; background:${e.anchor ? '#88b9c8' : 'transparent'}; border:1px solid ${e.anchor ? '#88b9c8' : '#cccccc'}; color:${e.anchor ? '#ffffff' : '#888888'}; cursor:pointer; box-sizing:border-box;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button>
                        <button type="button" class="ep-lore-act-btn btn-delete" title="영구 삭제" style="width:24px; height:24px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; background:transparent; border:1px solid #eb6666; color:#eb6666; cursor:pointer; box-sizing:border-box;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </div>
                <div class="ep-lore-accordion-body" style="display: none; width: 100%; margin-top: 8px; box-sizing: border-box;">
                    <textarea class="decentral-text-area ep-lore-inline-textarea" style="height: 200px; font-size: 11px; line-height: 1.5; border-radius: 8px; border: 1px solid var(--decentral-text-border); background:var(--decentral-text-background); color:var(--decentral-text); resize: vertical; width: 100%; box-sizing: border-box;"></textarea>
                </div>
            `;

            const bodyEl = card.querySelector('.ep-lore-accordion-body');
            const textarea = card.querySelector('.ep-lore-inline-textarea');
            const embStatus = card.querySelector('.ep-lore-emb-status');

            let cleanEntry = { ...e };
            delete cleanEntry.id; delete cleanEntry.packName; delete cleanEntry.project; delete cleanEntry.enabled;
            cleanEntry = reorderLoreKeys(cleanEntry);
            textarea.value = JSON.stringify(cleanEntry, null, 2);

            const saveInlineEntry = async () => {
                try {
                    const parsed = JSON.parse(textarea.value);
                    const updated = { ...e, ...parsed };
                    await loreDb.entries.put(updated);
                    await loreDb.embeddings.where('entryId').equals(e.id).delete();
                    Object.assign(e, updated);
                    updateEmbeddingLabel();
                } catch (_) {}
            };

            textarea.addEventListener('change', saveInlineEntry);
            textarea.addEventListener('blur', saveInlineEntry);

            const updateEmbeddingLabel = async () => {
                try {
                    const emb = await loreDb.embeddings.where('entryId').equals(e.id).first();
                    embStatus.style.display = 'inline-block';
                    if (emb) {
                        embStatus.textContent = "임베딩";
                        embStatus.style.border = "1px solid #88b9c8";
                        embStatus.style.color = "#88b9c8";
                    } else {
                        embStatus.textContent = "미임베딩";
                        embStatus.style.border = "1px solid #dddddd";
                        embStatus.style.color = "#888888";
                    }
                } catch (_) {}
            };
            updateEmbeddingLabel();

            // 오버라이드 스위치
            const sw = card.querySelector('.ep-lore-card-switch');
            const swDot = card.querySelector('.ep-lore-card-switch-dot');
            const swWrap = sw?.parentElement;
            if (swWrap && sw && swDot) {
                swWrap.onclick = async (ev) => {
                    ev.stopPropagation();
                    e.enabled = !e.enabled;
                    await loreDb.entries.update(e.id, { enabled: e.enabled });
                    sw.style.background = e.enabled ? '#88b9c8' : '#dddddd';
                    swDot.style.left = e.enabled ? '14px' : '2px';
                };
            }

            // 앵커 핀
            const anchorBtn = card.querySelector('.btn-anchor');
            anchorBtn.onclick = async (ev) => {
                ev.stopPropagation();
                e.anchor = !e.anchor;
                await loreDb.entries.update(e.id, { anchor: e.anchor });
                anchorBtn.style.background = e.anchor ? '#88b9c8' : 'transparent';
                anchorBtn.style.borderColor = e.anchor ? '#88b9c8' : '#cccccc';
                anchorBtn.style.color = e.anchor ? '#ffffff' : '#888888';
            };

            // 임베딩 재발급
            const embBtn = card.querySelector('.btn-embed');
            embBtn.onclick = async (ev) => {
                ev.stopPropagation();
                embBtn.disabled = true;
                embBtn.style.opacity = '0.3';
                try {
                    await executeLoreEmbeddingForEntry(e);
                    updateEmbeddingLabel();
                    showToast("✨ 임베딩 발급 완료!");
                } catch (err) {
                    showToast("❌ 임베딩 발급 실패");
                } finally {
                    setTimeout(() => {
                        embBtn.style.opacity = '1';
                        embBtn.disabled = false;
                    }, 1000);
                }
            };

            // 영구 삭제
            const delBtn = card.querySelector('.btn-delete');
            delBtn.onclick = async (ev) => {
                ev.stopPropagation();
                if (!confirm(`[${e.name}] 로어를 정말 삭제하시겠습니까?`)) return;
                await loreDb.entries.delete(e.id);
                await loreDb.embeddings.where('entryId').equals(e.id).delete();
                renderCrackActiveLores();
            };

            // 아코디언 열고 닫기
            const trigger = card.querySelector('.ep-lore-accordion-trigger');
            trigger.onclick = (ev) => {
                ev.stopPropagation();
                bodyEl.style.display = (bodyEl.style.display === 'block') ? 'none' : 'block';
            };

            activePanel.appendChild(card);
        }
    }

    function renderCrackLoreLogs() {
        const epId = getChatId();
        const injEl = document.getElementById('ep-lore-modal-inject-log-container');
        const extEl = document.getElementById('ep-lore-modal-extract-log-container');
        if (!injEl || !extEl) return;

        const injLogs = JSON.parse(localStorage.getItem(`pastel_crack_inject_logs_${epId}`) || '[]');
        injEl.innerHTML = injLogs.length === 0 ? '<div style="text-align:center; color:#888; padding:15px;">이 대화방에서 기록된 주입 로그가 없습니다.</div>' : injLogs.map(l => `
            <div class="ep-costs-log-item">
                <div style="display:flex; justify-content:space-between; font-weight:bold; color:#88b9c8;">
                    <span>t${l.turn}턴 주입 (${l.count}개)</span>
                    <span style="font-size:10px; color:#888;">${new Date(l.ts).toLocaleTimeString()}</span>
                </div>
                <div style="font-size:11px; margin-top:4px;">${l.matched.map(m => m.status === 'success' ? `<span style="color:#8cc09c; font-weight:bold;">✔ ${m.name}</span>` : `<span style="color:#888;">⚠ ${m.name} ${m.reason || ''}</span>`).join('<br>')}</div>
            </div>
        `).join('');

        const extLogs = JSON.parse(localStorage.getItem(`pastel_crack_extract_logs_${epId}`) || '[]');
        extEl.innerHTML = extLogs.length === 0 ? '<div style="text-align:center; color:#888; padding:15px;">이 대화방에서 기록된 로어 생성 로그가 없습니다.</div>' : extLogs.map(l => `
            <div class="ep-costs-log-item">
                <div style="display:flex; justify-content:space-between; font-weight:bold; color:#88b9c8;">
                    <span>t${l.turn}턴 생성 ${l.status === 'success' ? '<span style="color:#8cc09c;">(성공)</span>' : '<span style="color:#b4a1bd;">(실패)</span>'}</span>
                    <span style="font-size:10px; color:#888;">${new Date(l.ts).toLocaleTimeString()}</span>
                </div>
                <div style="font-size:11px; margin-top:2px;">발굴: ${l.count}개 | 모델: ${l.model}</div>
            </div>
        `).join('');
    }

    async function renderCrackLoreSnapshots() {
        const container = document.getElementById('ep-lore-snapshot-list-container');
        if (!container || !loreDb) return;
        container.innerHTML = '';
        const chatId = getChatId();
        const packName = `Ep_Crack_${chatId}_Pack`;
        const snapshots = await loreDb.snapshots.where('packName').equals(packName).reverse().sortBy('timestamp');

        if (!snapshots || snapshots.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:30px; color:#888; font-size:12px; user-select:none;">저장된 로어 백업 세이브 포인트가 없습니다.</div>`;
            return;
        }

        snapshots.forEach(s => {
            const timeStr = new Date(s.timestamp).toLocaleString();
            let entriesList = [];
            try { entriesList = JSON.parse(s.data || '[]'); } catch (_) {}

            const card = document.createElement('div');
            card.style.cssText = "padding: 10px 14px; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; background-color: var(--decentral-background); border: 1px solid var(--decentral-inner-border); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background-color 0.2s;";

            const header = document.createElement('div');
            header.style.cssText = "display: flex; justify-content: space-between; align-items: center; width: 100%;";
            header.innerHTML = `
                <div style="text-align: left; flex: 1; min-width: 0; padding-right: 12px; pointer-events: none;">
                    <span style="font-size: 13px; font-weight: bold; color: var(--decentral-text); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.type}</span>
                    <span style="font-size: 10px; color: var(--decentral-text-formal);">${timeStr}</span>
                </div>
            `;

            const restoreBtn = document.createElement('button');
            restoreBtn.type = "button";
            restoreBtn.className = "decentral-button";
            restoreBtn.title = "복원";
            restoreBtn.style.cssText = "background: transparent !important; border: 1px solid #88b9c8; color: #88b9c8 !important; width: auto; height: 26px; padding: 0 8px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; border-radius: 4px;";
            restoreBtn.textContent = "복원";

            restoreBtn.onclick = async (ev) => {
                ev.stopPropagation();
                if (!confirm("이 시점으로 전체 로어 데이터를 복원하시겠습니까?\n현재 저장소의 카드 목록이 선택한 백업 상태로 교체됩니다.")) return;
                try {
                    await restoreLoreSnapshot(s.id);
                    showToast("✨ 로어 복원 완료!");
                    renderCrackLoreSnapshots();
                    renderCrackActiveLores();
                } catch (err) {
                    alert("복원 실패: " + err.message);
                }
            };

            header.appendChild(restoreBtn);
            card.appendChild(header);

            const accordionBody = document.createElement('div');
            accordionBody.style.cssText = "display: none; padding-top: 8px; border-top: 1px dashed var(--decentral-border); margin-top: 8px; width: 100%; text-align: left;";
            const listChips = entriesList.map(e => `<span style="font-size: 10px; color: var(--decentral-text-formal); display: inline-block; background: var(--bg_primary); padding: 2px 6px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px; border: 1px solid var(--decentral-border);">[${e.type}] ${e.name}</span>`).join('');
            accordionBody.innerHTML = listChips || `<span style="font-size: 11px; color: #888; font-style: italic;">지식이 비어있는 백업 포인트입니다.</span>`;
            card.appendChild(accordionBody);

            card.onclick = () => {
                accordionBody.style.display = accordionBody.style.display === 'block' ? 'none' : 'block';
            };

            container.appendChild(card);
        });
    }

    function switchCrackLoreTab(tabId, panelId) {
        document.querySelectorAll('.decentral-menu-element').forEach(t => t.removeAttribute('active'));
        document.getElementById(tabId)?.setAttribute('active', 'true');
        document.querySelectorAll('.ep-lore-panel').forEach(p => p.classList.remove('active-panel'));
        document.getElementById(panelId)?.classList.add('active-panel');

        if (panelId === 'ep-lore-panel-active') renderCrackActiveLores();
        else if (panelId === 'ep-lore-panel-log') renderCrackLoreLogs();
        else if (panelId === 'ep-lore-panel-manage') {
            renderCrackManageTab();
            const tBtn = document.getElementById('ep-lore-text-btn');
            if (tBtn) tBtn.onclick = executeTextConversion;
            const mBtn = document.getElementById('ep-lore-manual-ext-btn');
            if (mBtn) {
                mBtn.onclick = async () => {
                    const turns = parseInt(document.getElementById('ep-lore-manual-ext-turns')?.value, 10) || 6;
                    const st = document.getElementById('ep-lore-manual-ext-status');
                    mBtn.disabled = true; mBtn.textContent = "수동 추출 중...";
                    if (st) { st.textContent = "최근 대화 분석 중..."; st.style.color = "#74a1c0"; }
                    try {
                        showLoreExtPersistentToast(`🔮 최근 ${turns}턴 수동 로어 생성 중...`);
                        const count = await executeManualLoreExtraction(getChatId(), turns);
                        if (st) { st.textContent = `✅ 성공: 최근 ${turns}턴 분석 (${count || 0}개 로어 병합)`; st.style.color = "#88b9c8"; }
                        showToast("✨ 수동 로어 생성 완료!");
                    } catch (err) {
                        if (st) { st.textContent = "❌ 실패: " + err.message; st.style.color = "#da8"; }
                        showToast("❌ 수동 로어 생성 실패");
                    } finally {
                        hideLoreExtPersistentToast();
                        mBtn.disabled = false; mBtn.textContent = "지정 턴수만큼 수동 로어 생성";
                    }
                };
            }
            const rBtn = document.getElementById('ep-lore-regenerate-btn');
            if (rBtn) rBtn.onclick = () => executeLoreRegeneration(getChatId());
        }
        else if (panelId === 'ep-lore-panel-restore') {
            renderCrackLoreSnapshots();
            const snapBtn = document.getElementById('ep-lore-btn-create-snapshot');
            if (snapBtn) {
                snapBtn.onclick = async () => {
                    snapBtn.disabled = true; snapBtn.textContent = "백업 중...";
                    try {
                        await createLoreSnapshot(getChatId(), "수동 로어 백업");
                        showToast("✨ 로어 백업 세이브 생성 완료!");
                        renderCrackLoreSnapshots();
                    } catch (_) {}
                    finally { snapBtn.disabled = false; snapBtn.textContent = "현재 로어 백업"; }
                };
            }
        }
        else if (panelId === 'ep-lore-panel-settings') loadCrackLoreSettingsTab();
    }

    // Firebase SDK 및 App Check 초기화 엔진 (Tampermonkey 샌드박스 브릿징 & 안전 발급)
    let geminiAppCheckApp = null;
    let cachedAppCheckToken = null;
    let cachedAppCheckExpiry = 0;
    const RECAPTCHA_SITE_KEY = "6Lc_imwtAAAAADr3ojpxWjAb5ofGvBzD4rgEnfr4";

    // 1. 브라우저 최상위 윈도우에 reCAPTCHA v3 스크립트 주입 및 샌드박스 브릿징
    function ensureRecaptchaLoaded() {
        return new Promise((resolve) => {
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

            // 이미 로드되어 있는 경우 즉시 브릿징
            if (win.grecaptcha && typeof win.grecaptcha.ready === 'function') {
                window.grecaptcha = win.grecaptcha;
                return resolve(win.grecaptcha);
            }

            // 스크립트 태그가 없으면 DOM에 삽입
            if (!document.getElementById('recaptcha-v3-runtime-script')) {
                const script = document.createElement('script');
                script.id = 'recaptcha-v3-runtime-script';
                script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
                script.async = true;
                (document.head || document.documentElement).appendChild(script);
            }

            // reCAPTCHA 엔진이 브라우저에 마운트될 때까지 최대 5초 대기
            let elapsed = 0;
            const timer = setInterval(() => {
                elapsed += 100;
                const currentWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                if (currentWin.grecaptcha && typeof currentWin.grecaptcha.ready === 'function') {
                    clearInterval(timer);
                    window.grecaptcha = currentWin.grecaptcha;
                    resolve(currentWin.grecaptcha);
                } else if (elapsed >= 5000) {
                    clearInterval(timer);
                    resolve(null);
                }
            }, 100);
        });
    }

    // 2. App Check 초기화 (grecaptcha 브릿징 후 activate)
    async function initializeFirebaseDynamically() {
        const firebaseScript = localStorage.getItem('pastel_api_firebase') || '';
        if (!firebaseScript.trim()) return null;

        try {
            await ensureRecaptchaLoaded();
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            if (win.grecaptcha) {
                window.grecaptcha = win.grecaptcha;
            }

            const config = parseFirebaseConfig(firebaseScript);
            if (config && config.projectId && config.apiKey) {
                let defaultApp = typeof firebase !== 'undefined' && firebase.apps ? firebase.apps.find(a => a.name === '[DEFAULT]') : null;
                if (!defaultApp && typeof firebase !== 'undefined') {
                    defaultApp = firebase.initializeApp(config);
                }
                geminiAppCheckApp = defaultApp;

                if (geminiAppCheckApp && typeof firebase !== 'undefined' && typeof firebase.appCheck === 'function') {
                    try {
                        const appCheck = firebase.appCheck(geminiAppCheckApp);
                        appCheck.activate(
                            new firebase.appCheck.ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
                            true
                        );
                    } catch (_) {}
                }
                return geminiAppCheckApp;
            }
        } catch (e) {
            console.warn("[Firebase 초기화 에러]:", e);
        }
        return null;
    }

    // 3. 토큰 7일 영구 재사용(localStorage) 발급 및 실시간 콘솔 진단
    async function getAppCheckToken() {
        const now = Date.now();
        const storedToken = localStorage.getItem('pastel_appcheck_token_persistent');
        const storedExpiry = parseInt(localStorage.getItem('pastel_appcheck_token_expiry') || '0', 10);

        // 7일 만료 전까지는 브라우저를 껐다 켜도 reCAPTCHA 호출 없이 0초 만에 즉각 재사용 (무료 할당량 100% 보존)
        if (storedToken && now < storedExpiry) {
            return storedToken;
        }

        try {
            await initializeFirebaseDynamically();

            const targetApp = geminiAppCheckApp || (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 ? firebase.app() : null);
            if (targetApp && typeof firebase !== 'undefined' && firebase.appCheck) {
                const tokenPromise = firebase.appCheck(targetApp).getToken(false);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("AppCheck 토큰 발급 시간 초과(8초)")), 8000)
                );

                const tokenResult = await Promise.race([tokenPromise, timeoutPromise]);
                if (tokenResult && tokenResult.token) {
                    const token = tokenResult.token;
                    // 7일(안전 마진 적용 6.5일 = 156시간) 동안 localStorage에 영구 보존
                    const expiry = now + (6.5 * 24 * 60 * 60 * 1000);
                    localStorage.setItem('pastel_appcheck_token_persistent', token);
                    localStorage.setItem('pastel_appcheck_token_expiry', String(expiry));
                    console.log("🔑 [PASTEL:AppCheck] 7일 토큰 신규 발급 완료:", token.slice(0, 15) + "...");
                    return token;
                }
            }
        } catch (e) {
            console.warn("[AppCheck 발급 경고]:", e.message || e);
        }

        // 만약 신규 발급이 일시 지연되더라도 기존 토큰이 남아있다면 폴백으로 재사용
        if (storedToken) return storedToken;

        console.error("❌ [PASTEL:AppCheck] 토큰 발급 실패! Firebase 설정 확인 필요");
        return null;
    }

    // [유저 본문 100% 보존 & 로어만 정밀 은닉 엔진]
    function stripLoreOnlyFromView() {
        const chatRoot = document.querySelector('.flex.flex-col-reverse.w-full') || document.querySelector('main') || document.body;
        if (!chatRoot) return;

        // 1. <p> 태그 단위로 렌더링된 경우: [LORE로 시작하는 개별 <p> 단락만 숨김 (부모 말풍선 div는 절대 건드리지 않음)
        const pTags = chatRoot.querySelectorAll('p');
        pTags.forEach(p => {
            if (p.closest('.chat-footer-control') || p.closest('#ep-chat-right-drawer') || p.closest('.ep-prompt-overlay') || p.closest('#ep-lore-storage-modal-overlay')) return;
            const txt = (p.textContent || '').trim();
            if (/^\[LORE\s*\d*\]/i.test(txt)) {
                p.style.display = 'none';
            }
        });

        // 2. 단일 텍스트 블록(pre-wrap)으로 렌더링된 경우: [LORE 1]... [LORE n] 앞부분만 잘라내고 유저 본문은 유지
        const textElements = chatRoot.querySelectorAll('.break-words, .whitespace-pre-wrap, .prose');
        textElements.forEach(el => {
            if (el.closest('.chat-footer-control') || el.closest('#ep-chat-right-drawer') || el.closest('.ep-prompt-overlay') || el.closest('#ep-lore-storage-modal-overlay')) return;

            // <p> 태그 자식이 있는 상자는 1번에서 <p>를 숨겼으므로 패스
            if (el.querySelector('p')) return;

            if (el.innerHTML && el.innerHTML.includes('[LORE')) {
                // [LORE ...] 블록만 정밀 제거하고 유저가 작성한 본문 텍스트는 온전히 보존
                let clean = el.innerHTML.replace(/^\[LORE[\s\S]*?(?=(?:<br\s*\/?>\s*<br\s*\/?>|\n\s*\n)|$)/i, '').trim();
                clean = clean.replace(/^(?:<br\s*\/?>|\n)+/i, '').trim();
                if (clean && el.innerHTML !== clean) {
                    el.innerHTML = clean;
                }
            }
        });
    }

    /* ==========================================================================
     * 6. SPA 라우팅 대응 상시 주입 감시 (무거운 감시 없음 / 가벼운 확인 루프)
     * ========================================================================== */
    initializeFirebaseDynamically();

    function checkAndInject() {
        injectBaseDOM();
        stripLoreOnlyFromView();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndInject);
    } else {
        checkAndInject();
    }

    // SPA 라우팅으로 헤더가 새로 렌더링되어도 즉시 버튼을 복원하도록 0.5초 주기로 감시
    setInterval(checkAndInject, 500);

})();
