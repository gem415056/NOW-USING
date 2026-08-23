// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      2.0.8
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

        // 파스텔챗에서 전달된 텍스트 자동 입력 & '돌아가기' 알약 플로팅 버튼 탑재
        const dispatchData = GM_getValue('pastel_macro_dispatch', null);
        if (dispatchData) {
            const returnUrl = dispatchData.returnUrl || '';

            // [파스텔챗 순정 토스트 1:1 커스텀 알약 버튼 주입]
            const injectReturnPillButton = () => {
                if (document.getElementById('pastel-return-floating-pill')) return;
                const pill = document.createElement('div');
                pill.id = 'pastel-return-floating-pill';
                pill.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);z-index:2147483647;cursor:pointer;user-select:none;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4);background-color:#3a001e !important;border:1.5px solid #FF4432 !important;border-radius:9999px !important;padding:9px 16px !important;transition:transform 0.15s ease, opacity 0.15s ease;pointer-events:auto;';
                
                pill.innerHTML = `<p style="color:#fff5f1 !important;font-size:12px !important;font-weight:bold !important;margin:0 !important;white-space:nowrap !important;line-height:1 !important;">돌아가기</p>`;

                pill.onclick = () => {
                    GM_setValue('pastel_macro_dispatch', null);
                    if (returnUrl) {
                        window.location.href = returnUrl;
                    } else {
                        window.history.back();
                    }
                };

                (document.body || document.documentElement).appendChild(pill);
            };

            injectReturnPillButton();

            // 입력창에 텍스트만 쏙 넣어주는 루프 (전송 버튼 누르지 않음)
            if (dispatchData.message) {
                const startTime = Date.now();
                const inputTimer = setInterval(() => {
                    const editor = document.querySelector('.ProseMirror') ||
                                   document.querySelector('[contenteditable="true"]') ||
                                   document.querySelector('div[role="textbox"]') ||
                                   document.querySelector('textarea');

                    if (editor) {
                        clearInterval(inputTimer);
                        editor.focus();

                        if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                            document.execCommand('selectAll', false, null);
                            document.execCommand('insertText', false, dispatchData.message);
                        } else {
                            editor.innerHTML = `<p>${dispatchData.message.replace(/\n/g, '<br>')}</p>`;
                        }

                        editor.dispatchEvent(new Event('input', { bubbles: true }));
                        editor.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    if (Date.now() - startTime > 30000) {
                        clearInterval(inputTimer);
                    }
                }, 400);
            }
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
