// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      2.0.2
// @description  Bypass CORS and bridge PASTELchat crack.html with crack.wrtn.ai APIs
// @author       PASTELchat
// @match        *://*/*crack.html*
// @match        *://*/*
// @match        file:///*
// @match        https://crack.wrtn.ai/*
// @include      *crack.html*
// @include      file://*crack.html*
// @include      *://*/*crack.html*
// @include      https://crack.wrtn.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      crack-api.wrtn.ai
// @connect      crack.wrtn.ai
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // [1. crack.wrtn.ai 공식 사이트: 토큰 자동 캐싱 & B방식 자동 입력 매크로]
    // =========================================================================
    if (location.hostname.includes('wrtn.ai')) {
        const checkToken = () => {
            const cookies = document.cookie.split(';');
            for (let c of cookies) {
                const [k, v] = c.trim().split('=');
                if (k === 'access_token' && v) {
                    GM_setValue('crack_access_token', decodeURIComponent(v));
                }
            }
        };
        checkToken();
        setInterval(checkToken, 3000);

        // 파스텔챗에서 전달된 자동 발송 매크로 실행 (ProseMirror 리치에디터 및 로딩 지연 완벽 대응)
        const dispatchData = GM_getValue('pastel_macro_dispatch', null);
        if (dispatchData && dispatchData.message) {
            const startTime = Date.now();
            let isExecuted = false;

            const macroTimer = setInterval(() => {
                // ProseMirror 에디터 또는 일반 contenteditable 에디터 검색
                const editor = document.querySelector('.ProseMirror') ||
                               document.querySelector('[contenteditable="true"]') ||
                               document.querySelector('div[role="textbox"]') ||
                               document.querySelector('textarea');

                // 사용자님이 제공해주신 전송 버튼 (d="M18.77" SVG 패스 타겟팅)
                const sendBtn = Array.from(document.querySelectorAll('button')).find(b => 
                    b.innerHTML.includes('M18.77') || 
                    b.querySelector('path[d*="M18.77"]') ||
                    (b.querySelector('svg') && !b.disabled && (b.style.backgroundColor.includes('196') || b.className.includes('bg-primary')))
                );

                if (editor && !isExecuted) {
                    isExecuted = true;
                    clearInterval(macroTimer);
                    GM_setValue('pastel_macro_dispatch', null);

                    // 1) ProseMirror 에디터 포커스 및 텍스트 안전 주입
                    editor.focus();
                    
                    // DOM execCommand 및 클립보드 방식 주입 (ProseMirror 내부 상태 강제 갱신)
                    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                        document.execCommand('selectAll', false, null);
                        document.execCommand('insertText', false, dispatchData.message);
                    } else {
                        editor.innerHTML = `<p>${dispatchData.message.replace(/\n/g, '<br>')}</p>`;
                    }

                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    editor.dispatchEvent(new Event('change', { bubbles: true }));
                    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: dispatchData.message }));

                    // 2) 0.6초 대기 후 정품 전송 버튼 클릭 (전송 버튼 활성화 보장)
                    setTimeout(() => {
                        const activeSendBtn = Array.from(document.querySelectorAll('button')).find(b => 
                            b.innerHTML.includes('M18.77') || 
                            b.querySelector('path[d*="M18.77"]') ||
                            !b.disabled && b.querySelector('svg')
                        );

                        if (activeSendBtn) {
                            activeSendBtn.click();
                        } else {
                            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                        }

                        // 3) 발송 완료 후 2초 뒤 파스텔챗으로 자동 복귀
                        setTimeout(() => {
                            if (dispatchData.returnUrl) {
                                window.location.href = dispatchData.returnUrl;
                            }
                        }, 2000);
                    }, 600);
                }

                // 모바일 긴 로딩 대비 40초 안전 타임아웃
                if (Date.now() - startTime > 40000) {
                    clearInterval(macroTimer);
                    GM_setValue('pastel_macro_dispatch', null);
                    if (dispatchData.returnUrl) window.location.href = dispatchData.returnUrl;
                }
            }, 500);
        }
        return;
    }

    // =========================================================================
    // [2. crack.html 통신 리스너: 순정 대화목록/캐시 조회 + 매크로 신호 수신]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // B방식 매크로 발송 데이터 저장
        if (event.data.source === 'PASTEL_CRACK_MACRO_DISPATCH') {
            GM_setValue('pastel_macro_dispatch', {
                message: event.data.message,
                chatId: event.data.chatId,
                storyId: event.data.storyId,
                returnUrl: event.data.returnUrl,
                t: Date.now()
            });
            return;
        }

        // 100% 순정 HTTP 요청 처리기 (대화목록/과거기록/캐시 조회 완벽 작동)
        if (event.data.source === 'PASTEL_CRACK_REQUEST') {
            const { reqId, method, url, headers, data, responseType } = event.data;
            const cachedToken = GM_getValue('crack_access_token', '');

            const reqHeaders = Object.assign({
                'Origin': 'https://crack.wrtn.ai',
                'Referer': 'https://crack.wrtn.ai/',
                'platform': 'web',
                'wrtn-locale': 'ko-KR',
                'x-wrtn-id': 'W2.2.7ee13701.b310.4f07.a89b.36d023805b50'
            }, headers || {});

            if (cachedToken && !reqHeaders['authorization'] && !reqHeaders['Authorization']) {
                const clean = cachedToken.replace(/^Bearer\s+/i, '').trim();
                reqHeaders['authorization'] = `Bearer ${clean}`;
            }

            GM_xmlhttpRequest({
                method: method || 'GET',
                url: url,
                headers: reqHeaders,
                data: data,
                responseType: responseType || 'text',
                withCredentials: true,
                timeout: event.data.timeout || 120000,
                onload: function(res) {
                    let parsed = res.responseText;
                    try {
                        parsed = JSON.parse(res.responseText);
                    } catch (_) {}

                    window.postMessage({
                        source: 'PASTEL_CRACK_RESPONSE',
                        reqId: reqId,
                        status: res.status,
                        statusText: res.statusText,
                        data: parsed,
                        rawText: res.responseText
                    }, '*');
                },
                onerror: function(err) {
                    window.postMessage({
                        source: 'PASTEL_CRACK_RESPONSE',
                        reqId: reqId,
                        status: 0,
                        error: err.error || 'Network/Bridge Error'
                    }, '*');
                }
            });
        }
    });

    // 브릿지 활성화 신호 주입
    window.PASTEL_CRACK_BRIDGE_READY = true;
    document.addEventListener('DOMContentLoaded', () => {
        window.postMessage({ source: 'PASTEL_CRACK_BRIDGE_READY' }, '*');
    });
})();
