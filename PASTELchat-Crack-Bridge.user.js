// ==UserScript==
// @name         PASTELchat Crack API Bridge
// @namespace    https://github.com/
// @version      1.3.8
// @description  Bypass CORS and bridge PASTELchat crack.html with crack.wrtn.ai APIs
// @author       Gemini
// @match        *://*/*crack.html*
// @match        https://crack.wrtn.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @connect      crack-api.wrtn.ai
// @connect      crack.wrtn.ai
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // [1. crack.wrtn.ai 공식 사이트: 자동 입력 ➔ 전송 ➔ 파스텔챗 복귀 매크로]
    // =========================================================================
    if (location.hostname.includes('wrtn.ai')) {
        // 쿠키 토큰 실시간 자동 동기화
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

        // 파스텔챗에서 전달된 자동 발송 매크로 감지
        const dispatchData = GM_getValue('pastel_macro_dispatch', null);
        if (dispatchData && dispatchData.message) {
            const startTime = Date.now();
            const macroTimer = setInterval(() => {
                const ta = document.querySelector('textarea');
                if (ta) {
                    clearInterval(macroTimer);
                    GM_setValue('pastel_macro_dispatch', null);

                    // 1) 크랙 공식 입력창에 글자 넣기 (로어 2000자 완벽 입력)
                    ta.focus();
                    ta.value = dispatchData.message;
                    ta.dispatchEvent(new Event('input', { bubbles: true }));
                    ta.dispatchEvent(new Event('change', { bubbles: true }));

                    // 2) 0.3초 후 크랙 공식 전송 버튼 클릭 (또는 엔터)
                    setTimeout(() => {
                        const sendBtn = document.querySelector('button[type="submit"]') ||
                                        Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('svg') && !b.disabled);
                        if (sendBtn) {
                            sendBtn.click();
                        } else {
                            ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                        }

                        // 3) 전송 후 1.5초 뒤 파스텔챗으로 자동 복귀!
                        setTimeout(() => {
                            if (dispatchData.returnUrl) {
                                window.location.href = dispatchData.returnUrl;
                            }
                        }, 1500);
                    }, 300);
                }

                // 15초 타임아웃 안전 복귀
                if (Date.now() - startTime > 15000) {
                    clearInterval(macroTimer);
                    GM_setValue('pastel_macro_dispatch', null);
                    if (dispatchData.returnUrl) window.location.href = dispatchData.returnUrl;
                }
            }, 300);
        }
        return;
    }

    // =========================================================================
    // [2. crack.html 통신 중계 리스너 (대화목록/캐시/과거기록 100% 정상 조회)]
    // =========================================================================
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        // B방식 매크로 발송 신호
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

        // 일반 HTTP/REST 요청 처리기 (대화목록, 과거기록, 캐시 조회)
        if (event.data.source === 'PASTEL_CRACK_REQUEST') {
            const { reqId, method, url, headers, data, responseType, token: customToken } = event.data;
            const cachedToken = GM_getValue('crack_access_token', '');

            const reqHeaders = Object.assign({
                'Origin': 'https://crack.wrtn.ai',
                'Referer': 'https://crack.wrtn.ai/',
                'platform': 'web',
                'wrtn-locale': 'ko-KR',
                'x-wrtn-id': 'W2.2.7ee13701.b310.4f07.a89b.36d023805b50'
            }, headers || {});

            const rawToken = reqHeaders['authorization'] || reqHeaders['Authorization'] || customToken || cachedToken;
            if (rawToken) {
                const clean = rawToken.replace(/^Bearer\s+/i, '').trim();
                reqHeaders['authorization'] = `Bearer ${clean}`;
                reqHeaders['Authorization'] = `Bearer ${clean}`;
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
            return;
        }
    });

    // 브릿지 활성화 신호 주입
    window.PASTEL_CRACK_BRIDGE_READY = true;
    document.addEventListener('DOMContentLoaded', () => {
        window.postMessage({ source: 'PASTEL_CRACK_BRIDGE_READY' }, '*');
    });
})();
