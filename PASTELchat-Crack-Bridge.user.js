// ==UserScript==
// @name         PASTELchat × CRACK (Module 1: Crash-Proof Shell)
// @namespace    https://github.com/
// @version      1.2.0
// @description  Module 1: Safe & Crash-Proof PASTELchat UI Injection on crack.wrtn.ai
// @author       PASTELchat
// @match        *://crack.wrtn.ai/*
// @match        *://*.wrtn.ai/*
// @match        https://crack.wrtn.ai/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('%c[PASTELchat] 🚀 유저스크립트 정상 로딩 시작!', 'color: #FF4432; font-weight: bold; font-size: 16px;');

    // =========================================================================
    // [1. 안전한 CSS 스타일 주입 (크래시 방지)]
    // =========================================================================
    const pastelCSS = `
        :root {
            --pastel_bg_primary: #ffffff;
            --pastel_text_primary: #222222;
            --pastel_icon_primary: #222222;
            --pastel_gradient: linear-gradient(135deg, #FFB5E8, #FF9CEE, #B28DFF, #85E3FF, #BFFCC6);
        }

        body[data-theme="dark"] {
            --pastel_bg_primary: #141413;
            --pastel_text_primary: #F0EFEB;
            --pastel_icon_primary: #F0EFEB;
        }

        /* 메인 감싸개 */
        #ep-pastel-injected-container {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            background-color: var(--pastel_bg_primary) !important;
            color: var(--pastel_text_primary) !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            z-index: 10 !important;
            flex: 1 !important;
        }

        .chat-main-wrapper {
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: 100%;
        }

        .chat-content-box {
            flex: 1;
            overflow-y: auto;
            padding: 17px 35px 20px 35px;
            box-sizing: border-box;
        }

        .msg-card {
            padding: 22px 0;
            border-bottom: 1px solid #E6E6E6;
            line-height: 1.6;
            font-size: 16px;
            text-align: left;
        }
        body[data-theme="dark"] .msg-card { border-bottom-color: #333230; }

        .msg-text { white-space: pre-wrap !important; word-break: break-all; }

        /* 서식 및 마크다운 */
        .ep-chat-bold { font-weight: 800 !important; }
        .ep-chat-action { color: #666666 !important; font-weight: normal; }
        body[data-theme="dark"] .ep-chat-action { color: #999999 !important; }
        .quote-block { border-left: 4px solid #888888; padding-left: 12px; margin: 8px 0 8px 8px; display: block; color: var(--pastel_text_primary); white-space: pre-wrap; }
        .ep-inline-code { background-color: #F8F2F4; color: #6E5960; border: 1px solid #bfa5a6; border-radius: 4px; padding: 1.5px; font-size: 15px !important; margin: 0 2px; display: inline; }
        body[data-theme="dark"] .ep-inline-code { background-color: #2b2224; color: #e0bcc0; border-color: #5c4547; }
        
        .ep-hud-box { position: relative; margin: 0 0 0 auto; width: fit-content; padding: 2px 0 0 0; text-align: right; font-size: 14px !important; font-weight: 300; letter-spacing: 1.4px; line-height: 1.6; }
        .ep-hud-box::after { content: ""; display: block; width: 100%; margin-top: 6px; border-bottom: 6px double #D2C0C0; }

        .ep-dialogue-card-wrapper { position: relative; display: flex; flex-direction: column; width: fit-content; max-width: 100%; margin: 12px 0; box-sizing: border-box; }
        .ep-dialogue-card-wrapper.user-side { margin-left: auto; }
        .ep-dialogue-badge-row { display: flex; width: 100%; padding: 0 16px; box-sizing: border-box; margin-top: -11px; margin-bottom: -11px; z-index: 2; pointer-events: none; }
        .ep-dialogue-card-wrapper.user-side .ep-dialogue-badge-row { justify-content: flex-end; }
        .ep-dialogue-badge { background-color: #bfa5a6; color: #FDFBFC; font-size: 13.5px; font-weight: 600; padding: 3.5px 13px; border-radius: 9999px; width: fit-content; display: inline-flex; align-items: center; white-space: nowrap; }
        .ep-dialogue-card-box { background-color: #F8F2F4; border: 0.7px solid #bfa5a6; border-radius: 0 16px 0 16px; color: #9a868d; font-weight: 700; padding: 14px 16px 12px 16px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; width: 100%; box-sizing: border-box; }
        .ep-dialogue-card-wrapper.user-side .ep-dialogue-card-box { border-radius: 16px 0 16px 0; }
        body[data-theme="dark"] .ep-dialogue-card-box { background-color: #2b2224; border-color: #5c4547; color: #e0bcc0; }

        .ep-sms-container { display: flex; gap: 10px; margin: 12px 0; align-items: flex-start; width: 100%; box-sizing: border-box; }
        .ep-sms-container.user-side { flex-direction: row-reverse; }
        .ep-sms-avatar-icon { width: 28px; height: 28px; flex-shrink: 0; }
        .ep-sms-avatar-icon svg { width: 100%; height: 100%; stroke: #bfa5a6; }
        .ep-sms-content-col { display: flex; flex-direction: column; gap: 6px; max-width: 75%; align-items: flex-start; }
        .ep-sms-container.user-side .ep-sms-content-col { align-items: flex-end; }
        .ep-sms-name { font-size: 13.5px; font-weight: 700; color: #bfa5a6; line-height: 1; }
        .ep-sms-bubble { background-color: #F8F2F4; border: 1px solid #bfa5a6; border-radius: 16px; color: #9a868d; font-size: 15px; font-weight: 700; line-height: 1.5; padding: 10px 14px; width: fit-content; max-width: 100%; box-sizing: border-box; }
        body[data-theme="dark"] .ep-sms-bubble { background-color: #2b2224; border-color: #5c4547; color: #e0bcc0; }

        /* 하단 입력바 & 툴바 */
        .chat-footer-control {
            margin-top: auto !important;
            padding: 16px 25px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
            background: var(--pastel_bg_primary);
            position: relative;
            z-index: 20;
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
        }
        body[data-theme="dark"] .input-area { background-color: #1a1918; border-color: #333230; }
        .input-area:focus-within { border: 2px solid #888888 !important; background-color: var(--pastel_bg_primary) !important; padding: 14px 19px 9px 19px; }

        .chat-textarea {
            width: 100%;
            height: 100%;
            border: none !important;
            background: transparent !important;
            color: var(--pastel_text_primary);
            padding: 0 !important;
            resize: none;
            font-size: 16px;
            outline: none;
            line-height: 20px;
            font-family: inherit;
        }

        .input-toolbar { display: flex; align-items: center; gap: 12px; width: 100%; user-select: none; margin-top: 5px; }

        .tool-btn {
            position: relative;
            background-color: #fcfcfc;
            border: 1px solid #B0B0B0;
            color: var(--pastel_text_primary);
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
        body[data-theme="dark"] .tool-btn { background-color: #242321; border-color: #555; }
        .tool-btn.active { border-color: #888888 !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important; }
        .vertical-divider { width: 1px; height: 14px; border-left: 1px dashed #888888; }

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
        }
        body[data-theme="dark"] .hold-send-btn { background-color: #333230; }

        /* 플로팅 스크롤 버튼 */
        .ep-scroll-shortcuts-container {
            position: absolute;
            bottom: 190px;
            right: 25px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 40;
            pointer-events: none;
        }
        .ep-scroll-btn-wrapper {
            pointer-events: auto;
            opacity: 0;
            transform: translateY(15px);
            transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            display: none;
            justify-content: center;
            align-items: center;
        }
        .ep-scroll-btn-wrapper.visible { display: flex; opacity: 1; transform: translateY(0); }
        .ep-scroll-btn-wrapper button {
            background-color: var(--pastel_bg_primary);
            border: 1px solid #E6E6E6;
            color: var(--pastel_text_primary);
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            padding: 0;
            opacity: 0.65;
        }
        .ep-scroll-btn-wrapper svg { width: 13px; height: 13px; fill: currentColor; }

        /* 우측 서랍 메뉴 */
        .right-drawer-container {
            position: absolute;
            top: 0;
            right: 0;
            width: 255px;
            height: 100%;
            background-color: var(--pastel_bg_primary);
            border-left: 1px solid #E6E6E6;
            box-sizing: border-box;
            z-index: 45;
            display: none;
            flex-direction: column;
            user-select: none;
            box-shadow: -4px 0 16px rgba(0,0,0,0.06);
        }
        body[data-theme="dark"] .right-drawer-container { border-left-color: #333230; }
        .right-drawer-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .drawer-section-title { font-size: 13px; color: #888888; font-weight: bold; text-transform: uppercase; margin: 16px 0 8px 4px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        
        .api-boxed-card, .model-boxed-card { background-color: #F9F9F9; border: 1px solid #E6E6E6; border-radius: 8px; padding: 9px; display: none; flex-direction: column; box-sizing: border-box; }
        body[data-theme="dark"] .api-boxed-card, body[data-theme="dark"] .model-boxed-card { background-color: #1a1918; border-color: #333230; }
        .api-tabs-row, .model-tabs-row { display: flex; gap: 4px; margin-bottom: 6px; }
        .api-tab-btn, .model-tab-btn { border: 1px solid #E6E6E6; border-radius: 4px; font-size: 12px; background-color: transparent; color: var(--pastel_text_primary); padding: 4px 8px; cursor: pointer; font-weight: bold; }
        .api-tab-btn.active, .model-tab-btn.active { border-color: #E6E6E6; background-color: #F5E19A; color: #333333; }
        .api-input-group, .model-input-group { display: flex; flex-direction: column; gap: 6px; text-align: left; }
        .api-input-group label, .model-input-group label { font-size: 11px; font-weight: bold; color: #888888; }
        .api-textbox, .model-select-dropdown { border: 1px solid #E6E6E6; border-radius: 8px; background: var(--pastel_bg_primary); color: var(--pastel_text_primary); font-size: 13px; padding: 7px; box-sizing: border-box; outline: none; width: 100%; }
        
        .menu-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; color: var(--pastel_text_primary); display: flex; justify-content: space-between; align-items: center; user-select: none; }
        .menu-item:hover { background-color: #F9F9F9; }
        body[data-theme="dark"] .menu-item:hover { background-color: #242321; }
        .ep-chat-drawer-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 29; display: none; }

        /* 공용 모달창 */
        .ep-prompt-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 99999; display: none; align-items: center; justify-content: center; }
        .ep-prompt-overlay.visible { display: flex; }
        .ep-prompt-modal { background: #fff !important; border-radius: 12px; padding: 24px; width: 480px; max-width: 90vw; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
        body[data-theme="dark"] .ep-prompt-modal { background: #1a1918 !important; color: #F0EFEB; border: 1px solid #333; }
        .ep-epnote-modal { width: 600px !important; height: 690px !important; max-height: 90vh !important; }
        .ep-profile-textarea { width: 100%; flex: 1; padding: 10px 12px; font-size: 14px; background-color: #fafafa; border: 1px solid #E6E6E6; border-radius: 8px; color: #222; box-sizing: border-box; resize: none; outline: none; }
        body[data-theme="dark"] .ep-profile-textarea { background: #141413; color: #F0EFEB; border-color: #333; }

        /* 로어 저장소 모달 스타일 */
        .decentral-modal-container { display: none; align-items: center; justify-content: center; z-index: 999999; position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); }
        .decentral-modal { display: flex; flex-direction: column; width: 600px; max-width: 90vw; height: 690px; max-height: 90vh; border-radius: 16px; background-color: #fff; color: #2c3e50; padding: 28px; box-sizing: border-box; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
        body[data-theme="dark"] .decentral-modal { background-color: #242321; color: #F0EFEB; border: 1px solid #42413D; }
        .decentral-menu-container { display: flex; gap: 17px; border-bottom: 1px solid #eee; margin-bottom: 12px; }
        .decentral-menu-element { background: none; border: none; font-size: 14px; font-weight: 500; color: #888; padding: 0 4px 8px 4px; cursor: pointer; border-bottom: 2.5px solid transparent; }
        .decentral-menu-element[active="true"] { color: #2c3e50; border-bottom-color: #88b9c8; font-weight: bold; }
        body[data-theme="dark"] .decentral-menu-element[active="true"] { color: #fff; border-bottom-color: #bcd0d7; }
        .decentral-grid-container { flex: 1; overflow-y: auto; }
        .ep-lore-panel { display: none; }
        .ep-lore-panel.active-panel { display: flex; flex-direction: column; gap: 12px; }
    `;

    // 스타일에 태그 직접 주입
    function injectStylesSafely() {
        if (document.getElementById('pastel-injected-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'pastel-injected-styles';
        styleEl.textContent = pastelCSS;
        (document.head || document.documentElement).appendChild(styleEl);
    }
    injectStylesSafely();

    // =========================================================================
    // [2. PASTELchat 메인 뷰 HTML 템플릿]
    // =========================================================================
    function getPastelHTMLTemplate() {
        return `
            <div id="ep-pastel-injected-container">
                <div class="chat-main-wrapper">
                    <div class="ep-chat-drawer-overlay" id="ep-chat-drawer-overlay"></div>
                    <div class="chat-content-box" id="ep-chat-content-box">
                        <div style="text-align:center; padding:40px 20px; color:#888; font-size:14px;">
                            ✨ <strong>PASTELchat 모듈 1</strong> UI 이식이 완료되었습니다.<br>
                            우측 상단 모델 버튼 옆의 <strong>[추천답변]</strong> 버튼과 <strong>[점 3개 메뉴]</strong> 버튼을 확인해 보세요!
                        </div>
                    </div>

                    <!-- 플로팅 스크롤 버튼 -->
                    <div class="ep-scroll-shortcuts-container">
                        <div class="ep-scroll-btn-wrapper" id="ep-scroll-to-top-wrapper">
                            <button type="button" id="ep-scroll-to-top-btn" title="맨 위로 이동">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" d="m12 6.87 8.09 8.08-1.14 1.14L12 9.13 5.05 16.1 3.9 14.95z" clip-rule="evenodd"></path></svg>
                            </button>
                        </div>
                        <div class="ep-scroll-btn-wrapper" id="ep-scroll-to-bottom-wrapper">
                            <button type="button" id="ep-scroll-to-bottom-btn" title="맨 아래로 이동">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M20.09 8.3 12 16.4 3.91 8.3l1.14-1.13L12 14.13l6.95-6.96z" clip-rule="evenodd"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- 하단 입력 패널 (9개 구슬 완벽 탑재) -->
                    <div class="chat-footer-control">
                        <div class="input-area">
                            <textarea class="chat-textarea" id="ep-chat-input-textarea" placeholder="메시지를 입력하세요..."></textarea>
                            <div class="input-toolbar">
                                <div style="display: flex; gap: 6px; align-items: center;">
                                    <button class="tool-btn" id="ep-chat-shortcut-popup-btn" type="button" title="단축어 선택"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
                                    <button class="tool-btn" id="ep-chat-tpl-popup-btn" type="button" title="페더 템플릿"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.086 18.412A2 2 0 0 1 12.67 19H5v-7.672a2 2 0 0 1 .586-1.414L11.75 3.75a6 6 0 1 1 8.49 8.49z"/><path d="M16 8 2 22"/><path d="M17.488 15H9"/></svg></button>
                                </div>
                                <span class="vertical-divider"></span>
                                <div style="display: flex; gap: 6px; align-items: center;">
                                    <button class="tool-btn ep-symbol-btn" data-open="*" type="button" title="행동 지문"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M12 6v12"/><path d="M17.196 9 6.804 15"/><path d="m6.804 9 10.392 6"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open='"' type="button" title="쌍따옴표 대사"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:15px;height:15px;fill:#888888;"><path d="M96 280C96 213.7 149.7 160 216 160L224 160C241.7 160 256 174.3 256 192C256 209.7 241.7 224 224 224L216 224C185.1 224 160 249.1 160 280L160 288L224 288C259.3 288 288 316.7 288 352L288 416C288 451.3 259.3 480 224 480L160 480C124.7 480 96 451.3 96 416L96 280zM352 280C352 213.7 405.7 160 472 160L480 160C497.7 160 512 174.3 512 192C512 209.7 497.7 224 480 224L472 224C441.1 224 416 249.1 416 280L416 288L480 288C515.3 288 544 316.7 544 352L544 416C544 451.3 515.3 480 480 480L416 480C380.7 480 352 451.3 352 416L352 280z"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="'" type="button" title="홑따옴표 독백"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:15px;height:15px;fill:#888888;"><path d="M352 160C369.7 160 384 174.3 384 192C384 209.7 369.7 224 352 224L344 224C313.1 224 288 249.1 288 280L288 288L352 288C387.3 288 416 316.7 416 352L416 416C416 451.3 387.3 480 352 480L288 480C252.7 480 224 451.3 224 416L224 280C224 213.7 277.7 160 344 160L352 160z"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="…" type="button" title="말줄임표"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="—" type="button" title="엠대쉬"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M5 12h14"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="`" type="button" title="백틱"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="(" data-close=")" type="button" title="괄호"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="[" data-close="]" type="button" title="대괄호"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3"/><path d="M8 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3"/></svg></button>
                                    <button class="tool-btn ep-symbol-btn" data-open="(OOC：" data-close=")" type="button" title="OOC"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg></button>
                                    <button class="tool-btn" id="ep-cmd-symbol-btn" type="button" title="시스템 기호"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg></button>
                                </div>
                                <button class="hold-send-btn" id="ep-chat-send-btn" title="전송">
                                    <svg id="ep-chat-send-icon" xmlns="http://www.w3.org/2000/svg" fill="#888" viewBox="0 0 24 24" width="22" height="22"><path d="M18.77 11.13 8.5 5.2a1 1 0 0 0-1.5 .87v11.86a1 1 0 0 0 1.5 .87l10.27-5.93a1 1 0 0 0 0-1.73z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 우측 서랍 메뉴 -->
                    <div class="right-drawer-container" id="ep-chat-right-drawer">
                        <div class="right-drawer-body">
                            <div class="drawer-section-title" id="ep-api-accordion-title">
                                <span>API 설정</span>
                                <span>▼</span>
                            </div>
                            <div class="api-boxed-card" id="api-collapsible-card">
                                <div class="api-tabs-row">
                                    <button class="api-tab-btn active" id="ep-api-tab-gemini">Gemini</button>
                                    <button class="api-tab-btn" id="ep-api-tab-firebase">Firebase</button>
                                </div>
                                <div class="api-input-group">
                                    <label id="ep-api-label-text">Google Gemini API Key</label>
                                    <input type="text" class="api-textbox" id="ep-api-key-input">
                                    <textarea class="api-textbox" id="ep-api-firebase-textarea" style="display: none; height: 120px; resize: none;"></textarea>
                                </div>
                            </div>

                            <div class="drawer-section-title" id="ep-model-accordion-title">
                                <span>모델 선택</span>
                                <span>▼</span>
                            </div>
                            <div class="model-boxed-card" id="model-collapsible-card">
                                <div class="model-tabs-row">
                                    <button class="model-tab-btn active" id="ep-model-tab-lore">로어</button>
                                    <button class="model-tab-btn" id="ep-model-tab-safety">안전 필터</button>
                                </div>
                                <div class="api-tab-content" id="ep-model-lore-view">
                                    <div class="model-input-group">
                                        <label>로어 생성 모델</label>
                                        <select class="model-select-dropdown" id="ep-lore-extract-model-select">
                                            <option value="gemini-3.6-flash" selected>Gemini 3.6 Flash</option>
                                            <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="api-tab-content" id="ep-model-safety-view" style="display: none;">
                                    <div class="model-input-group">
                                        <label>안전 필터</label>
                                        <select class="model-select-dropdown">
                                            <option>BLOCK_NONE</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="drawer-section-title">어시스턴트</div>
                            <div class="menu-item" id="ep-menu-epnote-btn"><span>에피소드 노트</span></div>
                            <div class="menu-item" id="ep-menu-lore-btn"><span>로어 저장소</span></div>

                            <div class="drawer-section-title">데이터 관리</div>
                            <div class="menu-item" id="ep-menu-html-save-btn"><span>대화 저장</span></div>
                            <div class="menu-item" id="ep-menu-crack-clear-btn"><span>데이터 정리</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 에피소드 노트 모달 -->
            <div class="ep-prompt-overlay" id="ep-epnote-modal-overlay">
                <div class="ep-prompt-modal ep-epnote-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="font-size:18px; margin:0; font-weight:bold;">에피소드 노트 (미전송 메모)</h2>
                        <button id="ep-epnote-close-btn" style="background:none; border:none; cursor:pointer; font-size:18px;">✕</button>
                    </div>
                    <textarea class="ep-profile-textarea" id="ep-epnote-unsent-textarea" placeholder="AI에게 전송되지 않는 자유 비공개 메모나 설정을 입력하세요..."></textarea>
                </div>
            </div>

            <!-- 로어 저장소 모달 -->
            <div class="decentral-modal-container" id="ep-lore-storage-modal-overlay">
                <div class="decentral-modal">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <span style="font-weight:bold; font-size:17px;">로어 저장소</span>
                        <button id="ep-lore-close-btn" style="background:none; border:none; cursor:pointer; font-weight:bold; font-size:18px;">✕</button>
                    </div>
                    <div class="decentral-menu-container">
                        <button class="decentral-menu-element" active="true">활성 로어</button>
                        <button class="decentral-menu-element">실행 로그</button>
                        <button class="decentral-menu-element">로어 관리</button>
                        <button class="decentral-menu-element">로어 복원</button>
                        <button class="decentral-menu-element">설정</button>
                    </div>
                    <div class="decentral-grid-container">
                        <div class="ep-lore-panel active-panel">
                            <div style="text-align:center; padding:30px; color:#888; font-size:13px;">[모듈 5]에서 5대 탭 로어 데이터베이스가 완벽 연결됩니다.</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // [3. 크래시 없는 안전한 DOM 탐색 및 이식 엔진]
    // =========================================================================
    function tryInjectPastelShell() {
        try {
            injectStylesSafely();

            // 1. 크랙의 네이티브 에디터(.ProseMirror) 탐색
            const nativeEditor = document.querySelector('.ProseMirror');
            
            // 2. 크랙 중앙 채팅 컨테이너 탐색 (특수문자 셀렉터 대신 안전한 속성 검색)
            const chatReverseBox = document.querySelector('[data-message-group-id]')?.closest('div[class*="flex-col-reverse"]') ||
                                   document.querySelector('div[class*="flex-col-reverse"]');

            if (chatReverseBox && !document.getElementById('ep-pastel-injected-container')) {
                // 중앙 대화 영역의 최상위 부모 찾기
                const chatContainer = chatReverseBox.parentElement?.parentElement || chatReverseBox.parentElement;
                
                if (chatContainer) {
                    chatContainer.style.setProperty('display', 'none', 'important');

                    // 하단 고정 입력창 숨기기
                    const nativeBottomInput = nativeEditor?.closest('div[class*="absolute"][class*="bottom-0"]') ||
                                              document.querySelector('div[class*="absolute"][class*="bottom-0"]');
                    if (nativeBottomInput) {
                        nativeBottomInput.style.setProperty('display', 'none', 'important');
                    }

                    // 파스텔챗 마운트
                    const mountTarget = chatContainer.parentElement || document.querySelector('main') || document.body;
                    const mountPoint = document.createElement('div');
                    mountPoint.id = 'pastel-mount-point';
                    mountPoint.style.cssText = 'width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative; flex: 1; min-height: 0;';
                    mountPoint.innerHTML = getPastelHTMLTemplate();
                    
                    mountTarget.appendChild(mountPoint);
                    initModule1Events();
                    console.log('%c[PASTELchat] ✅ 중앙 대화창 & 입력창 교체 성공!', 'color: #2ecc71; font-weight: bold;');
                }
            }

            // 3. 상단 헤더 영역 탐색 및 버튼 텔레포트
            const comboboxBtn = document.querySelector('button[role="combobox"]');
            const topActionRow = comboboxBtn?.closest('div[class*="flex"]') || document.querySelector('div[class*="gap-3"][class*="items-center"]');

            if (topActionRow) {
                // [A] 추천답변 버튼 상단으로 이동
                const recBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('추천답변'));
                if (recBtn && !topActionRow.contains(recBtn)) {
                    if (comboboxBtn) {
                        comboboxBtn.after(recBtn);
                    } else {
                        topActionRow.prepend(recBtn);
                    }
                }

                // [B] 파스텔챗 점 3개 메뉴 버튼 상단에 삽입
                if (!document.getElementById('ep-chat-drawer-trigger')) {
                    const drawerBtn = document.createElement('button');
                    drawerBtn.id = 'ep-chat-drawer-trigger';
                    drawerBtn.className = 'relative inline-flex items-center justify-center p-2 rounded-md hover:bg-accent active:bg-accent/80 transition-colors';
                    drawerBtn.style.cssText = 'cursor: pointer; background: transparent; border: none; color: inherit; margin-left: 4px;';
                    drawerBtn.title = '파스텔챗 서랍 메뉴';
                    drawerBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22px" height="22px">
                            <path d="M11 11h2v2h-2zm-2.5 0h-2v2h2zm7 0h2v2h-2z"></path>
                            <path fill-rule="evenodd" d="M1.99 12c0 5.52 4.49 10.01 10.01 10.01S22.01 17.52 22.01 12 17.52 1.99 12 1.99 1.99 6.48 1.99 12m1.6 0c0-4.64 3.77-8.41 8.41-8.41s8.41 3.77 8.41 8.41-3.77 8.41-8.41 8.41S3.59 16.64 3.59 12" clip-rule="evenodd"></path>
                        </svg>
                    `;
                    topActionRow.appendChild(drawerBtn);

                    const drawer = document.getElementById('ep-chat-right-drawer');
                    const overlay = document.getElementById('ep-chat-drawer-overlay');
                    drawerBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (!drawer || !overlay) return;
                        const isOpen = drawer.style.display === 'flex';
                        drawer.style.display = isOpen ? 'none' : 'flex';
                        overlay.style.display = isOpen ? 'none' : 'block';
                    };
                }
            }
        } catch (err) {
            console.warn('[PASTELchat] 주입 대기 중:', err.message);
        }
    }

    // =========================================================================
    // [4. 이벤트 연결]
    // =========================================================================
    function initModule1Events() {
        const overlay = document.getElementById('ep-chat-drawer-overlay');
        const drawer = document.getElementById('ep-chat-right-drawer');
        if (overlay && drawer) {
            overlay.onclick = () => {
                drawer.style.display = 'none';
                overlay.style.display = 'none';
            };
        }

        // 아코디언
        const apiTitle = document.getElementById('ep-api-accordion-title');
        const apiCard = document.getElementById('api-collapsible-card');
        if (apiTitle && apiCard) {
            apiTitle.onclick = () => apiCard.style.display = apiCard.style.display === 'flex' ? 'none' : 'flex';
        }

        const modelTitle = document.getElementById('ep-model-accordion-title');
        const modelCard = document.getElementById('model-collapsible-card');
        if (modelTitle && modelCard) {
            modelTitle.onclick = () => modelCard.style.display = modelCard.style.display === 'flex' ? 'none' : 'flex';
        }

        // 에피소드 노트
        const epNoteBtn = document.getElementById('ep-menu-epnote-btn');
        const epNoteModal = document.getElementById('ep-epnote-modal-overlay');
        const epNoteClose = document.getElementById('ep-epnote-close-btn');
        if (epNoteBtn && epNoteModal) {
            epNoteBtn.onclick = () => epNoteModal.classList.add('visible');
            epNoteClose.onclick = () => epNoteModal.classList.remove('visible');
        }

        // 로어 저장소
        const loreBtn = document.getElementById('ep-menu-lore-btn');
        const loreModal = document.getElementById('ep-lore-storage-modal-overlay');
        const loreClose = document.getElementById('ep-lore-close-btn');
        if (loreBtn && loreModal) {
            loreBtn.onclick = () => loreModal.style.display = 'flex';
            loreClose.onclick = () => loreModal.style.display = 'none';
        }

        // 9개 구슬 버튼 입력창 주입
        const textarea = document.getElementById('ep-chat-input-textarea');
        document.querySelectorAll('.ep-symbol-btn').forEach(btn => {
            btn.onclick = () => {
                if (!textarea) return;
                const open = btn.dataset.open || '';
                const close = btn.dataset.close || '';
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + open + close + textarea.value.substring(end);
                textarea.focus();
                textarea.setSelectionRange(start + open.length, start + open.length);
            };
        });
    }

    // =========================================================================
    // [5. 상시 감시 루프]
    // =========================================================================
    setInterval(tryInjectPastelShell, 300);
})();
