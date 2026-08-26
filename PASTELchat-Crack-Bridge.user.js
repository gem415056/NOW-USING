// ==UserScript==
// @name         PASTELchat × CRACK Module 1 (Base & Menu)
// @namespace    https://pastelchat.com/
// @version      1.0.3
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
                        <span class="accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1 0-.708"/></svg></span>
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
                        <span class="accordion-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1 0-.708"/></svg></span>
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

            bindDrawerEvents();
        }

        // [B] 헤더 내 파스텔 메뉴 버튼 상시 주입/유지 로직
        injectHeaderButton();
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
                arrow.innerHTML = isOpen 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
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
                arrow.innerHTML = isOpen 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/></svg>`;
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
