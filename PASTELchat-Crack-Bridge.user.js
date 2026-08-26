// ==UserScript==
// @name         PASTELchat × CRACK Module 1 (Base & Menu)
// @namespace    https://pastelchat.com/
// @version      1.1.1
// @description  PASTELchat Native UI Engine for crack.wrtn.ai - Module 1: Base & Right Drawer Menu
// @author       PASTELchat
// @match        https://crack.wrtn.ai/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

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

        /* 우측 서랍 컨테이너 (헤더 아래에서 시작) */
        .right-drawer-container {
            position: fixed;
            top: 104px; /* 메인 상단 헤더(56px) + 대화창 서브 헤더(48px) 바로 아래 */
            right: 0;
            width: 255px;
            height: calc(100% - 104px); /* 헤더 영역을 제외한 높이 */
            background-color: var(--bg_primary);
            border-left: 1px solid #E6E6E6;
            box-sizing: border-box;
            z-index: 100000;
            display: none;
            flex-direction: column;
            user-select: none;
            box-shadow: -4px 4px 24px rgba(0, 0, 0, 0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
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

        /* 상단 헤더 아래 영역만 어둡게 만드는 서랍 전용 오버레이 */
        .ep-chat-drawer-overlay {
            position: fixed;
            top: 104px;
            left: 0;
            right: 0;
            bottom: 0;
            height: calc(100% - 104px);
            background: rgba(0, 0, 0, 0.35);
            z-index: 99998;
            display: none;
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

        /* 크랙 순정 입력창 숨김 (파스텔 입력창으로 대체) */
        .flex.w-full.flex-col.rounded-lg.border.bg-background.transition-colors {
            display: none !important;
        }

        /* 하단 입력바 & 특수문자 구슬 툴바 (crack.html 순정 100%) */
        .chat-footer-control {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
            background: transparent;
            position: relative;
            user-select: none;
        }
        .input-area {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 160px;
            border: 1px solid #E6E6E6;
            border-radius: 12px;
            background-color: #fafafa;
            padding: 15px 20px 10px 20px;
            box-sizing: border-box;
            transition: border-color 0.2s, background-color 0.2s;
        }
        .input-area:focus-within {
            border: 2px solid #888888 !important;
            background-color: #ffffff !important;
            padding: 14px 19px 9px 19px;
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
            width: 26px;
            height: 26px;
            border-radius: 50%;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
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
        }

        .hold-send-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background-color: #eee;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            flex-shrink: 0;
            transition: background-color 0.2s;
            padding: 0;
            outline: none;
        }
        body[data-theme="dark"] .hold-send-btn {
            background-color: #333;
        }

        #sh-progress-ring {
            position: fixed;
            pointer-events: none;
            z-index: 999999;
            display: none;
        }
        #sh-progress-ring.active {
            display: block;
        }
        #sh-progress-ring circle.track {
            fill: none;
            stroke: rgba(0, 0, 0, 0.05);
            stroke-width: 3;
        }
        #sh-progress-ring circle.fill {
            fill: none;
            stroke: #fb8d76 !important;
            stroke-width: 3;
            stroke-linecap: round;
            transform: rotate(-90deg);
            transform-origin: center;
            transform-box: fill-box;
            transition: stroke-dashoffset linear;
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
    `;

    // CSS 주입
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.innerHTML = PASTEL_CSS;
    (document.head || document.documentElement).appendChild(styleEl);

    /* ==========================================================================
     * 2. 토스트 헬퍼 함수 (index.html 순정)
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

            bindDrawerEvents();
        }

        // [B] 헤더 내 파스텔 메뉴 버튼 상시 주입/유지 로직
        injectHeaderButton();

        // [C] 하단 파스텔 입력창 & 구슬 툴바 상시 주입 로직
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22px" height="22px">
                    <path d="M11 11h2v2h-2zm-2.5 0h-2v2h2zm7 0h2v2h-2z"></path>
                    <path fill-rule="evenodd" d="M1.99 12c0 5.52 4.49 10.01 10.01S22.01 17.52 22.01 12 17.52 1.99 12 1.99 1.99 6.48 1.99 12m1.6 0c0-4.64 3.77-8.41 8.41-8.41s8.41 3.77 8.41 8.41-3.77 8.41-8.41 8.41S3.59 16.64 3.59 12" clip-rule="evenodd"></path>
                </svg>
            `;
            // 버튼 클릭 이벤트 직접 연결 (서랍과 암전 오버레이 모두 헤더 아래로 위치 동기화)
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                const drawer = document.getElementById('ep-chat-right-drawer');
                const overlay = document.getElementById('ep-chat-drawer-overlay');
                if (drawer && overlay) {
                    const isOpen = drawer.style.display !== 'flex';
                    if (isOpen) {
                        const subHeader = document.querySelector('.absolute.z-docked.left-0.w-full.h-12') || document.querySelector('.h-12.px-5.flex.justify-between');
                        if (subHeader) {
                            const rect = subHeader.getBoundingClientRect();
                            drawer.style.top = `${rect.bottom}px`;
                            drawer.style.height = `calc(100% - ${rect.bottom}px)`;
                            overlay.style.top = `${rect.bottom}px`;
                            overlay.style.height = `calc(100% - ${rect.bottom}px)`;
                        }
                    }
                    drawer.style.display = isOpen ? 'flex' : 'none';
                    overlay.style.display = isOpen ? 'block' : 'none';
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

    function getChatId() {
        const match = location.pathname.match(/chats\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : 'global';
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
                    <!-- 순정 구슬 단축 버튼 9종 (백틱 충돌 방지 &#96; 처리) -->
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

                    <!-- 600ms 홀드 전송 버튼 -->
                    <button class="hold-send-btn" id="ep-chat-send-btn" title="전송">
                        <svg id="ep-chat-send-icon" xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="22" height="22"><path d="M18.77 11.13 8.5 5.2a1 1 0 0 0-1.5 .87v11.86a1 1 0 0 0 1.5 .87l10.27-5.93a1 1 0 0 0 0-1.73z"></path></svg>
                    </button>
                </div>
            </div>
        `;
        crackInputWrapper.appendChild(footerControl);
        bindInputEvents();
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
            if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, rawText);
            } else {
                editor.innerHTML = `<p>${rawText.replace(/\\n/g, '<br>')}</p>`;
            }
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            editor.dispatchEvent(new Event('change', { bubbles: true }));

            // 크랙의 원래 전송 버튼 탐색 및 클릭
            setTimeout(() => {
                const nativeSendBtn = document.querySelector('button[style*="rgb(249, 182, 0)"]') || 
                                     document.querySelector('button.bg-primary') ||
                                     document.querySelector('button svg path[d^="M18.77"]')?.closest('button');
                if (nativeSendBtn) {
                    nativeSendBtn.click();
                    textarea.value = '';
                    updateSendButtonColor();
                } else {
                    showToast("❌ 전송 버튼 탐색 실패");
                }
            }, 50);
        } else {
            showToast("❌ 에디터 탐색 실패");
        }
    }

    function bindInputEvents() {
        const textarea = document.getElementById('ep-chat-input-textarea');
        const sendBtn = document.getElementById('ep-chat-send-btn');
        const cmdBtn = document.getElementById('ep-cmd-symbol-btn');
        const cmdModal = document.getElementById('ep-comment-custom-modal-overlay');
        const toggleSet = document.getElementById('ep-cmd-toggle-set');
        const closeGroup = document.getElementById('ep-cmd-close-group');
        const cancelBtn = document.getElementById('ep-cmd-cancel-btn');

        if (textarea) {
            textarea.addEventListener('input', updateSendButtonColor);
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                    e.preventDefault();
                    executeSendMessage();
                }
            });
        }

        // 9종 구슬 버튼 클릭 이벤트
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

        // 600ms 홀드 전송 버튼
        if (sendBtn) {
            sendBtn.addEventListener('mousedown', startSendHold);
            sendBtn.addEventListener('mouseup', cancelSendHold);
            sendBtn.addEventListener('mouseleave', cancelSendHold);
            sendBtn.addEventListener('touchstart', startSendHold, { passive: false });
            sendBtn.addEventListener('touchend', cancelSendHold);
            sendBtn.addEventListener('touchcancel', cancelSendHold);

            sendBtn.addEventListener('click', (e) => {
                if (!isSendConfirmed) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return;
                }
                isSendConfirmed = false;
                executeSendMessage();
            }, true);
        }
    }

    /* ==========================================================================
     * 4. 서랍 / 아코디언 / 모달 이벤트 바인딩 로직
     * ========================================================================== */
    function bindDrawerEvents() {
        const menuBtn = document.getElementById('ep-native-menu-btn');
        const drawer = document.getElementById('ep-chat-right-drawer');
        const overlay = document.getElementById('ep-chat-drawer-overlay');

        // 서랍 열기/닫기 (헤더 바로 아래로 위치 자동 동기화)
        const toggleDrawer = (open) => {
            const isOpen = (open !== undefined) ? open : (drawer.style.display !== 'flex');
            if (isOpen) {
                // 대화창 서브 헤더의 실제 위치를 실시간 측정하여 정확히 그 밑에 밀착
                const subHeader = document.querySelector('.absolute.z-docked.left-0.w-full.h-12');
                if (subHeader) {
                    const rect = subHeader.getBoundingClientRect();
                    drawer.style.top = `${rect.bottom}px`;
                    drawer.style.height = `calc(100% - ${rect.bottom}px)`;
                }
            }
            drawer.style.display = isOpen ? 'flex' : 'none';
            overlay.style.display = isOpen ? 'block' : 'none';
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

        if (apiKeyInp) apiKeyInp.onchange = (e) => localStorage.setItem('pastel_api_gemini', e.target.value.trim());
        if (apiFbTextarea) apiFbTextarea.onchange = (e) => localStorage.setItem('pastel_api_firebase', e.target.value.trim());

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

        // 4. 로어 저장소 (모듈 5에서 로어 모달 탑재 시 연결 예정)
        const loreBtn = document.getElementById('ep-menu-lore-btn');
        if (loreBtn) {
            loreBtn.onclick = () => {
                showToast("🔮 로어 저장소는 모듈 5에서 연결됩니다.");
            };
        }

        // 5. 크랙 데이터 전체 정리
        const clearBtn = document.getElementById('ep-menu-crack-clear-btn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (!confirm("⚠️ 크랙 전용 로컬 데이터(메모, 로어 저장소, 설정값 등)를 전부 삭제하시겠습니까?")) return;
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('pastel_crack_')) keysToRemove.push(k);
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                showToast("✨ 크랙 전용 데이터가 완전히 정리되었습니다.");
                setTimeout(() => location.reload(), 800);
            };
        }
    }

    /* ==========================================================================
     * 5. SPA 라우팅 대응 상시 주입 감시 (무거운 감시 없음 / 가벼운 확인 루프)
     * ========================================================================== */
    function checkAndInject() {
        injectBaseDOM();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndInject);
    } else {
        checkAndInject();
    }

    // SPA 라우팅으로 헤더가 새로 렌더링되어도 즉시 버튼을 복원하도록 0.5초 주기로 감시
    setInterval(checkAndInject, 500);

})();
